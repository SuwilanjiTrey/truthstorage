// context/StorageContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  loadStorageData,
  STORAGE, DEVICE, APPS,
  StorageInfo, DeviceInfo, AppInfo,
  storageBreakdown, detectMismatch,
} from '@/utils/storage';

interface StorageContextValue {
  storage:    StorageInfo;
  device:     DeviceInfo;
  apps:       AppInfo[];
  loading:    boolean;
  mismatch:   boolean;
  appsSize:   number;
  cacheSize:  number;
  systemSize: number;
  reload:     () => Promise<void>;
}

const StorageContext = createContext<StorageContextValue | null>(null);

export function StorageProvider({ children }: { children: React.ReactNode }) {
  const [storage,   setStorage]   = useState<StorageInfo>(STORAGE);
  const [device,    setDevice]    = useState<DeviceInfo>(DEVICE);
  const [apps,      setApps]      = useState<AppInfo[]>(APPS);
  const [loading,   setLoading]   = useState(true);

  const load = async () => {
    setLoading(true);
    await loadStorageData();
    // After loadStorageData() mutates the module-level vars, snapshot them into state
    setStorage({ ...STORAGE });
    setDevice({ ...DEVICE });
    setApps([...APPS]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const { appsSize, cacheSize, systemSize } = storageBreakdown();

  return (
    <StorageContext.Provider value={{
      storage,
      device,
      apps,
      loading,
      mismatch:   detectMismatch(),
      appsSize,
      cacheSize,
      systemSize,
      reload: load,
    }}>
      {children}
    </StorageContext.Provider>
  );
}

export function useStorage(): StorageContextValue {
  const ctx = useContext(StorageContext);
  if (!ctx) throw new Error('useStorage must be used inside <StorageProvider>');
  return ctx;
}
