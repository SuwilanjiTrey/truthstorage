// utils/storage.ts
import { NativeModules, Platform } from 'react-native';

const { StorageModule } = NativeModules;

/* ─── TYPES ──────────────────────────────────────────────────────────────── */

export interface StorageInfo {
  totalBytes: number;
  usedBytes:  number;
  freeBytes:  number;
}

export interface DeviceInfo {
  androidVersion: string;
  sdkVersion:     number;
  manufacturer:   string;
  model:          string;
  isEncrypted:    boolean;
  isRooted:       boolean;
  reportedBytes:  number;
}

export interface AppInfo {
  packageName: string;
  appName:     string;
  appBytes:    number;
  dataBytes:   number;
  cacheBytes:  number;
}

/* ─── REACTIVE STATE ─────────────────────────────────────────────────────── */
// Exported as `let` so screens re-read after loadStorageData() resolves

export let STORAGE: StorageInfo = {
  totalBytes: 0,
  usedBytes:  0,
  freeBytes:  0,
};

export let DEVICE: DeviceInfo = {
  androidVersion: Platform.Version.toString(),
  sdkVersion:     Number(Platform.Version),
  manufacturer:   'Unknown',
  model:          'Unknown',
  isEncrypted:    true,
  isRooted:       false,
  reportedBytes:  0,
};

export let APPS: AppInfo[] = [];

/* ─── LOADER ─────────────────────────────────────────────────────────────── */

export async function loadStorageData(): Promise<void> {
  if (!StorageModule) {
    console.warn('[TruthStorage] StorageModule not found — running on Expo Go or web?');
    return;
  }

  // Run all three calls in parallel
  const [storageResult, appsResult, deviceResult] = await Promise.allSettled([
    StorageModule.getStorageInfo?.(),
    StorageModule.getAppStorage?.(),
    StorageModule.getDeviceInfo?.(),
  ]);

  // ── Storage ──────────────────────────────────────────────────────────────
  if (storageResult.status === 'fulfilled' && storageResult.value) {
    const s = storageResult.value;
    STORAGE = {
      totalBytes: s.totalBytes,
      usedBytes:  s.usedBytes,
      freeBytes:  s.freeBytes,
    };
  } else if (storageResult.status === 'rejected') {
    console.warn('[TruthStorage] getStorageInfo failed:', storageResult.reason);
  }

  // ── Apps ─────────────────────────────────────────────────────────────────
  if (appsResult.status === 'fulfilled' && Array.isArray(appsResult.value)) {
    APPS = (appsResult.value as any[])
      .map(app => ({
        packageName: app.packageName,
        appName:     app.appName,
        appBytes:    app.appBytes,
        dataBytes:   app.dataBytes,
        cacheBytes:  app.cacheBytes,
      }))
      .sort((a, b) => totalSize(b) - totalSize(a));
  } else if (appsResult.status === 'rejected') {
    console.warn('[TruthStorage] getAppStorage failed:', appsResult.reason);
  }

  // ── Device ───────────────────────────────────────────────────────────────
  if (deviceResult.status === 'fulfilled' && deviceResult.value) {
    const d = deviceResult.value;
    DEVICE = {
      androidVersion: d.androidVersion ?? Platform.Version.toString(),
      sdkVersion:     d.sdkVersion     ?? Number(Platform.Version),
      manufacturer:   d.manufacturer   ?? 'Unknown',
      model:          d.model          ?? 'Unknown',
      isEncrypted:    true,                 // not detectable without root
      isRooted:       d.isRooted       ?? false,
      reportedBytes:  d.reportedBytes  ?? STORAGE.totalBytes,
    };
  } else if (deviceResult.status === 'rejected') {
    console.warn('[TruthStorage] getDeviceInfo failed:', deviceResult.reason);
  }
}

/* ─── UTILS ──────────────────────────────────────────────────────────────── */

export function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes || bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

export function usagePct(used: number, total: number): number {
  return total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
}

export function statusColor(pct: number): string {
  if (pct >= 90) return '#FF4757';
  if (pct >= 75) return '#F5A623';
  return '#00E5A0';
}

export function totalSize(app: AppInfo): number {
  return app.appBytes + app.dataBytes + app.cacheBytes;
}

export function storageBreakdown() {
  const appsSize   = APPS.reduce((s, a) => s + a.appBytes + a.dataBytes, 0);
  const cacheSize  = APPS.reduce((s, a) => s + a.cacheBytes, 0);
  const systemSize = Math.max(0, STORAGE.usedBytes - appsSize - cacheSize);
  return { appsSize, cacheSize, systemSize };
}

export function detectMismatch(): boolean {
  if (!DEVICE.reportedBytes || !STORAGE.totalBytes) return false;
  // Flag if reported is more than 10% larger than actual writable
  return DEVICE.reportedBytes > STORAGE.totalBytes * 1.1;
}