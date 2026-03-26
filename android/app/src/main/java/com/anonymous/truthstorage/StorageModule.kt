package com.anonymous.truthstorage

import android.app.usage.StorageStatsManager
import android.content.Context
import android.os.Build
import android.os.Environment
import android.os.StatFs
import android.util.Log

import com.facebook.react.bridge.*

class StorageModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "StorageModule"

    // ── TOTAL / FREE / USED ───────────────────────────────────────────────────
    @ReactMethod
    fun getStorageInfo(promise: Promise) {
        try {
            val stat  = StatFs(Environment.getDataDirectory().path)
            val total = stat.totalBytes
            val free  = stat.availableBytes
            val used  = total - free

            val map = Arguments.createMap().apply {
                putDouble("totalBytes", total.toDouble())
                putDouble("freeBytes",  free.toDouble())
                putDouble("usedBytes",  used.toDouble())
            }
            promise.resolve(map)
        } catch (e: Exception) {
            promise.reject("STORAGE_ERROR", e.message, e)
        }
    }

    // ── PER-APP STORAGE ───────────────────────────────────────────────────────
    @ReactMethod
    fun getAppStorage(promise: Promise) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            promise.reject("UNSUPPORTED", "Requires Android 8.0+")
            return
        }

        try {
            val context = reactApplicationContext
            val statsManager = context
                .getSystemService(Context.STORAGE_STATS_SERVICE) as StorageStatsManager
            val pm = context.packageManager

            val result = Arguments.createArray()

            for (app in pm.getInstalledApplications(0)) {
                try {
                    val stats = statsManager.queryStatsForPackage(
                        app.storageUuid ?: java.util.UUID.fromString("00000000-0000-0000-0000-000000000000"),
                        app.packageName,
                        android.os.Process.myUserHandle()
                    )
                    result.pushMap(Arguments.createMap().apply {
                        putString("packageName", app.packageName)
                        putString("appName",     pm.getApplicationLabel(app).toString())
                        putDouble("appBytes",    stats.appBytes.toDouble())
                        putDouble("dataBytes",   stats.dataBytes.toDouble())
                        putDouble("cacheBytes",  stats.cacheBytes.toDouble())
                    })
                } catch (_: Exception) {
                    // skip packages we can't read (system-protected)
                }
            }

            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("APP_STATS_ERROR", e.message, e)
        }
    }

    // ── DEVICE INFO ───────────────────────────────────────────────────────────
    @ReactMethod
    fun getDeviceInfo(promise: Promise) {
        try {
            val stat  = StatFs(Environment.getDataDirectory().path)
            val map = Arguments.createMap().apply {
                putString("androidVersion", Build.VERSION.RELEASE)
                putInt   ("sdkVersion",     Build.VERSION.SDK_INT)
                putString("manufacturer",   Build.MANUFACTURER)
                putString("model",          Build.MODEL)
                putBoolean("isRooted",      isRooted())
                // reportedBytes: use total from StatFs (closest truth)
                putDouble("reportedBytes",  stat.totalBytes.toDouble())
            }
            promise.resolve(map)
        } catch (e: Exception) {
            promise.reject("DEVICE_INFO_ERROR", e.message, e)
        }
    }

    private fun isRooted(): Boolean {
        val paths = arrayOf(
            "/system/app/Superuser.apk",
            "/sbin/su", "/system/bin/su", "/system/xbin/su",
            "/data/local/xbin/su", "/data/local/bin/su", "/system/sd/xbin/su"
        )
        return paths.any { java.io.File(it).exists() }
    }
}