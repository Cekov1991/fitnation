// The rest timer's OS-side alert (docs/specs/0013-rest-timer-notification.md).
//
// `RestTimer.tsx` counts down on the UI thread and only fires while the app is
// in the foreground. This module schedules a local notification for the same
// second so the phone still interrupts the user when it is locked or another
// app is up. R1: scheduled at rest start, moved on ±15 s, cancelled on skip /
// finish / session end / foreground completion — never "only when the app
// backgrounds", because start-then-cancel has no race.
//
// iOS holds the schedule itself. On Android this same notification is the
// belt-and-braces fallback behind the foreground service (step 3 of the spec,
// `modules/rest-timer`), which is what actually fires on the second there.
//
// Everything is best effort: a failure here must never break the in-app timer.
import * as Notifications from 'expo-notifications'
import { ensureAndroidChannels, getPermissionStatus, grantPushPermission, REST_TIMER_KIND } from './notifications'

// Only ever one rest at a time — `restRunId` in the session screen guarantees
// a start supersedes the previous one.
let scheduledId: string | null = null
let exerciseLabel: string | null = null
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

async function scheduleAt(endAt: number): Promise<void> {
  scheduledId = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Rest over',
      body: `Back to ${exerciseLabel ?? 'your workout'}`,
      sound: 'default',
      data: { kind: REST_TIMER_KIND },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: endAt,
      channelId: 'rest-timer',
    },
  })
}

export async function startRestAlert(input: { seconds: number; exerciseName: string | null }): Promise<void> {
  try {
    await cancelScheduled()
    exerciseLabel = input.exerciseName
    if (!(await hasPermission())) return
    // Android drops a notification whose channel does not exist, and the
    // channels are otherwise only created once a Device registers.
    await ensureAndroidChannels()
    await scheduleAt(Date.now() + input.seconds * 1000)
  } catch (e) {
    warn(e)
  }
}

// `seconds` is the new remaining time from now. Nothing scheduled (permission
// refused, or no rest running) means nothing to move.
export async function adjustRestAlert(seconds: number): Promise<void> {
  try {
    if (scheduledId === null) return
    await cancelScheduled()
    // The in-app timer completes on its own next frame and cancels via
    // handleRestFinished; an alert "now" would only double up the haptic.
    if (seconds <= 0) return
    await scheduleAt(Date.now() + seconds * 1000)
  } catch (e) {
    warn(e)
  }
}

export async function cancelRestAlert(): Promise<void> {
  try {
    exerciseLabel = null
    await cancelScheduled()
  } catch (e) {
    warn(e)
  }
}
