// The rest timer's OS-side alert (docs/specs/0013-rest-timer-notification.md).
//
// `RestTimer.tsx` counts down on the UI thread and only fires while the app is
// in the foreground. This module schedules a local notification for the same
// second so the phone still interrupts the user when it is locked or another
// app is up. R1: scheduled at rest start, moved on ±15 s, cancelled on skip /
// finish / session end / foreground completion — never "only when the app
// backgrounds", because start-then-cancel has no race.
//
// iOS holds the schedule itself. On Android the foreground service in
// `modules/rest-timer` is what fires on the second (R6–R8); this same local
// notification is kept as the belt-and-braces fallback for the case where the
// OS kills the service anyway.
//
// Everything is best effort: a failure here must never break the in-app timer.
import { Platform } from 'react-native'
import * as Notifications from 'expo-notifications'
import { RestTimer } from '../../modules/rest-timer'
import {
  ensureAndroidChannels,
  getPermissionStatus,
  grantPushPermission,
  REST_TIMER_CHANNEL_ID,
  REST_TIMER_KIND,
} from './notifications'

// Only ever one rest at a time — `restRunId` in the session screen guarantees
// a start supersedes the previous one.
let scheduledId: string | null = null
let endAt = 0
let exerciseLabel: string | null = null
// Bumped by every start and cancel. A start awaits the permission check (and
// possibly the OS prompt) before it can schedule; a skip or a newer start in
// that window must win, so each async step re-checks it still owns the rest.
let generation = 0

// With the service running, the fallback alarm is pushed this far past the
// end. The service posts its alert on the second and cancels the fallback by
// id; the gap makes sure the cancel lands before the alarm would have fired,
// so the user never sees two alerts. If the service is dead the fallback is
// simply this late — the last resort was never going to be exact.
export const ANDROID_FALLBACK_GRACE_MS = 5_000

// Null on iOS, web, and an Android binary built before the module existed.
const service = Platform.OS === 'android' ? RestTimer : null
// R3: if permission is undetermined when a rest first starts, ask then — once.
// On Android a refusal keeps `canAskAgain`, so without this the OS prompt
// would come back on every rest.
let askedThisLaunch = false

function warn(e: unknown): void {
  console.warn('[rest-timer]', e)
}

async function hasPermission(): Promise<boolean> {
  const status = await getPermissionStatus()
  if (status === 'granted') return true
  if (status !== 'undetermined' || askedThisLaunch) return false
  askedThisLaunch = true
  // Also pokes the Device heartbeat on a grant — wanted: a user who says yes
  // has just made the phone reachable for push too.
  return grantPushPermission()
}

async function cancelScheduled(): Promise<void> {
  const id = scheduledId
  scheduledId = null
  if (id !== null) await Notifications.cancelScheduledNotificationAsync(id)
}

// Arms the alert for the current `endAt`: the local notification (exact on
// iOS, the delayed fallback on Android) and, on Android, the service. Bails if
// the rest was cancelled or superseded (generation moved on) while the OS call
// was in flight — cancelling the fresh request so nothing is left orphaned.
async function armCurrent(gen: number, mode: 'start' | 'update'): Promise<void> {
  if (gen !== generation || endAt <= Date.now()) return
  let fallbackId: string | null = null
  try {
    fallbackId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Rest over',
        body: `Back to ${exerciseLabel ?? 'your workout'}`,
        sound: 'default',
        data: { kind: REST_TIMER_KIND },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: service ? endAt + ANDROID_FALLBACK_GRACE_MS : endAt,
        channelId: REST_TIMER_CHANNEL_ID,
      },
    })
  } catch (e) {
    warn(e)
  }
  if (gen !== generation) {
    if (fallbackId !== null) await Notifications.cancelScheduledNotificationAsync(fallbackId)
    return
  }
  scheduledId = fallbackId
  if (!service) return
  // Independent of the fallback: a refused service start still leaves the
  // alarm armed, and a failed alarm still gets the service.
  try {
    if (mode === 'start') service.start(endAt, exerciseLabel ?? '', fallbackId)
    else service.update(endAt, fallbackId)
  } catch (e) {
    warn(e)
  }
}

export async function startRestAlert(input: { seconds: number; exerciseName: string | null }): Promise<void> {
  const gen = ++generation
  try {
    exerciseLabel = input.exerciseName
    endAt = Date.now() + input.seconds * 1000
    await cancelScheduled()
    if (!(await hasPermission())) return
    // Android drops a notification whose channel does not exist, and the
    // channels are otherwise only created once a Device registers.
    await ensureAndroidChannels()
    await armCurrent(gen, 'start')
  } catch (e) {
    warn(e)
  }
}

// `seconds` is the new remaining time from now. Always records the new end,
// so a start still waiting on the permission check schedules the adjusted
// time; with nothing scheduled there is otherwise nothing to move.
export async function adjustRestAlert(seconds: number): Promise<void> {
  const gen = generation
  try {
    endAt = Date.now() + seconds * 1000
    if (scheduledId === null) return
    await cancelScheduled()
    // At zero the in-app timer completes on its own next frame and cancels via
    // handleRestFinished; an alert "now" would only double up the haptic.
    if (seconds <= 0) return
    await armCurrent(gen, 'update')
  } catch (e) {
    warn(e)
  }
}

export async function cancelRestAlert(): Promise<void> {
  generation++
  exerciseLabel = null
  // Stopping an idle service is a no-op, so no bookkeeping about whether it
  // was started: skip, finish and leave all just stop it.
  try {
    service?.stop()
  } catch (e) {
    warn(e)
  }
  try {
    await cancelScheduled()
  } catch (e) {
    warn(e)
  }
}
