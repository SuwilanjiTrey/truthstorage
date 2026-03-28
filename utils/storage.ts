// utils/storage.ts
import { NativeModules, Platform } from 'react-native';

const { StorageModule } = NativeModules;

/* ─── TYPES ──────────────────────────────────────────────────────────────── */

export interface StorageInfo {
  totalBytes:   number;
  usedBytes:    number;
  freeBytes:    number;
  isSandboxed:  boolean;   // true = couldn't read real partition
  bestPath:     string;
  allPaths:     string;
}

export interface DeviceInfo {
  androidVersion: string;
  sdkVersion:     number;
  manufacturer:   string;
  model:          string;
  brand:          string;
  isEncrypted:    boolean;
  isRooted:       boolean;
  isEmulator:     boolean;
  reportedBytes:  number;
}

export interface AppInfo {
  packageName: string;
  appName:     string;
  appBytes:    number;
  dataBytes:   number;
  cacheBytes:  number;
  isFallback:  boolean;   // true = only APK size, no data/cache (needs Usage Access)
}

/* ─── STATE ──────────────────────────────────────────────────────────────── */

export let STORAGE: StorageInfo = {
  totalBytes:  0,
  usedBytes:   0,
  freeBytes:   0,
  isSandboxed: false,
  bestPath:    '',
  allPaths:    '',
};

export let DEVICE: DeviceInfo = {
  androidVersion: Platform.Version.toString(),
  sdkVersion:     Number(Platform.Version),
  manufacturer:   'Unknown',
  model:          'Unknown',
  brand:          'Unknown',
  isEncrypted:    true,
  isRooted:       false,
  isEmulator:     false,
  reportedBytes:  0,
};

export let APPS: AppInfo[] = [];

/* ─── LOADER ─────────────────────────────────────────────────────────────── */

export async function loadStorageData(): Promise<void> {
  console.log('═══════════════════════════════════════════');
  console.log('  TruthStorage — loadStorageData() START   ');
  console.log('═══════════════════════════════════════════');

  if (!StorageModule) {
    console.error('❌ StorageModule is NULL — not linked. Run: npx expo run:android');
    return;
  }

  console.log('[✓] StorageModule found');

  const [storageResult, appsResult, deviceResult] = await Promise.allSettled([
    StorageModule.getStorageInfo?.(),
    StorageModule.getAppStorage?.(),
    StorageModule.getDeviceInfo?.(),
  ]);

  // ── STORAGE ───────────────────────────────────────────────────────────────
  console.log('\n─── getStorageInfo() ───────────────────────');
  if (storageResult.status === 'fulfilled' && storageResult.value) {
    const s = storageResult.value;
    console.log('  Raw:', JSON.stringify(s, null, 2));

    STORAGE = {
      totalBytes:  s.totalBytes  ?? 0,
      usedBytes:   s.usedBytes   ?? 0,
      freeBytes:   s.freeBytes   ?? 0,
      isSandboxed: s.isSandboxed ?? false,
      bestPath:    s.bestPath    ?? '',
      allPaths:    s.allPaths    ?? '',
    };

    if (STORAGE.isSandboxed) {
      console.warn('  ⚠️  SANDBOXED — reading emulated/container partition, not real flash');
      console.warn('  allPaths:', STORAGE.allPaths);
    } else {
      console.log('  ✅ Real storage read from:', STORAGE.bestPath);
    }
    console.log(`  total: ${(STORAGE.totalBytes/1e9).toFixed(2)}GB  used: ${(STORAGE.usedBytes/1e9).toFixed(2)}GB  free: ${(STORAGE.freeBytes/1e9).toFixed(2)}GB`);
  } else {
    console.error('  ❌ REJECTED:', (storageResult as PromiseRejectedResult).reason);
  }

  // ── APPS ──────────────────────────────────────────────────────────────────
  console.log('\n─── getAppStorage() ────────────────────────');
  if (appsResult.status === 'fulfilled' && Array.isArray(appsResult.value)) {
    const raw = appsResult.value as any[];
    const isFallback = raw.length > 0 && raw[0].isFallback === true;

    console.log(`  ${raw.length} apps (isFallback=${isFallback})`);
    if (isFallback) {
      console.warn('  ⚠️  FALLBACK MODE — data/cache bytes are 0');
      console.warn('  → Grant Usage Access: Settings → Apps → Special App Access → Usage Access → TruthStorage');
    }

    APPS = raw.map(app => ({
      packageName: app.packageName,
      appName:     app.appName,
      appBytes:    app.appBytes    ?? 0,
      dataBytes:   app.dataBytes   ?? 0,
      cacheBytes:  app.cacheBytes  ?? 0,
      isFallback:  app.isFallback  ?? false,
    })).sort((a, b) => totalSize(b) - totalSize(a));

    console.log('  Top 5:', APPS.slice(0, 5).map(a => `${a.appName} ${(totalSize(a)/1e6).toFixed(0)}MB`).join(', '));
  } else {
    console.error('  ❌ REJECTED:', (appsResult as PromiseRejectedResult).reason);
  }

  // ── DEVICE ────────────────────────────────────────────────────────────────
  console.log('\n─── getDeviceInfo() ────────────────────────');
  if (deviceResult.status === 'fulfilled' && deviceResult.value) {
    const d = deviceResult.value;
    console.log('  Raw:', JSON.stringify(d, null, 2));

    DEVICE = {
      androidVersion: d.androidVersion ?? Platform.Version.toString(),
      sdkVersion:     d.sdkVersion     ?? Number(Platform.Version),
      manufacturer:   d.manufacturer   ?? 'Unknown',
      model:          d.model          ?? 'Unknown',
      brand:          d.brand          ?? 'Unknown',
      isEncrypted:    true,
      isRooted:       d.isRooted       ?? false,
      isEmulator:     d.isEmulator     ?? false,
      reportedBytes:  d.reportedBytes  ?? STORAGE.totalBytes,
    };

    if (DEVICE.isEmulator) {
      console.warn('  ⚠️  Running in emulator — storage values are virtual');
    }
    if (DEVICE.manufacturer === DEVICE.model) {
      console.warn('  ⚠️  manufacturer === model — device may be returning fake Build props');
      console.warn('  fingerprint:', d.fingerprint);
    }
  } else {
    console.error('  ❌ REJECTED:', (deviceResult as PromiseRejectedResult).reason);
  }

  // ── SUMMARY ───────────────────────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════');
  console.log('STORAGE :', JSON.stringify(STORAGE));
  console.log('DEVICE  :', JSON.stringify(DEVICE));
  console.log('APPS    :', APPS.length, `(fallback=${APPS[0]?.isFallback ?? 'n/a'})`);
  console.log('═══════════════════════════════════════════\n');
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
  return DEVICE.reportedBytes > STORAGE.totalBytes * 1.1;
}
