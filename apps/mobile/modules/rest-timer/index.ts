// JS face of the Android rest-timer foreground service (spec 0013 R6–R8).
//
// The service keeps the process alive with an ongoing, OS-rendered countdown
// while the user rests, and posts the "Rest over" alert at the exact second —
// the one mechanism Android exempts from Doze and OEM battery optimisers.
// `lib/restTimerAlert.ts` is the only caller.
//
// Null on iOS and web, and in a binary built before this module existed (an
// old dev client), so callers stay on the local-notification path there.
import { Platform } from 'react-native'
import { requireOptionalNativeModule } from 'expo'

export interface RestTimerService {
  // Start (or restart) the service. `label` is the exercise name for the
  // ongoing notification and the alert body; empty means "no exercise".
  start(endAtMillis: number, label: string): void
  // Move the end: re-posts the countdown and re-arms the alert.
  update(endAtMillis: number, label: string): void
  // Remove the countdown and stop the service without posting an alert.
  stop(): void
}

export const RestTimer: RestTimerService | null =
  Platform.OS === 'android' ? requireOptionalNativeModule<RestTimerService>('RestTimer') : null
