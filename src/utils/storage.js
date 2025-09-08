const isExtensionContext = () => {
  try {
    return typeof window !== 'undefined' && 
           typeof window.chrome !== 'undefined' && 
           window.chrome.storage && 
           window.chrome.storage.sync;
  } catch (e) {
    return false;
  }
};

const isBrowserSyncSupported = () => {
  try {
    return 'serviceWorker' in navigator && 
           'sync' in window.ServiceWorkerRegistration?.prototype;
  } catch (e) {
    return false;
  }
};

class StorageAdapter {
  constructor(syncEnabled = false) {
    this.syncEnabled = syncEnabled && (isExtensionContext() || isBrowserSyncSupported());
    this.useExtensionSync = syncEnabled && isExtensionContext();
    this.useBrowserSync = syncEnabled && !isExtensionContext() && isBrowserSyncSupported();
  }

  async get(key) {
    if (this.useExtensionSync) {
      return new Promise((resolve) => {
        window.chrome.storage.sync.get([key], (result) => {
          resolve(result[key] || null);
        });
      });
    } else if (this.useBrowserSync) {
      try {
        const syncedData = localStorage.getItem(`${key}_synced`);
        if (syncedData) {
          return syncedData;
        }
      } catch (e) {
        // Browser sync read failed, falling back to local storage
      }
    }
    
    return localStorage.getItem(key);
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
    } else if (this.useBrowserSync) {
      try {
        localStorage.setItem(`${key}_synced`, value);
        localStorage.setItem(key, value);
      } catch (e) {
        // Browser sync write failed, using local storage only
        localStorage.setItem(key, value);
      }
      return Promise.resolve();
    } else {
      localStorage.setItem(key, value);
      return Promise.resolve();
    }
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
    } else if (this.useBrowserSync) {
      try {
        localStorage.removeItem(`${key}_synced`);
      } catch (e) {
        // Browser sync remove failed
      }
    }
    
    localStorage.removeItem(key);
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
    } else {
      const keysToRemove = ['stream_notes', 'stream_saved_notes', 'stream_art_notes', 'stream-settings'];
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        if (this.useBrowserSync) {
          localStorage.removeItem(`${key}_synced`);
        }
      });
      return Promise.resolve();
    }
  }

  isSyncEnabled() {
    return this.syncEnabled;
  }

  isSyncSupported() {
    return isExtensionContext() || isBrowserSyncSupported();
  }
}

export default StorageAdapter;