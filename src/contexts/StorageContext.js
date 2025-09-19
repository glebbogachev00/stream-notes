import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useSettings } from './SettingsContext';
import { useAuth } from './AuthContext';
import StorageAdapter from '../utils/storage';
import { getSupabaseClient } from '../services/supabaseClient';

const StorageContext = createContext();
const SUPABASE_TABLE = process.env.REACT_APP_SUPABASE_STORAGE_TABLE || 'storage_items';

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
  const supabase = useMemo(() => getSupabaseClient(), []);
  const [storageAdapter, setStorageAdapter] = useState(() => new StorageAdapter());
  const [syncStatus, setSyncStatus] = useState(storageAdapter.getStatus());
  const [lastSyncedAt, setLastSyncedAt] = useState(storageAdapter.getLastSyncedAt());
  const [syncError, setSyncError] = useState(null);

  useEffect(() => {
    if (user) {
      const updates = {};
      const userId = user.id;
      const hasDifferentKey = settings.syncKey !== userId;

      if (hasDifferentKey) {
        // Only clear sync metadata if switching to a different user, not on every login
        const currentMeta = localStorage.getItem('stream-sync-meta');
        if (currentMeta) {
          try {
            const parsed = JSON.parse(currentMeta);
            if (parsed.key && parsed.key !== userId) {
              // Switching users - clear metadata
              localStorage.removeItem('stream-sync-meta');
            }
          } catch (error) {
            // Invalid metadata - clear it
            localStorage.removeItem('stream-sync-meta');
          }
        }
        updates.syncKey = userId;
      }

      if (!settings.syncEnabled) {
        updates.syncEnabled = true;
      }

      if (Object.keys(updates).length > 0) {
        updateSettings(updates);
      }
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

  }, [user, settings.syncEnabled, settings.syncKey, settings.syncEndpoint, updateSettings]);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    if (settings.syncEndpoint) {
      // Clear endpoint to prioritize Supabase sync
      updateSettings({ syncEndpoint: '' });
      localStorage.removeItem('stream-sync-endpoint');
    }
  }, [supabase, settings.syncEndpoint, updateSettings]);

  useEffect(() => {
    let isMounted = true;
    const effectiveSyncKey = user?.id || settings.syncKey;
    const canUseSupabase = !!supabase && !!user?.id;

    const adapter = new StorageAdapter({
      syncEnabled: settings.syncEnabled && !!effectiveSyncKey && (canUseSupabase || !!settings.syncEndpoint),
      endpoint: settings.syncEndpoint,
      syncKey: effectiveSyncKey,
      supabaseClient: canUseSupabase ? supabase : null,
      supabaseTable: SUPABASE_TABLE,
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
      }, 30000); // Reduced frequency from 10s to 30s
    }

    return () => {
      isMounted = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
      if (adapter.syncTimeout) {
        clearTimeout(adapter.syncTimeout);
      }
      if (window.streamStorage === adapter) {
        window.streamStorage = null;
      }
    };
  }, [settings.syncEnabled, settings.syncEndpoint, settings.syncKey, supabase, user?.id]);

  useEffect(() => {
    if (!storageAdapter || !storageAdapter.isSyncEnabled()) {
      return;
    }

    let cancelled = false;

    const triggerSync = () => {
      if (cancelled) return;
      storageAdapter.syncNow().catch(() => {
        // Errors already surfaced through status state
      });
    };

    const handleVisibility = () => {
      if (typeof document === 'undefined') {
        return;
      }
      if (document.visibilityState === 'visible') {
        triggerSync();
      }
    };

    window.addEventListener('focus', triggerSync);
    window.addEventListener('visibilitychange', handleVisibility);

    return () => {
      cancelled = true;
      window.removeEventListener('focus', triggerSync);
      window.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [storageAdapter]);

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
