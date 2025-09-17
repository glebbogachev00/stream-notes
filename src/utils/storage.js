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
const ARRAY_MERGE_KEYS = new Set(['stream_notes', 'stream_saved_notes', 'stream_art_notes']);

const loadMeta = (syncKey = '') => {
  try {
    const raw = localStorage.getItem(SYNC_META_KEY);
    if (!raw) {
      return { lastSyncedAt: 0 };
    }
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.key !== syncKey) {
      return { lastSyncedAt: 0 };
    }
    return {
      lastSyncedAt: Number(parsed.lastSyncedAt) || 0
    };
  } catch (error) {
    return { lastSyncedAt: 0 };
  }
};

const saveMeta = (syncKey, meta) => {
  if (!syncKey) return;
  try {
    localStorage.setItem(
      SYNC_META_KEY,
      JSON.stringify({ key: syncKey, lastSyncedAt: Number(meta.lastSyncedAt) || 0 })
    );
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
      onLastSyncedChange = null,
      supabaseClient = null,
      supabaseTable = process.env.REACT_APP_SUPABASE_STORAGE_TABLE || 'storage_items'
    } = options;

    this.syncEnabled = !!syncEnabled;
    this.endpoint = (endpoint || '').trim();
    this.syncKey = (syncKey || localStorage.getItem('stream-sync-key') || '').trim();
    this.onStatusChange = onStatusChange;
    this.onLastSyncedChange = onLastSyncedChange;
    this.metadata = loadMeta(this.syncKey);
    this.supabase = supabaseClient;
    this.supabaseTable = supabaseTable;

    this.useExtensionSync = this.syncEnabled && isExtensionContext();
    this.useSupabase = this.syncEnabled && !this.useExtensionSync && !!this.supabase && !!this.syncKey;
    this.useEndpointSync = this.syncEnabled && !this.useExtensionSync && !this.useSupabase && !!this.endpoint && !!this.syncKey;
    this.useRemoteSync = this.useSupabase || this.useEndpointSync;

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

    if (this.syncEnabled && this.useRemoteSync && (this.metadata.lastSyncedAt || 0) === 0) {
      this.queueAllLocalData();
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
    saveMeta(this.syncKey, this.metadata);
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

  queueAllLocalData() {
    if (!this.useRemoteSync) {
      return;
    }

    const now = Date.now();
    SYNC_KEYS.forEach((key) => {
      const value = localStorage.getItem(key);
      if (value !== null) {
        this.pendingChanges.set(key, {
          key,
          value,
          updatedAt: now,
          deletedAt: null
        });
      }
    });
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

    if (this.useSupabase) {
      await this.pushWithSupabase(items);
      return;
    }

    if (!this.endpoint) {
      return;
    }

    let response;
    try {
      response = await fetch(`${this.endpoint}/sync/push`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: this.syncKey,
          items
        })
      });
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        // Server is not available - silently skip sync
        console.warn('[storage] sync endpoint unavailable, skipping push');
        return;
      }
      throw error;
    }

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

    if (this.useSupabase) {
      await this.pullFromSupabase();
      return;
    }

    if (!this.endpoint) {
      return;
    }

    let response;
    try {
      response = await fetch(`${this.endpoint}/sync/pull`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: this.syncKey,
          since: this.metadata.lastSyncedAt || 0
        })
      });
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        // Server is not available - silently skip sync
        console.warn('[storage] sync endpoint unavailable, skipping pull');
        return;
      }
      throw error;
    }

    if (!response.ok) {
      throw new Error('Failed to pull changes');
    }

    const payload = await response.json();
    const { items = [], timestamp } = payload;
    const updatedKeys = [];
    const remoteKeys = new Set();

    items.forEach((item) => {
      remoteKeys.add(item.key);

      if (item.deletedAt) {
        if (localStorage.getItem(item.key) !== null) {
          localStorage.removeItem(item.key);
          updatedKeys.push(item.key);
        }
        this.pendingChanges.delete(item.key);
        return;
      }

      if (!item.value) {
        return;
      }

      if (ARRAY_MERGE_KEYS.has(item.key)) {
        const { mergedValue, localChanged, shouldPush } = this.mergeCollectionValue(item.key, item.value);
        if (localChanged) {
          updatedKeys.push(item.key);
        }
        if (shouldPush) {
          this.pendingChanges.set(item.key, {
            key: item.key,
            value: mergedValue,
            updatedAt: Date.now(),
            deletedAt: null
          });
        }
      } else {
        const localValue = localStorage.getItem(item.key);
        if (localValue !== item.value) {
          localStorage.setItem(item.key, item.value);
          updatedKeys.push(item.key);
        }
      }
    });

    // Ensure purely local data is queued for push if remote doesn't know about it yet
    if (this.useRemoteSync) {
      const now = Date.now();
      SYNC_KEYS.forEach((key) => {
        if (remoteKeys.has(key)) {
          return;
        }
        const localValue = localStorage.getItem(key);
        if (localValue !== null) {
          this.pendingChanges.set(key, {
            key,
            value: localValue,
            updatedAt: now,
            deletedAt: null
          });
        }
      });
    }

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
      await this.pullRemoteChanges();
      await this.pushPendingChanges();
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
    if (this.useSupabase) {
      return true;
    }
    return typeof fetch === 'function';
  }

  mergeCollectionValue(key, remoteValue) {
    const parseValue = (value) => {
      if (!value) return [];
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch (error) {
        return [];
      }
    };

    const getTimestamp = (item) => {
      if (!item || typeof item !== 'object') {
        return 0;
      }
      return Number(item.updatedAt ?? item.createdAt ?? 0) || 0;
    };

    const remoteItems = parseValue(remoteValue);
    const localValue = localStorage.getItem(key);
    const localItems = parseValue(localValue);

    const remoteMap = new Map();
    const localMap = new Map();

    remoteItems.forEach((item) => {
      if (item && typeof item === 'object' && item.id) {
        remoteMap.set(item.id, item);
      }
    });

    localItems.forEach((item) => {
      if (item && typeof item === 'object' && item.id) {
        localMap.set(item.id, item);
      }
    });

    const lastSyncTime = this.metadata.lastSyncedAt || 0;
    const mergedItems = [];
    const seenIds = new Set();
    let localChanged = false;
    let shouldPush = false;

    localItems.forEach((localItem) => {
      if (!localItem || typeof localItem !== 'object' || !localItem.id) {
        return;
      }

      const remoteItem = remoteMap.get(localItem.id);
      seenIds.add(localItem.id);

      if (!remoteItem) {
        const localTimestamp = getTimestamp(localItem);
        const isNewLocalItem = !localTimestamp || localTimestamp > lastSyncTime;

        if (isNewLocalItem) {
          mergedItems.push(localItem);
          shouldPush = true;
        } else {
          // Remote deleted this item after the last sync; drop it locally
          localChanged = true;
        }
        return;
      }

      const localTimestamp = getTimestamp(localItem);
      const remoteTimestamp = getTimestamp(remoteItem);

      if (remoteTimestamp > localTimestamp) {
        const remoteString = JSON.stringify(remoteItem);
        const localString = JSON.stringify(localItem);
        if (remoteString !== localString) {
          localChanged = true;
        }
        mergedItems.push(remoteItem);
      } else {
        // Local copy is newer or equal - keep it and ensure remote catches up if needed
        mergedItems.push(localItem);
        if (localTimestamp > remoteTimestamp) {
          shouldPush = true;
        } else if (localTimestamp === remoteTimestamp) {
          const remoteString = JSON.stringify(remoteItem);
          const localString = JSON.stringify(localItem);
          if (remoteString !== localString) {
            shouldPush = true;
          }
        }
      }
    });

    remoteItems.forEach((remoteItem) => {
      if (!remoteItem || typeof remoteItem !== 'object' || !remoteItem.id) {
        return;
      }
      if (seenIds.has(remoteItem.id)) {
        return;
      }

      const remoteTimestamp = getTimestamp(remoteItem);
      if (!remoteTimestamp || remoteTimestamp > lastSyncTime) {
        mergedItems.push(remoteItem);
        localChanged = true;
      } else {
        // Remote item predates our last sync; ensure remote receives the local state
        shouldPush = true;
      }
    });

    const mergedValue = JSON.stringify(mergedItems);
    if (localValue !== mergedValue) {
      localChanged = true;
      localStorage.setItem(key, mergedValue);
    }

    return { mergedValue, localChanged, shouldPush };
  }

  async pushWithSupabase(items) {
    if (!this.supabase || !this.supabaseTable) {
      return;
    }

    const payload = items.map((change) => ({
      user_id: this.syncKey,
      key: change.key,
      value: change.value,
      updated_at: change.updatedAt,
      deleted_at: change.deletedAt ?? null
    }));

    if (payload.length === 0) {
      return;
    }

    const { error } = await this.supabase
      .from(this.supabaseTable)
      .upsert(payload, { onConflict: 'user_id,key' });

    if (error) {
      throw new Error(error.message || 'Failed to push changes');
    }

    this.pendingChanges.clear();
    const maxTimestamp = payload.reduce((max, item) => {
      return Math.max(max, Number(item.updated_at) || 0, Number(item.deleted_at) || 0);
    }, this.metadata.lastSyncedAt || 0);
    this.updateLastSynced(maxTimestamp || Date.now());
  }

  async pullFromSupabase() {
    if (!this.supabase || !this.supabaseTable) {
      return;
    }

    const lastSynced = this.metadata.lastSyncedAt || 0;
    const { data, error } = await this.supabase
      .from(this.supabaseTable)
      .select('key,value,updated_at,deleted_at')
      .eq('user_id', this.syncKey)
      .gt('updated_at', lastSynced)
      .order('updated_at', { ascending: true });

    if (error) {
      throw new Error(error.message || 'Failed to pull changes');
    }

    const items = Array.isArray(data) ? data : [];
    const updatedKeys = [];
    const remoteKeys = new Set();
    let maxTimestamp = lastSynced;

    items.forEach((item) => {
      const key = item.key;
      const deletedAt = item.deleted_at ?? null;
      const value = item.value;
      const updatedAt = Number(item.updated_at) || 0;

      remoteKeys.add(key);
      maxTimestamp = Math.max(maxTimestamp, updatedAt, deletedAt || 0);

      if (deletedAt) {
        if (localStorage.getItem(key) !== null) {
          localStorage.removeItem(key);
          updatedKeys.push(key);
        }
        this.pendingChanges.delete(key);
        return;
      }

      if (!value) {
        return;
      }

      if (ARRAY_MERGE_KEYS.has(key)) {
        const { mergedValue, localChanged, shouldPush } = this.mergeCollectionValue(key, value);
        if (localChanged) {
          updatedKeys.push(key);
        }
        if (shouldPush) {
          this.pendingChanges.set(key, {
            key,
            value: mergedValue,
            updatedAt: Date.now(),
            deletedAt: null
          });
        }
      } else {
        const localValue = localStorage.getItem(key);
        if (localValue !== value) {
          localStorage.setItem(key, value);
          updatedKeys.push(key);
        }
      }
    });

    // Queue local-only keys for upload
    const now = Date.now();
    SYNC_KEYS.forEach((key) => {
      if (remoteKeys.has(key)) {
        return;
      }
      const localValue = localStorage.getItem(key);
      if (localValue !== null) {
        this.pendingChanges.set(key, {
          key,
          value: localValue,
          updatedAt: now,
          deletedAt: null
        });
      }
    });

    this.updateLastSynced(maxTimestamp || Date.now());

    if (updatedKeys.length > 0 && typeof window !== 'undefined') {
      const event = new CustomEvent('stream-sync-update', {
        detail: { keys: updatedKeys }
      });
      window.dispatchEvent(event);
    }
  }
}

export default StorageAdapter;
