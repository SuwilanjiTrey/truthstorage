package com.anonymous.truthstorage

import android.app.usage.StorageStatsManager
import android.content.Context
import android.content.pm.ApplicationInfo
import android.os.Build
import android.os.Environment
import android.os.StatFs
import android.os.storage.StorageManager
import android.util.Log

import com.facebook.react.bridge.*

class StorageModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val TAG = "TruthStorage"
    }

    override fun getName(): String = "StorageModule"

    // ── STORAGE INFO ──────────────────────────────────────────────────────────
    // Probes every known path and returns the largest — that's the real disk
    @ReactMethod
    fun getStorageInfo(promise: Promise) {
        try {
            data class PathResult(val path: String, val total: Long, val free: Long)

            val pathsToTry = listOf(
                "/storage/emulated/0",
                Environment.getExternalStorageDirectory()?.absolutePath,
                "/sdcard",
                "/data",
                Environment.getDataDirectory().absolutePath,
                reactApplicationContext.filesDir.absolutePath,
            ).filterNotNull().distinct()

            val results = mutableListOf<PathResult>()

            for (path in pathsToTry) {
                try {
                    val f = java.io.File(path)
                    if (!f.exists()) { Log.d(TAG, "  skip (not exists): $path"); continue }
                    val stat  = StatFs(path)
                    val total = stat.totalBytes
                    val free  = stat.availableBytes
                    Log.d(TAG, "  path=$path  total=${total/1_000_000_000.0}GB  free=${free/1_000_000_000.0}GB")
                    results.add(PathResult(path, total, free))
                } catch (e: Exception) {
                    Log.w(TAG, "  path=$path  error: ${e.message}")
                }
            }

            // Log StorageManager volumes (API 24+)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                try {
                    val sm = reactApplicationContext.getSystemService(Context.STORAGE_SERVICE) as StorageManager
                    for (vol in sm.storageVolumes) {
                        Log.d(TAG, "  volume: ${vol.getDescription(reactApplicationContext)}  primary=${vol.isPrimary}  emulated=${vol.isEmulated}  state=${vol.state}")
                    }
                } catch (e: Exception) {
                    Log.w(TAG, "StorageManager volumes: ${e.message}")
                }
            }

            // Best = largest total (closest to the real flash chip size)
            val best = results.maxByOrNull { it.total }
                ?: run { promise.reject("STORAGE_ERROR", "No readable paths"); return }

            val used       = best.total - best.free
            val sandboxed  = used < 0 || best.total < 8_000_000_000L  // < 8 GB is suspicious

            Log.d(TAG, "Best: ${best.path}  total=${best.total/1e9}GB  used=${used/1e9}GB  sandboxed=$sandboxed")

            promise.resolve(Arguments.createMap().apply {
                putDouble ("totalBytes",  best.total.toDouble())
                putDouble ("freeBytes",   best.free.toDouble())
                putDouble ("usedBytes",   (if (used < 0) 0L else used).toDouble())
                putBoolean("isSandboxed", sandboxed)
                putString ("bestPath",    best.path)
                putString ("allPaths",    results.joinToString(" | ") {
                    "${it.path}: ${(it.total/1e9).toInt()}GB"
                })
            })
        } catch (e: Exception) {
            Log.e(TAG, "getStorageInfo failed", e)
            promise.reject("STORAGE_ERROR", e.message, e)
        }
    }

    // ── APP STORAGE ───────────────────────────────────────────────────────────
    @ReactMethod
    fun getAppStorage(promise: Promise) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            getAppStorageWithStatsManager(promise)
        } else {
            Log.w(TAG, "SDK ${Build.VERSION.SDK_INT} < 26 — using APK file-size fallback")
            getAppStorageFallback(promise)
        }
    }

    private fun getAppStorageWithStatsManager(promise: Promise) {
        try {
            val ctx          = reactApplicationContext
            val statsManager = ctx.getSystemService(Context.STORAGE_STATS_SERVICE) as StorageStatsManager
            val pm           = ctx.packageManager
            val packages     = pm.getInstalledApplications(0)
            val result       = Arguments.createArray()
            var ok = 0; var skip = 0

            Log.d(TAG, "getAppStorage (StatsManager): ${packages.size} packages")

            for (app in packages) {
                try {
                    val uuid  = app.storageUuid
                        ?: java.util.UUID.fromString("00000000-0000-0000-0000-000000000000")
                    val stats = statsManager.queryStatsForPackage(
                        uuid, app.packageName, android.os.Process.myUserHandle()
                    )
                    val label = try { pm.getApplicationLabel(app).toString() } catch (_: Exception) { app.packageName }
                    result.pushMap(Arguments.createMap().apply {
                        putString ("packageName", app.packageName)
                        putString ("appName",     label)
                        putDouble ("appBytes",    stats.appBytes.toDouble())
                        putDouble ("dataBytes",   stats.dataBytes.toDouble())
                        putDouble ("cacheBytes",  stats.cacheBytes.toDouble())
                        putBoolean("isFallback",  false)
                    })
                    ok++
                } catch (_: Exception) { skip++ }
            }

            Log.d(TAG, "StatsManager: ok=$ok skip=$skip")

            // If permission not granted, ok will be 0 or 1 (only own app) — fall back
            if (ok <= 1) {
                Log.w(TAG, "StatsManager returned $ok results — PACKAGE_USAGE_STATS likely not granted, using fallback")
                getAppStorageFallback(promise)
            } else {
                promise.resolve(result)
            }
        } catch (e: Exception) {
            Log.e(TAG, "StatsManager failed: ${e.message}")
            getAppStorageFallback(promise)
        }
    }

    // Fallback: APK file sizes only — no special permission needed
    private fun getAppStorageFallback(promise: Promise) {
        try {
            val pm       = reactApplicationContext.packageManager
            val packages = pm.getInstalledApplications(0)
            val result   = Arguments.createArray()
            var count    = 0

            Log.d(TAG, "getAppStorageFallback: ${packages.size} packages")

            for (app in packages) {
                try {
                    val sourceFile = java.io.File(app.sourceDir ?: continue)
                    val appBytes   = if (sourceFile.exists()) sourceFile.length() else 0L
                    if (appBytes < 100_000) continue   // skip tiny stubs

                    val label    = try { pm.getApplicationLabel(app).toString() } catch (_: Exception) { app.packageName }
                    val isSystem = (app.flags and ApplicationInfo.FLAG_SYSTEM) != 0
                    if (isSystem && appBytes < 2_000_000) continue   // skip tiny system apps

                    result.pushMap(Arguments.createMap().apply {
                        putString ("packageName", app.packageName)
                        putString ("appName",     label)
                        putDouble ("appBytes",    appBytes.toDouble())
                        putDouble ("dataBytes",   0.0)
                        putDouble ("cacheBytes",  0.0)
                        putBoolean("isFallback",  true)
                    })
                    count++
                } catch (_: Exception) {}
            }

            Log.d(TAG, "Fallback: returned $count apps")
            promise.resolve(result)
        } catch (e: Exception) {
            Log.e(TAG, "Fallback failed", e)
            promise.reject("APP_STATS_ERROR", e.message, e)
        }
    }

    // ── DEVICE INFO ───────────────────────────────────────────────────────────
    @ReactMethod
    fun getDeviceInfo(promise: Promise) {
        try {
            // Best reported storage = largest partition found
            var reportedBytes = 0L
            for (path in listOf("/storage/emulated/0", "/sdcard",
                                Environment.getExternalStorageDirectory()?.absolutePath,
                                Environment.getDataDirectory().absolutePath).filterNotNull()) {
                try {
                    val t = StatFs(path).totalBytes
                    if (t > reportedBytes) reportedBytes = t
                } catch (_: Exception) {}
            }

            val fingerprint = Build.FINGERPRINT
            val isEmulator  = fingerprint.startsWith("generic")
                || fingerprint.startsWith("unknown")
                || Build.MODEL.contains("google_sdk", true)
                || Build.MODEL.contains("Emulator", true)
                || Build.MANUFACTURER.contains("Genymotion", true)
                || (Build.BRAND.startsWith("generic") && Build.DEVICE.startsWith("generic"))

            Log.d(TAG, "getDeviceInfo:")
            Log.d(TAG, "  RELEASE     = ${Build.VERSION.RELEASE}")
            Log.d(TAG, "  SDK         = ${Build.VERSION.SDK_INT}")
            Log.d(TAG, "  MANUFACTURER= ${Build.MANUFACTURER}")
            Log.d(TAG, "  MODEL       = ${Build.MODEL}")
            Log.d(TAG, "  BRAND       = ${Build.BRAND}")
            Log.d(TAG, "  DEVICE      = ${Build.DEVICE}")
            Log.d(TAG, "  FINGERPRINT = $fingerprint")
            Log.d(TAG, "  isEmulator  = $isEmulator")
            Log.d(TAG, "  reported    = ${reportedBytes/1e9}GB")

            promise.resolve(Arguments.createMap().apply {
                putString ("androidVersion", Build.VERSION.RELEASE)
                putInt    ("sdkVersion",     Build.VERSION.SDK_INT)
                putString ("manufacturer",   Build.MANUFACTURER)
                putString ("model",          Build.MODEL)
                putString ("brand",          Build.BRAND)
                putString ("device",         Build.DEVICE)
                putString ("product",        Build.PRODUCT)
                putString ("fingerprint",    fingerprint)
                putBoolean("isRooted",       isRooted())
                putBoolean("isEmulator",     isEmulator)
                putDouble ("reportedBytes",  reportedBytes.toDouble())
            })
        } catch (e: Exception) {
            Log.e(TAG, "getDeviceInfo failed", e)
            promise.reject("DEVICE_INFO_ERROR", e.message, e)
        }
    }

    private fun isRooted(): Boolean = arrayOf(
        "/system/app/Superuser.apk", "/sbin/su",
        "/system/bin/su", "/system/xbin/su",
        "/data/local/xbin/su", "/data/local/bin/su"
    ).any { java.io.File(it).exists() }
}
