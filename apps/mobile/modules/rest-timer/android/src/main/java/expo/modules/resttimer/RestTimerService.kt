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
import android.os.PowerManager
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat

/**
 * Foreground service for one rest (spec 0013 R6, R7).
 *
 * While resting it shows an ongoing notification whose countdown the OS renders
 * (chronometer, no per-second updates from JS). At `endAt` it posts the "Rest
 * over" alert and stops. An update re-posts the countdown and re-arms the
 * alert; ACTION_STOP removes everything without an alert.
 *
 * The finish is a `Handler` delay, which counts uptime — time the CPU is awake.
 * A locked phone suspends the CPU within seconds, so a partial wake lock is
 * held for the rest: that is what makes "live code fires on the second" true.
 */
class RestTimerService : Service() {
  private val handler = Handler(Looper.getMainLooper())
  private var endAt = 0L
  private var label = ""
  private var wakeLock: PowerManager.WakeLock? = null
  private val onRestOver = Runnable { finishRest() }

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    if (intent?.action == ACTION_STOP) {
      Log.i(TAG, "stop requested")
      // Routed through the service (not Context.stopService) so a stop that
      // lands right after a start still runs after that start's
      // startForeground — stopping first would crash the app on Android 8–13.
      stopSelf()
      return START_NOT_STICKY
    }
    endAt = intent?.getLongExtra(EXTRA_END_AT, endAt) ?: endAt
    intent?.getStringExtra(EXTRA_LABEL)?.let { label = it }

    ensureChannel()
    // The user is back and resting again: the previous "Rest over" has done its job.
    NotificationManagerCompat.from(this).cancel(ALERT_ID)
    try {
      val notification = ongoingNotification()
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
        startForeground(ONGOING_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE)
      } else {
        startForeground(ONGOING_ID, notification)
      }
    } catch (e: Exception) {
      // Missing permission or a background start the OS refused. Nothing more
      // to do here; the in-app timer still runs.
      Log.w(TAG, "startForeground failed", e)
      stopSelf()
      return START_NOT_STICKY
    }

    val remaining = (endAt - System.currentTimeMillis()).coerceAtLeast(0)
    Log.i(TAG, "armed: endAt=$endAt remaining=${remaining}ms label='$label' startId=$startId")
    holdWakeLock(remaining)
    handler.removeCallbacks(onRestOver)
    handler.postDelayed(onRestOver, remaining)
    return START_NOT_STICKY
  }

  override fun onDestroy() {
    Log.i(TAG, "destroyed")
    handler.removeCallbacks(onRestOver)
    releaseWakeLock()
    stopForeground(STOP_FOREGROUND_REMOVE)
    super.onDestroy()
  }

  private fun finishRest() {
    val visible = isAppVisible()
    Log.i(TAG, "rest over: late=${System.currentTimeMillis() - endAt}ms appVisible=$visible")
    // R9: with the session screen visible the ring hits zero and the haptic
    // fires; an OS alert on top would be noise.
    if (!visible) postAlert()
    stopForeground(STOP_FOREGROUND_REMOVE)
    stopSelf()
  }

  private fun ongoingNotification(): Notification =
    baseNotification()
      .setContentTitle("Resting")
      .apply { if (label.isNotEmpty()) setSubText(label) }
      .setUsesChronometer(true)
      .setChronometerCountDown(true)
      .setWhen(endAt)
      .setShowWhen(true)
      .setOngoing(true)
      .setOnlyAlertOnce(true)
      // No sound, vibration or heads-up peek for the countdown itself, even
      // though it sits on the high-importance rest-timer channel.
      .setSilent(true)
      .setCategory(NotificationCompat.CATEGORY_PROGRESS)
      // Android 12+ otherwise delays a foreground-service notification by ~10 s.
      .setForegroundServiceBehavior(NotificationCompat.FOREGROUND_SERVICE_IMMEDIATE)
      .build()

  private fun postAlert() {
    // Copy per R2; mirrors the local notification built in lib/restTimerAlert.ts.
    val alert = baseNotification()
      .setContentTitle("Rest over")
      .setContentText(if (label.isNotEmpty()) "Back to $label" else "Back to your workout")
      .setAutoCancel(true)
      .setPriority(NotificationCompat.PRIORITY_HIGH)
      .setDefaults(NotificationCompat.DEFAULT_ALL)
      .setCategory(NotificationCompat.CATEGORY_ALARM)
      .build()
    try {
      NotificationManagerCompat.from(this).notify(ALERT_ID, alert)
      Log.i(TAG, "alert posted")
    } catch (e: SecurityException) {
      Log.w(TAG, "POST_NOTIFICATIONS not granted", e)
    }
  }

  private fun baseNotification(): NotificationCompat.Builder =
    NotificationCompat.Builder(this, CHANNEL_ID)
      .setSmallIcon(smallIcon())
      .setColor(accentColor())
      .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
      .setContentIntent(launchIntent())

  private fun holdWakeLock(millis: Long) {
    releaseWakeLock()
    val power = getSystemService(PowerManager::class.java) ?: return
    wakeLock = power.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "fitnation:rest-timer").apply {
      setReferenceCounted(false)
      acquire(millis + 1_000)
    }
  }

  private fun releaseWakeLock() {
    wakeLock?.let { if (it.isHeld) it.release() }
    wakeLock = null
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
    private const val ACTION_STOP = "expo.modules.resttimer.STOP"
    private const val ONGOING_ID = 0x5E57
    private const val ALERT_ID = 0x5E58
    private const val EXTRA_END_AT = "endAt"
    private const val EXTRA_LABEL = "label"
    private const val EXPO_ICON_META = "expo.modules.notifications.default_notification_icon"
    private const val EXPO_COLOR_META = "expo.modules.notifications.default_notification_color"

    fun armIntent(context: Context, endAtMillis: Long, label: String): Intent =
      Intent(context, RestTimerService::class.java).apply {
        putExtra(EXTRA_END_AT, endAtMillis)
        putExtra(EXTRA_LABEL, label)
      }

    fun stopIntent(context: Context): Intent =
      Intent(context, RestTimerService::class.java).setAction(ACTION_STOP)
  }
}
