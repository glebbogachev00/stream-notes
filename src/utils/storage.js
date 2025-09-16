const isExtensionContext = () => {
  try {
    return typeof window !== 'undefined' &&
      typeof window.chrome !== 'undefined' &&
      window.chrome.storage &&
      window.chrome.storage.sync;
  } catch (error) {
    return false;
  }
};

const SYNC_META_KEY = 'stream-sync-meta';
const SYNC_KEYS = ['stream_notes', 'stream_saved_notes', 'stream_art_notes', 'stream-settings'];

const loadMeta = () => {
  try {
    const raw = localStorage.getItem(SYNC_META_KEY);
    if (!raw) {
      return { lastSyncedAt: 0 };
    }
    const parsed = JSON.parse(raw);
    return {
      lastSyncedAt: Number(parsed.lastSyncedAt) || 0
    };
  } catch (error) {
    return { lastSyncedAt: 0 };
  }
};

const saveMeta = (meta) => {
  try {
    localStorage.setItem(SYNC_META_KEY, JSON.stringify(meta));
  } catch (error) {
    // Ignore persistence failures to avoid breaking main flow
  }
};

class StorageAdapter {
  constructor(options = {}) {
    const {
      syncEnabled = false,
      endpoint = '',
      syncKey = '',
      onStatusChange = null,
      onLastSyncedChange = null
    } = options;

    this.syncEnabled = !!syncEnabled;
    this.endpoint = (endpoint || process.env.REACT_APP_SYNC_URL || '').trim();
    this.syncKey = (syncKey || localStorage.getItem('stream-sync-key') || '').trim();
    this.onStatusChange = onStatusChange;
    this.onLastSyncedChange = onLastSyncedChange;
    this.metadata = loadMeta();

    this.useExtensionSync = this.syncEnabled && isExtensionContext();
    this.useRemoteSync = this.syncEnabled && !this.useExtensionSync && !!this.endpoint && !!this.syncKey;

    this.pendingChanges = new Map();
    this.syncPromise = null;
    this.status = this.syncEnabled ? 'idle' : 'local';

    if (this.syncEnabled && this.useRemoteSync) {
      this.updateStatus('idle');
    } else if (this.syncEnabled && !this.useExtensionSync) {
      // Sync requested but not fully configured
      this.syncEnabled = false;
      this.updateStatus('local');
    }
  }

  updateStatus(status) {
    this.status = status;
    if (this.onStatusChange) {
      this.onStatusChange(status);
    }
  }

  updateLastSynced(timestamp) {
    if (!timestamp) return;
    this.metadata.lastSyncedAt = Math.max(this.metadata.lastSyncedAt || 0, timestamp);
    saveMeta(this.metadata);
    if (this.onLastSyncedChange) {
      this.onLastSyncedChange(this.metadata.lastSyncedAt);
    }
  }

  async get(key) {
    if (this.useExtensionSync) {
      return new Promise((resolve) => {
        window.chrome.storage.sync.get([key], (result) => {
          resolve(result[key] || null);
        });
      });
    }

    return Promise.resolve(localStorage.getItem(key));
  }

  enqueueChange(key, value, deletedAt = null) {
    if (!this.useRemoteSync) {
      return;
    }

    const change = {
      key,
      value: value ?? null,
      updatedAt: Date.now(),
      deletedAt
    };
    this.pendingChanges.set(key, change);
  }

  async set(key, value) {
    if (this.useExtensionSync) {
      return new Promise((resolve, reject) => {
        const data = { [key]: value };
        window.chrome.storage.sync.set(data, () => {
          if (window.chrome.runtime.lastError) {
            reject(window.chrome.runtime.lastError);
          } else {
            resolve();
          }
        });
      });
    }

    localStorage.setItem(key, value);
    this.enqueueChange(key, value, null);
    this.scheduleSync();
    return Promise.resolve();
  }

  async remove(key) {
    if (this.useExtensionSync) {
      return new Promise((resolve, reject) => {
        window.chrome.storage.sync.remove(key, () => {
          if (window.chrome.runtime.lastError) {
            reject(window.chrome.runtime.lastError);
          } else {
            resolve();
          }
        });
      });
    }

    localStorage.removeItem(key);
    this.enqueueChange(key, null, Date.now());
    this.scheduleSync();
    return Promise.resolve();
  }

  async clear() {
    if (this.useExtensionSync) {
      return new Promise((resolve, reject) => {
        window.chrome.storage.sync.clear(() => {
          if (window.chrome.runtime.lastError) {
            reject(window.chrome.runtime.lastError);
          } else {
            resolve();
          }
        });
      });
    }

    SYNC_KEYS.forEach((key) => {
      localStorage.removeItem(key);
      this.enqueueChange(key, null, Date.now());
    });
    this.scheduleSync();
    return Promise.resolve();
  }

  async pushPendingChanges() {
    if (!this.useRemoteSync) {
      return;
    }

    const items = Array.from(this.pendingChanges.values());
    if (items.length === 0) {
      return;
    }

    const response = await fetch(`${this.endpoint}/sync/push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: this.syncKey,
        items
      })
    });

    if (!response.ok) {
      throw new Error('Failed to push changes');
    }

    const payload = await response.json();
    this.pendingChanges.clear();
    this.updateLastSynced(payload.timestamp);
  }

  async pullRemoteChanges() {
    if (!this.useRemoteSync) {
      return;
    }

    const response = await fetch(`${this.endpoint}/sync/pull`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: this.syncKey,
        since: this.metadata.lastSyncedAt || 0
      })
    });

    if (!response.ok) {
      throw new Error('Failed to pull changes');
    }

    const payload = await response.json();
    const { items = [], timestamp } = payload;
    const updatedKeys = [];

    items.forEach((item) => {
      if (item.deletedAt) {
        localStorage.removeItem(item.key);
        updatedKeys.push(item.key);
      } else if (typeof item.value === 'string') {
        localStorage.setItem(item.key, item.value);
        updatedKeys.push(item.key);
      }
    });

    this.updateLastSynced(timestamp);

    if (updatedKeys.length > 0 && typeof window !== 'undefined') {
      const event = new CustomEvent('stream-sync-update', {
        detail: { keys: updatedKeys }
      });
      window.dispatchEvent(event);
    }
  }

  async performSync() {
    if (!this.useRemoteSync) {
      return;
    }

    this.updateStatus('syncing');
    try {
      await this.pushPendingChanges();
      await this.pullRemoteChanges();
      this.updateStatus('synced');
    } catch (error) {
      console.error('[storage] sync error', error);
      this.updateStatus('error');
      throw error;
    }
  }

  async syncNow() {
    if (!this.useRemoteSync) {
      return Promise.resolve();
    }

    if (this.syncPromise) {
      return this.syncPromise;
    }

    this.syncPromise = this.performSync()
      .catch((error) => {
        throw error;
      })
      .finally(() => {
        this.syncPromise = null;
      });

    return this.syncPromise;
  }

  scheduleSync() {
    if (!this.useRemoteSync) {
      return;
    }

    // Debounce sync requests to avoid spamming the server during rapid updates
    clearTimeout(this.syncTimeout);
    this.syncTimeout = setTimeout(() => {
      this.syncNow().catch(() => {
        // Errors are surfaced through status updates; keep local queue for retry
      });
    }, 500);
  }

  isSyncEnabled() {
    return this.syncEnabled && (this.useExtensionSync || this.useRemoteSync);
  }

  getStatus() {
    return this.status;
  }

  getLastSyncedAt() {
    return this.metadata.lastSyncedAt || 0;
  }

  isSyncSupported() {
    if (this.useExtensionSync) {
      return true;
    }
    return typeof fetch === 'function';
  }
}

export default StorageAdapter;
