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
      startService(RestTimerService.intent(context, endAtMillis, label, fallbackId))
    }

    Function("update") { endAtMillis: Long, fallbackId: String? ->
      startService(RestTimerService.intent(context, endAtMillis, null, fallbackId))
    }

    Function("stop") {
      context.stopService(Intent(context, RestTimerService::class.java))
    }
  }

  // A rest starts from a tap, so the app is in the foreground and Android lets
  // us start a foreground service. If it ever is not (Android 12+ throws), the
  // caller falls back to the scheduled notification.
  private fun startService(intent: Intent) {
    try {
      ContextCompat.startForegroundService(context, intent)
    } catch (e: Exception) {
      throw CodedException("ERR_REST_TIMER_SERVICE", "Could not start the rest-timer service", e)
    }
  }
}
