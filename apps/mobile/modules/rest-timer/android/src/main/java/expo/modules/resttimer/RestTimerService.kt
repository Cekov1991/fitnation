package expo.modules.resttimer

import android.app.ActivityManager
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import expo.modules.notifications.service.NotificationsService

/**
 * Foreground service for one rest (spec 0013 R6, R7).
 *
 * While resting it shows an ongoing notification whose countdown the OS renders
 * (chronometer, no per-second updates from JS). At `endAt` it posts the "Rest
 * over" alert and stops. `update` re-posts the countdown and re-arms the alert;
 * `stopService` removes everything without an alert.
 */
class RestTimerService : Service() {
  private val handler = Handler(Looper.getMainLooper())
  private var endAt = 0L
  private var label = ""
  private var fallbackId: String? = null
  private val onRestOver = Runnable { finishRest() }

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    if (intent == null) {
      stopSelf()
      return START_NOT_STICKY
    }
    endAt = intent.getLongExtra(EXTRA_END_AT, endAt)
    intent.getStringExtra(EXTRA_LABEL)?.let { label = it }
    if (intent.hasExtra(EXTRA_FALLBACK_ID)) fallbackId = intent.getStringExtra(EXTRA_FALLBACK_ID)

    ensureChannel()
    try {
      val notification = ongoingNotification()
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
        startForeground(ONGOING_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE)
      } else {
        startForeground(ONGOING_ID, notification)
      }
    } catch (e: Exception) {
      // Missing permission or a background start the OS refused. The JS side
      // still has the fallback alarm; nothing more to do here.
      Log.w(TAG, "startForeground failed", e)
      stopSelf()
      return START_NOT_STICKY
    }

    handler.removeCallbacks(onRestOver)
    handler.postDelayed(onRestOver, (endAt - System.currentTimeMillis()).coerceAtLeast(0))
    return START_NOT_STICKY
  }

  override fun onDestroy() {
    handler.removeCallbacks(onRestOver)
    stopForeground(STOP_FOREGROUND_REMOVE)
    super.onDestroy()
  }

  private fun finishRest() {
    // The fallback alarm is scheduled a few seconds after us; cancel it so the
    // user gets one alert, not two. If we never got here, it still fires.
    fallbackId?.let {
      try {
        NotificationsService.removeScheduledNotification(this, it)
      } catch (e: Exception) {
        Log.w(TAG, "could not cancel fallback $it", e)
      }
    }
    // R9: with the session screen visible the ring hits zero and the haptic
    // fires; an OS alert on top would be noise.
    if (!isAppVisible()) postAlert()
    stopForeground(STOP_FOREGROUND_REMOVE)
    stopSelf()
  }

  private fun ongoingNotification(): Notification =
    NotificationCompat.Builder(this, CHANNEL_ID)
      .setSmallIcon(smallIcon())
      .setColor(accentColor())
      .setContentTitle("Resting")
      .apply { if (label.isNotEmpty()) setSubText(label) }
      .setUsesChronometer(true)
      .setChronometerCountDown(true)
      .setWhen(endAt)
      .setShowWhen(true)
      .setOngoing(true)
      .setOnlyAlertOnce(true)
      .setSilent(true)
      .setCategory(NotificationCompat.CATEGORY_PROGRESS)
      .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
      // Android 12+ otherwise delays a foreground-service notification by ~10 s.
      .setForegroundServiceBehavior(NotificationCompat.FOREGROUND_SERVICE_IMMEDIATE)
      .setContentIntent(launchIntent())
      .build()

  private fun postAlert() {
    val body = if (label.isNotEmpty()) "Back to $label" else "Back to your workout"
    val alert = NotificationCompat.Builder(this, CHANNEL_ID)
      .setSmallIcon(smallIcon())
      .setColor(accentColor())
      .setContentTitle("Rest over")
      .setContentText(body)
      .setAutoCancel(true)
      .setPriority(NotificationCompat.PRIORITY_HIGH)
      .setDefaults(NotificationCompat.DEFAULT_ALL)
      .setCategory(NotificationCompat.CATEGORY_ALARM)
      .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
      .setContentIntent(launchIntent())
      .build()
    try {
      NotificationManagerCompat.from(this).notify(ALERT_ID, alert)
    } catch (e: SecurityException) {
      Log.w(TAG, "POST_NOTIFICATIONS not granted", e)
    }
  }

  // JS creates this channel through expo-notifications before starting us
  // (same id, importance, sound and vibration); this is only the safety net.
  private fun ensureChannel() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val manager = getSystemService(NotificationManager::class.java)
    if (manager.getNotificationChannel(CHANNEL_ID) != null) return
    val channel = NotificationChannel(CHANNEL_ID, "Rest timer", NotificationManager.IMPORTANCE_HIGH).apply {
      enableVibration(true)
      vibrationPattern = longArrayOf(0, 250, 250, 250)
    }
    manager.createNotificationChannel(channel)
  }

  private fun launchIntent(): PendingIntent? {
    val intent = packageManager.getLaunchIntentForPackage(packageName) ?: return null
    intent.addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP)
    return PendingIntent.getActivity(
      this,
      0,
      intent,
      PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT,
    )
  }

  private fun isAppVisible(): Boolean {
    val info = ActivityManager.RunningAppProcessInfo()
    ActivityManager.getMyMemoryState(info)
    return info.importance <= ActivityManager.RunningAppProcessInfo.IMPORTANCE_FOREGROUND
  }

  private fun appMetaData() =
    try {
      packageManager.getApplicationInfo(packageName, PackageManager.GET_META_DATA).metaData
    } catch (e: Exception) {
      null
    }

  // The icon and colour the expo-notifications plugin wrote from app.json, so
  // our notifications look like every other one the app posts.
  private fun smallIcon(): Int {
    val fromExpo = appMetaData()?.getInt(EXPO_ICON_META, 0) ?: 0
    return if (fromExpo != 0) fromExpo else applicationInfo.icon
  }

  private fun accentColor(): Int {
    val res = appMetaData()?.getInt(EXPO_COLOR_META, 0) ?: 0
    return if (res != 0) ContextCompat.getColor(this, res) else NotificationCompat.COLOR_DEFAULT
  }

  companion object {
    private const val TAG = "rest-timer"
    // Contract with lib/notifications.ts ANDROID_CHANNELS (R5).
    const val CHANNEL_ID = "rest-timer"
    private const val ONGOING_ID = 0x5E57
    private const val ALERT_ID = 0x5E58
    private const val EXTRA_END_AT = "endAt"
    private const val EXTRA_LABEL = "label"
    private const val EXTRA_FALLBACK_ID = "fallbackId"
    private const val EXPO_ICON_META = "expo.modules.notifications.default_notification_icon"
    private const val EXPO_COLOR_META = "expo.modules.notifications.default_notification_color"

    fun intent(context: Context, endAtMillis: Long, label: String?, fallbackId: String?): Intent =
      Intent(context, RestTimerService::class.java).apply {
        putExtra(EXTRA_END_AT, endAtMillis)
        if (label != null) putExtra(EXTRA_LABEL, label)
        putExtra(EXTRA_FALLBACK_ID, fallbackId)
      }
  }
}
