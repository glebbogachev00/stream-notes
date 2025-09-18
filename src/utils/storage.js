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
const PRIMARY_KEYS = ['stream_notes', 'stream_saved_notes'];
const SYNC_KEYS = [...PRIMARY_KEYS, 'stream_art_notes', 'stream-syncable-settings', 'stream-settings'];
const HISTORY_KEY = 'stream-sync-history';
const HISTORY_LIMIT = 15;
const BACKUP_INTERVAL = 20 * 60 * 1000; // 20 minutes in milliseconds
const ARRAY_MERGE_KEYS = new Set(['stream_notes', 'stream_saved_notes', 'stream_art_notes']);

const parseJSON = (value, fallback = {}) => {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
};
const BACKUP_KEYS = [...SYNC_KEYS, 'stream-syncable-settings', 'stream-local-settings'];

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

const parseCollection = (value) => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
};

const loadHistory = () => {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
};

const saveHistory = (entries) => {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
  } catch (error) {
    // best effort
  }
};

const getCurrentFolders = () => {
  const syncableSettings = parseJSON(localStorage.getItem('stream-syncable-settings'));
  if (Array.isArray(syncableSettings.folders) && syncableSettings.folders.length > 0) {
    return syncableSettings.folders;
  }

  const legacySettings = parseJSON(localStorage.getItem('stream-settings'));
  if (Array.isArray(legacySettings.folders)) {
    return legacySettings.folders;
  }

  return [];
};

const mergeFolders = (localFolders = [], remoteFolders = []) => {
  const normalize = (name) => (name || '').trim();
  const seen = new Set();
  const result = [];

  [...localFolders, ...remoteFolders].forEach((folder) => {
    const normalized = normalize(folder);
    if (!normalized) {
      return;
    }
    const key = normalized.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(normalized);
    }
  });

  return result;
};

const mergeSyncableSettings = (localValue, remoteValue) => {
  const local = parseJSON(localValue, {});
  const remote = parseJSON(remoteValue, {});

  const merged = { ...local, ...remote };

  const localFolders = Array.isArray(local.folders) ? local.folders : [];
  const remoteFolders = Array.isArray(remote.folders) ? remote.folders : [];
  const localFoldersUpdatedAt = Number(local.foldersUpdatedAt) || 0;
  const remoteFoldersUpdatedAt = Number(remote.foldersUpdatedAt) || 0;

  if (remoteFoldersUpdatedAt > localFoldersUpdatedAt) {
    merged.folders = remoteFolders;
    merged.foldersUpdatedAt = remoteFoldersUpdatedAt;
  } else if (localFoldersUpdatedAt > remoteFoldersUpdatedAt) {
    merged.folders = localFolders;
    merged.foldersUpdatedAt = localFoldersUpdatedAt;
  } else {
    if (remoteFolders.length && !localFolders.length) {
      merged.folders = remoteFolders;
    } else if (localFolders.length && !remoteFolders.length) {
      merged.folders = localFolders;
    } else if (remoteFolders.length && localFolders.length) {
      merged.folders = mergeFolders(localFolders, remoteFolders);
    }
    merged.foldersUpdatedAt = localFoldersUpdatedAt || remoteFoldersUpdatedAt || (merged.folders?.length ? Date.now() : 0);
  }

  return JSON.stringify(merged);
};

const shouldCreateBackup = (key) => {
  if (!PRIMARY_KEYS.includes(key)) {
    return false;
  }
  
  try {
    const lastBackupKey = `${key}_last_backup_time`;
    const lastBackupTime = localStorage.getItem(lastBackupKey);
    const now = Date.now();
    
    if (!lastBackupTime) {
      // No previous backup, create one
      localStorage.setItem(lastBackupKey, now.toString());
      return true;
    }
    
    const timeSinceLastBackup = now - parseInt(lastBackupTime);
    if (timeSinceLastBackup >= BACKUP_INTERVAL) {
      // Enough time has passed, create backup
      localStorage.setItem(lastBackupKey, now.toString());
      return true;
    }
    
    return false;
  } catch (error) {
    return false;
  }
};

const recordSnapshot = (key, value) => {
  if (!PRIMARY_KEYS.includes(key)) {
    return;
  }

  // Only create backup snapshots every 20 minutes
  if (!shouldCreateBackup(key)) {
    return;
  }

  try {
    const backupKey = `${key}_backup`;
    if (value === null || value === undefined) {
      localStorage.removeItem(backupKey);
    } else {
      localStorage.setItem(backupKey, value);
    }
  } catch (error) {
    // ignore backup failures
  }

  try {
    const history = loadHistory();
    const entry = { key, value, timestamp: Date.now() };
    if (key === 'stream_saved_notes') {
      entry.folders = getCurrentFolders();
    }
    history.unshift(entry);
    if (history.length > HISTORY_LIMIT) {
      history.length = HISTORY_LIMIT;
    }
    saveHistory(history);
  } catch (error) {
    // ignore history failures
  }
};

const setLocalValue = (key, value) => {
  if (PRIMARY_KEYS.includes(key)) {
    recordSnapshot(key, value);
  }
  localStorage.setItem(key, value);
};

const removeLocalValue = (key) => {
  if (PRIMARY_KEYS.includes(key)) {
    recordSnapshot(key, null);
  }
  localStorage.removeItem(key);
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

    setLocalValue(key, value);
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

    removeLocalValue(key);
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
        if (PRIMARY_KEYS.includes(item.key)) {
          const localItems = parseCollection(localValue);
          const remoteItems = parseCollection(item.value);
          if (localItems.length > 0 && remoteItems.length === 0) {
            this.pendingChanges.set(item.key, {
              key: item.key,
              value: localValue,
              updatedAt: Date.now(),
              deletedAt: null
            });
            return;
          }
        }
        if (item.key === 'stream-syncable-settings') {
          const merged = mergeSyncableSettings(localValue, item.value);
          if (merged !== item.value) {
            this.pendingChanges.set(item.key, {
              key: item.key,
              value: merged,
              updatedAt: Date.now(),
              deletedAt: null
            });
          }
          if (localValue !== merged) {
            setLocalValue(item.key, merged);
            updatedKeys.push(item.key);
          }
        } else {
          if (localValue !== item.value) {
            setLocalValue(item.key, item.value);
            updatedKeys.push(item.key);
          }
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
    
    // Always backup folders before sync
    const originalFolders = getCurrentFolders();
    const pendingFoldersChange = this.pendingChanges.has('stream-syncable-settings');
    const desiredFoldersState = pendingFoldersChange ? (() => {
      try {
        const pending = this.pendingChanges.get('stream-syncable-settings');
        if (pending?.value) {
          const parsed = JSON.parse(pending.value);
          if (Array.isArray(parsed?.folders)) {
            return [...parsed.folders];
          }
        }
      } catch (error) {
        console.warn('[storage] failed to parse pending folders change', error);
      }
      const localSettings = parseJSON(localStorage.getItem('stream-syncable-settings'));
      return Array.isArray(localSettings.folders) ? [...localSettings.folders] : [];
    })() : null;
    
    try {
      await this.pullRemoteChanges();
      await this.pushPendingChanges();
      
      // After sync, ensure folders are preserved
      const currentFolders = getCurrentFolders();
      if (pendingFoldersChange && desiredFoldersState) {
        const foldersChanged = JSON.stringify(currentFolders) !== JSON.stringify(desiredFoldersState);
        if (foldersChanged) {
          try {
            const syncableSettingsValue = localStorage.getItem('stream-syncable-settings');
            const parsedSettings = syncableSettingsValue ? JSON.parse(syncableSettingsValue) : {};
            parsedSettings.folders = desiredFoldersState;
            parsedSettings.foldersUpdatedAt = Date.now();
            const updatedValue = JSON.stringify(parsedSettings);
            localStorage.setItem('stream-syncable-settings', updatedValue);
            this.enqueueChange('stream-syncable-settings', updatedValue, null);
            this.scheduleSync();
            if (typeof window !== 'undefined') {
              const event = new CustomEvent('stream-sync-update', {
                detail: { keys: ['stream-syncable-settings'] }
              });
              window.dispatchEvent(event);
            }
          } catch (stateError) {
            console.warn('[storage] failed to reapply folders after sync', stateError);
          }
        }
      }
      if (!pendingFoldersChange && originalFolders.length > 0 && currentFolders.length === 0) {
        const localSettings = parseJSON(localStorage.getItem('stream-syncable-settings'));
        const expectedFolders = Array.isArray(localSettings.folders) ? localSettings.folders : [];
        if (expectedFolders.length > 0) {
          console.log('[storage] Restoring folders lost during sync:', originalFolders);
          try {
            const parsed = localSettings;
            parsed.folders = originalFolders;
            localStorage.setItem('stream-syncable-settings', JSON.stringify(parsed));

            if (typeof window !== 'undefined') {
              const event = new CustomEvent('stream-sync-update', {
                detail: { keys: ['stream-syncable-settings'] }
              });
              window.dispatchEvent(event);
            }
          } catch (error) {
            localStorage.setItem('stream-syncable-settings', JSON.stringify({ folders: originalFolders }));
          }
        } else {
          console.log('[storage] Folders cleared locally; skipping restore.');
        }
      }
      
      this.updateStatus('synced');
    } catch (error) {
      console.error('[storage] sync error', error);
      
      // Even if sync fails, ensure folders are preserved
      const currentFolders = getCurrentFolders();
      if (pendingFoldersChange && desiredFoldersState) {
        const foldersChanged = JSON.stringify(currentFolders) !== JSON.stringify(desiredFoldersState);
        if (foldersChanged) {
          try {
            const syncableSettingsValue = localStorage.getItem('stream-syncable-settings');
            const parsedSettings = syncableSettingsValue ? JSON.parse(syncableSettingsValue) : {};
            parsedSettings.folders = desiredFoldersState;
            parsedSettings.foldersUpdatedAt = Date.now();
            const updatedValue = JSON.stringify(parsedSettings);
            localStorage.setItem('stream-syncable-settings', updatedValue);
            this.enqueueChange('stream-syncable-settings', updatedValue, null);
            this.scheduleSync();
            if (typeof window !== 'undefined') {
              const event = new CustomEvent('stream-sync-update', {
                detail: { keys: ['stream-syncable-settings'] }
              });
              window.dispatchEvent(event);
            }
          } catch (stateError) {
            console.warn('[storage] failed to reapply folders after sync error', stateError);
          }
        }
      }
      if (!pendingFoldersChange && originalFolders.length > 0 && currentFolders.length === 0) {
        const localSettings = parseJSON(localStorage.getItem('stream-syncable-settings'));
        const expectedFolders = Array.isArray(localSettings.folders) ? localSettings.folders : [];
        if (expectedFolders.length > 0) {
          console.log('[storage] Restoring folders after sync error:', originalFolders);
          try {
            const parsed = localSettings;
            parsed.folders = originalFolders;
            localStorage.setItem('stream-syncable-settings', JSON.stringify(parsed));
          } catch (restoreError) {
            localStorage.setItem('stream-syncable-settings', JSON.stringify({ folders: originalFolders }));
          }
        } else {
          console.log('[storage] Folders cleared locally during sync error; skipping restore.');
        }
      }
      
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

    if (PRIMARY_KEYS.includes(key)) {
      const hasLocalData = localItems.length > 0;
      const remoteCleared = remoteItems.length === 0;
      if (hasLocalData && remoteCleared) {
        return {
          mergedValue: localValue || '[]',
          localChanged: false,
          shouldPush: true
        };
      }
    }

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
      setLocalValue(key, mergedValue);
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
          removeLocalValue(key);
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
        if (PRIMARY_KEYS.includes(key)) {
          const localItems = parseCollection(localValue);
          const remoteItems = parseCollection(value);
          if (localItems.length > 0 && remoteItems.length === 0) {
            this.pendingChanges.set(key, {
              key,
              value: localValue,
              updatedAt: Date.now(),
              deletedAt: null
            });
            return;
          }
        }
        if (key === 'stream-syncable-settings') {
          const merged = mergeSyncableSettings(localValue, value);
          if (merged !== value) {
            this.pendingChanges.set(key, {
              key,
              value: merged,
              updatedAt: Date.now(),
              deletedAt: null
            });
          }
          if (localValue !== merged) {
            setLocalValue(key, merged);
            updatedKeys.push(key);
          }
        } else if (localValue !== value) {
          setLocalValue(key, value);
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

export const getSyncHistory = (key = null) => {
  const entries = loadHistory();
  if (!key) {
    return entries;
  }
  return entries.filter((entry) => entry.key === key);
};

export const restoreSyncSnapshot = (key, timestamp) => {
  if (!PRIMARY_KEYS.includes(key)) {
    throw new Error(`Cannot restore snapshot for unsupported key: ${key}`);
  }
  const entries = loadHistory();
  const match = entries.find((entry) => entry.key === key && entry.timestamp === timestamp);
  if (!match) {
    return false;
  }
  const value = match.value;
  if (value === null || value === undefined) {
    removeLocalValue(key);
  } else {
    setLocalValue(key, value);
  }
  
  // If restoring saved notes and we have folder data, restore folders too
  if (key === 'stream_saved_notes' && match.folders && match.folders.length > 0) {
    try {
      const syncableSettings = localStorage.getItem('stream-syncable-settings');
      if (syncableSettings) {
        const parsed = JSON.parse(syncableSettings);
        parsed.folders = match.folders;
        localStorage.setItem('stream-syncable-settings', JSON.stringify(parsed));
      } else {
        localStorage.setItem('stream-syncable-settings', JSON.stringify({ folders: match.folders }));
      }
      
      // Also update legacy settings for backward compatibility
      const legacySettings = localStorage.getItem('stream-settings');
      if (legacySettings) {
        const parsed = JSON.parse(legacySettings);
        parsed.folders = match.folders;
        localStorage.setItem('stream-settings', JSON.stringify(parsed));
      }
    } catch (error) {
      console.warn('Failed to restore folders during snapshot restore:', error);
    }
  }
  
  return true;
};

export const createSnapshotForKey = (key) => {
  if (!PRIMARY_KEYS.includes(key)) {
    return false;
  }
  const value = localStorage.getItem(key);
  recordSnapshot(key, value);
  return true;
};

export const createFullBackup = () => {
  try {
    const backup = {
      timestamp: Date.now(),
      data: {}
    };
    
    BACKUP_KEYS.forEach(key => {
      const value = localStorage.getItem(key);
      if (value !== null) {
        backup.data[key] = value;
      }
    });
    
    // Also capture current folders state explicitly
    backup.folders = getCurrentFolders();
    
    localStorage.setItem('stream-full-backup', JSON.stringify(backup));
    return backup;
  } catch (error) {
    console.warn('Failed to create full backup:', error);
    return null;
  }
};

export const restoreFullBackup = () => {
  try {
    const backupData = localStorage.getItem('stream-full-backup');
    if (!backupData) {
      return false;
    }
    
    const backup = JSON.parse(backupData);
    if (!backup.data) {
      return false;
    }
    
    // Restore all backed up data
    Object.entries(backup.data).forEach(([key, value]) => {
      if (value !== null) {
        setLocalValue(key, value);
      }
    });
    
    // If we have folder data, ensure it's properly restored
    if (backup.folders && backup.folders.length > 0) {
      // Update syncable settings to include folders
      const syncableSettings = localStorage.getItem('stream-syncable-settings');
      if (syncableSettings) {
        try {
          const parsed = JSON.parse(syncableSettings);
          parsed.folders = backup.folders;
          localStorage.setItem('stream-syncable-settings', JSON.stringify(parsed));
        } catch (error) {
          // If parsing fails, create new settings with folders
          localStorage.setItem('stream-syncable-settings', JSON.stringify({ folders: backup.folders }));
        }
      } else {
        localStorage.setItem('stream-syncable-settings', JSON.stringify({ folders: backup.folders }));
      }
    }
    
    return true;
  } catch (error) {
    console.warn('Failed to restore full backup:', error);
    return false;
  }
};

export const createPreSyncBackup = () => {
  const backup = createFullBackup();
  if (backup) {
    localStorage.setItem('stream-pre-sync-backup', JSON.stringify(backup));
  }
  return backup;
};

export const restorePreSyncBackup = () => {
  try {
    const backupData = localStorage.getItem('stream-pre-sync-backup');
    if (!backupData) {
      return false;
    }
    
    const backup = JSON.parse(backupData);
    if (!backup.data) {
      return false;
    }
    
    // Only restore user data that wasn't synced, preserve synced content
    const userDataKeys = ['stream-local-settings']; // Device-specific settings
    const syncableKeys = ['stream-syncable-settings', 'stream_notes', 'stream_saved_notes', 'stream_art_notes'];
    
    // Restore local settings
    userDataKeys.forEach(key => {
      if (backup.data[key]) {
        localStorage.setItem(key, backup.data[key]);
      }
    });
    
    // For syncable data, merge with what was synced
    syncableKeys.forEach(key => {
      if (backup.data[key]) {
        const backupValue = backup.data[key];
        const currentValue = localStorage.getItem(key);
        
        // If current value is empty but backup had data, restore it
        if (!currentValue || currentValue === '[]' || currentValue === '{}') {
          setLocalValue(key, backupValue);
        }
      }
    });
    
    // Ensure folders are restored if they were lost
    if (backup.folders && backup.folders.length > 0) {
      const currentFolders = getCurrentFolders();
      if (currentFolders.length === 0) {
        // Folders were lost, restore them
        const syncableSettings = localStorage.getItem('stream-syncable-settings');
        if (syncableSettings) {
          try {
            const parsed = JSON.parse(syncableSettings);
            parsed.folders = backup.folders;
            localStorage.setItem('stream-syncable-settings', JSON.stringify(parsed));
          } catch (error) {
            localStorage.setItem('stream-syncable-settings', JSON.stringify({ folders: backup.folders }));
          }
        } else {
          localStorage.setItem('stream-syncable-settings', JSON.stringify({ folders: backup.folders }));
        }
      }
    }
    
    return true;
  } catch (error) {
    console.warn('Failed to restore pre-sync backup:', error);
    return false;
  }
};
