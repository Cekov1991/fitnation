// The rest timer's OS-side alert (docs/specs/0013-rest-timer-notification.md).
//
// `RestTimer.tsx` counts down on the UI thread and only fires while the app is
// in the foreground. This module makes the phone interrupt the user at the
// same second when it is locked or another app is up. R1: armed at rest start,
// moved on ±15 s, cancelled on skip / finish / session end / foreground
// completion — never "only when the app backgrounds", because start-then-cancel
// has no race.
//
// Two mechanisms, one behaviour:
// - iOS: a scheduled local notification. iOS holds the schedule and fires it
//   whether the app is backgrounded or killed.
// - Android: the foreground service in `modules/rest-timer` (R6–R8), which
//   keeps the process alive, shows the OS-rendered countdown and posts the
//   alert on the second — exempt from Doze and OEM battery optimisers, which
//   throttle or kill scheduled alarms. The service is the sole owner of the
//   rest end there; the local notification is used on Android only when the
//   service refuses to start (Android 12+ from the background), or in a binary
//   built before the module existed.
//
// Everything is best effort: a failure here must never break the in-app timer.
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
// True while the service has been told about the current rest, so an adjust
// still reaches it when no local notification is scheduled.
let serviceArmed = false
// Bumped by every start and cancel. A start awaits the permission check (and
// possibly the OS prompt) before it can arm anything; a skip or a newer start
// in that window must win, so each async step re-checks it still owns the rest.
let generation = 0
// R3: if permission is undetermined when a rest first starts, ask then — once.
// On Android a refusal keeps `canAskAgain`, so without this the OS prompt
// would come back on every rest.
let askedThisLaunch = false

// Null on iOS, web, and an Android binary built before the module existed.
const service = RestTimer

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

// Schedules the local notification for `endAt`. Bails if the rest was
// cancelled or superseded (generation moved on) while the OS call was in
// flight — cancelling the fresh request so nothing is left orphaned.
async function scheduleLocal(gen: number): Promise<void> {
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Rest over',
      body: `Back to ${exerciseLabel ?? 'your workout'}`,
      sound: 'default',
      data: { kind: REST_TIMER_KIND },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: endAt,
      channelId: REST_TIMER_CHANNEL_ID,
    },
  })
  if (gen !== generation) {
    await Notifications.cancelScheduledNotificationAsync(id)
    return
  }
  scheduledId = id
}

async function armCurrent(gen: number, mode: 'start' | 'update'): Promise<void> {
  if (gen !== generation || endAt <= Date.now()) return
  if (service) {
    try {
      if (mode === 'start') service.start(endAt, exerciseLabel ?? '')
      else service.update(endAt, exerciseLabel ?? '')
      serviceArmed = true
      return
    } catch (e) {
      // The OS refused the service; the scheduled notification is the next
      // best thing.
      warn(e)
      serviceArmed = false
    }
  }
  await scheduleLocal(gen)
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
// so a start still waiting on the permission check arms the adjusted time;
// with nothing armed there is otherwise nothing to move.
export async function adjustRestAlert(seconds: number): Promise<void> {
  const gen = generation
  try {
    endAt = Date.now() + seconds * 1000
    if (scheduledId === null && !serviceArmed) return
    await cancelScheduled()
    // At zero the in-app timer completes on its own next frame; an alert "now"
    // would only double up the haptic.
    if (seconds <= 0) return
    await armCurrent(gen, 'update')
  } catch (e) {
    warn(e)
  }
}

export async function cancelRestAlert(): Promise<void> {
  generation++
  exerciseLabel = null
  serviceArmed = false
  // Stopping an idle service is a no-op, so skip, finish and leave all just
  // stop it rather than asking whether it was ever started.
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
