import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSettings } from './SettingsContext';
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
  const { settings } = useSettings();
  const [storageAdapter, setStorageAdapter] = useState(() => new StorageAdapter(false));
  const [syncStatus, setSyncStatus] = useState('local');

  useEffect(() => {
    const newAdapter = new StorageAdapter(settings.syncEnabled);
    setStorageAdapter(newAdapter);
    setSyncStatus(newAdapter.isSyncEnabled() ? 'synced' : 'local');
  }, [settings.syncEnabled]);

  const isSyncSupported = () => {
    return storageAdapter.isSyncSupported();
  };

  const getSyncStatus = () => {
    return syncStatus;
  };

  return (
    <StorageContext.Provider value={{
      storage: storageAdapter,
      isSyncSupported,
      getSyncStatus
    }}>
      {children}
    </StorageContext.Provider>
  );
};