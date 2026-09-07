package expo.modules.resttimer

import android.content.Context
import android.content.Intent
import androidx.core.content.ContextCompat
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

// Spec 0013 R8: the module only starts, moves and stops the service. Display
// (channels, tap handling) stays with expo-notifications.
class RestTimerModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("RestTimer")

    Function("start") { endAtMillis: Long, label: String, fallbackId: String? ->
      arm(RestTimerService.armIntent(context, endAtMillis, label, fallbackId))
    }

    // Same as start; the label rides along so a service the OS killed and
    // restarted still names the exercise.
    Function("update") { endAtMillis: Long, label: String, fallbackId: String? ->
      arm(RestTimerService.armIntent(context, endAtMillis, label, fallbackId))
    }

    Function("stop") {
      stop()
    }
  }

  // A rest starts from a tap, so the app is in the foreground and Android lets
  // us start a foreground service. If it ever is not (Android 12+ throws), the
  // caller falls back to the scheduled notification.
  private fun arm(intent: Intent) {
    try {
      ContextCompat.startForegroundService(context, intent)
    } catch (e: Exception) {
      throw CodedException("ERR_REST_TIMER_SERVICE", "Could not start the rest-timer service", e)
    }
  }

  // Delivered as a command so it queues behind a start still in flight (see
  // RestTimerService.onStartCommand). A running foreground service keeps the
  // app eligible to call startService; if the OS still refuses — no service
  // running and the app in the background — there is nothing to stop, and
  // stopService is the harmless no-op that says so.
  private fun stop() {
    val intent = RestTimerService.stopIntent(context)
    try {
      context.startService(intent)
    } catch (e: Exception) {
      context.stopService(intent)
    }
  }
}
