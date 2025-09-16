import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSettings } from './SettingsContext';
import { useAuth } from './AuthContext';
import StorageAdapter from '../utils/storage';

const StorageContext = createContext();

export const useStorage = () => {
  const context = useContext(StorageContext);
  if (!context) {
    throw new Error('useStorage must be used within a StorageProvider');
  }
  return context;
};

export const StorageProvider = ({ children }) => {
  const { settings, updateSettings } = useSettings();
  const { user } = useAuth();
  const [storageAdapter, setStorageAdapter] = useState(() => new StorageAdapter());
  const [syncStatus, setSyncStatus] = useState(storageAdapter.getStatus());
  const [lastSyncedAt, setLastSyncedAt] = useState(storageAdapter.getLastSyncedAt());
  const [syncError, setSyncError] = useState(null);

  useEffect(() => {
    if (user && settings.syncKey !== user.id) {
      updateSettings({ syncKey: user.id, syncEnabled: true });
      return;
    }

    if (!user && settings.syncEnabled && !settings.syncKey) {
      const newKey = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `stream-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      localStorage.setItem('stream-sync-key', newKey);
      updateSettings({ syncKey: newKey });
      return;
    }

    if (!settings.syncEndpoint && process.env.REACT_APP_SYNC_URL) {
      updateSettings({ syncEndpoint: process.env.REACT_APP_SYNC_URL });
    }
  }, [user, settings.syncEnabled, settings.syncKey, settings.syncEndpoint, updateSettings]);

  useEffect(() => {
    let isMounted = true;
    const effectiveSyncKey = user?.id || settings.syncKey;
    const adapter = new StorageAdapter({
      syncEnabled: settings.syncEnabled && !!effectiveSyncKey,
      endpoint: settings.syncEndpoint,
      syncKey: effectiveSyncKey,
      onStatusChange: (status) => {
        if (!isMounted) return;
        setSyncStatus(status);
        if (status !== 'error') {
          setSyncError(null);
        }
        if (status === 'error') {
          setSyncError('Sync failed. Check your connection and credentials.');
        }
      },
      onLastSyncedChange: (timestamp) => {
        if (!isMounted) return;
        setLastSyncedAt(timestamp);
      }
    });

    setStorageAdapter(adapter);
    setSyncStatus(adapter.getStatus());
    setLastSyncedAt(adapter.getLastSyncedAt());
    setSyncError(null);
    
    // Expose storage adapter globally for settings sync
    window.streamStorage = adapter;

    let intervalId;

    if (adapter.isSyncEnabled()) {
      adapter.syncNow().catch((error) => {
        if (!isMounted) return;
        setSyncError(error.message || 'Sync failed.');
      });

      intervalId = setInterval(() => {
        adapter.syncNow().catch((error) => {
          if (!isMounted) return;
          setSyncError(error.message || 'Sync failed.');
        });
      }, 60000);
    }

    return () => {
      isMounted = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
      if (adapter.syncTimeout) {
        clearTimeout(adapter.syncTimeout);
      }
      // Clean up global reference
      if (window.streamStorage === adapter) {
        window.streamStorage = null;
      }
    };
  }, [settings.syncEnabled, settings.syncEndpoint, settings.syncKey, user?.id]);

  const isSyncSupported = () => {
    return storageAdapter.isSyncSupported();
  };

  const syncNow = async () => {
    if (!storageAdapter || !storageAdapter.isSyncEnabled()) {
      return;
    }

    try {
      await storageAdapter.syncNow();
      setSyncError(null);
    } catch (error) {
      setSyncError(error.message || 'Sync failed.');
      throw error;
    }
  };

  return (
    <StorageContext.Provider value={{
      storage: storageAdapter,
      isSyncSupported,
      getSyncStatus: () => syncStatus,
      syncStatus,
      lastSyncedAt,
      syncError,
      syncNow
    }}>
      {children}
    </StorageContext.Provider>
  );
};
