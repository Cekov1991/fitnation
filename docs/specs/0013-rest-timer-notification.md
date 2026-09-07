# Spec: The rest timer reaches you when the screen is off

Status: ready-for-agent
Origin: notifications design session, 2026-09-02 (phase 0 in the original brainstorm); Android approach and the launch check decided 2026-09-07.
Scope: `apps/mobile` only. No server, no `packages/shared`.

## Problem Statement

The rest timer is a UI element. `RestTimer.tsx` counts down on the UI thread
and fires `onComplete` when it hits zero — **if the app is in the foreground**.
Lock the phone or switch apps mid-rest and nothing happens until you come back,
at which point the `AppState` listener (`RestTimer.tsx:56-67`) notices the
deadline has passed and fires `onComplete` late, silently. `useKeepAwake()`
(`WorkoutSessionScreen.tsx:46`) keeps the screen on while the app is visible,
which is why this mostly works today; it does nothing once the user has locked
the phone or gone to check a message.

A rest timer's whole job is to interrupt you at the right second while you are
not looking at it. Today it can't.

## Decision: local on iOS, a foreground service on Android

Two platforms, two mechanisms, one behaviour. Both were chosen over the obvious
"schedule a local notification and hope" and over "have the server push it":

- **iOS — a scheduled local notification.** iOS holds the schedule and fires it
  on the second whether the app is backgrounded or killed. Nothing more is
  needed. A Live Activity (lock-screen countdown) would be nicer and is a
  separate, later spec — it needs a widget extension target.
- **Android — a foreground service.** Scheduled local notifications on Android
  are alarms, and alarms are inexact by default, throttled under Doze, and
  killed outright by OEM battery optimisers (Samsung, Xiaomi, …). Exact-alarm
  permissions help on some devices and can be revoked on others. A foreground
  service is the one mechanism Android exempts from all of that: our process
  stays alive with an *ongoing* notification, the JS timer keeps running, and
  the finish alert is posted by live code at the exact second. It is what
  Hevy and Strong do. Costs: a small native module and, on Android 14+, a
  declared foreground-service type.
- **Not the server.** A push for a 90-second timer trades alarm variance for
  network variance: gym basements are offline, FCM adds 1–5 s, Android
  down-ranks apps that send high-priority pushes every two minutes, and every
  rest becomes 2–3 API calls plus a cancellation race. Server scheduling stays
  where minutes of tolerance are fine — nudges and reminders.

A scheduled local notification is kept on Android too, as a belt-and-braces
fallback for the case where the service is killed anyway.

## Decisions (settled — do not reopen)

| # | Decision |
|---|---|
| R1 | The alert is scheduled/started at **rest start**, adjusted on ±15 s, cancelled on skip, finish, session end, and when the timer completes in the foreground. Not "only when the app backgrounds" — there is no reliable lock-screen signal, and start-then-cancel has no race. |
| R2 | Copy: title **Rest over**, body **Back to {exercise name}**. Default sound + vibration. No iOS time-sensitive interruption level (needs an entitlement; not worth it). |
| R3 | If notification permission is `undetermined` when a rest first starts, ask then — a contextual moment. Denied → the in-app timer works as today, no nagging. `denied` is never re-asked. |
| R4 | Rest-timer alerts are **independent of the server's Push Switch** (`push_enabled`). They are not push. |
| R5 | Android channels: this spec creates **`rest-timer`** (high importance, sound, vibration) and, so the server can start addressing them, **`reminders`** and **`progress`** (default importance) alongside the existing `default`. Channel ids are the contract with the back-end; the server sends `channelId` and Android drops a notification whose channel does not exist. |
| R6 | Android 14+ foreground-service type is **`specialUse`** with the manifest justification "workout rest-timer countdown". Rests can exceed 3 minutes, which rules out `shortService`. Requires a one-time Play Console foreground-service declaration (human step). |
| R7 | The Android service shows an **ongoing notification with an OS-rendered countdown** (`usesChronometer` + `chronometerCountDown`) while resting, replaced by the R2 alert at zero. No per-second updates from JS. |
| R8 | A native **local Expo module** in `apps/mobile/modules/rest-timer/` — no Notifee. One display library (`expo-notifications`) keeps channels and tap handling in one place; the module only starts/stops a service. |
| R9 | While the session screen is in the **foreground**, the finish alert is suppressed (the ring hits zero and the haptic fires as today). Suppression is by `data.kind === 'rest-timer'` in the existing foreground handler. |
| R10 | **Launch check.** Once per cold start, after auth resolves and only while the user is on `Tabs`, the app checks OS notification permission. `granted` → nothing. Otherwise the existing `NotificationPermissionSheet` is shown, at most **once every 7 days**. This supersedes 0012's M3 "never re-prompted": "Not now" now means "not for a week". |
| R11 | When permission is **`denied`** (the OS will never prompt again), the same sheet is shown on the same cadence with **Open Settings** in place of **Turn on**, since Settings is the only way back. |
| R12 | The cadence is one SecureStore timestamp, `pushPromptLastShownAt`, written whenever the sheet is shown from anywhere (onboarding included). It replaces the `pushPromptDismissed` boolean. |

## Behaviour

| Moment | iOS | Android |
|---|---|---|
| Rest starts (`handleStartRest`, `WorkoutSessionScreen.tsx:180`) | schedule local notification at `now + seconds` | start foreground service with `endAt`, label; **also** schedule the same local notification as fallback |
| ±15 s (`RestTimer.tsx` `addTime`/`subTime`) | cancel + reschedule | `update(endAt)` on the service; cancel + reschedule fallback |
| Skip / rest completes in foreground (`handleRestFinished`, `:186`) | cancel | stop service; cancel fallback |
| Session finish / cancel / leave | cancel | stop service; cancel fallback |
| App killed mid-rest | notification still fires (OS-held) | service keeps running (that is the point); if the OS kills it anyway, the fallback alarm is the last resort |
| Alert fires while session screen visible | suppressed (R9) | suppressed (R9); ongoing notification already gone because the JS timer completed first |
| Alert tapped | opens the app; no navigation change — the session screen is already the top of the stack | same |

Copy per R2; the exercise name is `currentExercise.session_exercise.exercise.name`
(`WorkoutSessionScreen.tsx:170`) at rest start. If a rest starts with no current
exercise (should not happen), body falls back to **Back to your workout**.

## Launch check

Why here: `shouldShowPermissionSheet` (`src/lib/pushPrompt.ts`) is only ever
evaluated from `OnboardingScreen.tsx:181`, and "Not now" is remembered
forever. Two groups are therefore never asked: everyone who finished onboarding
before #55 shipped, and anyone who dismissed once. The rest timer is the first
feature that is *worse* without permission, so this is the moment to fix that.

| OS permission at launch | last shown | Result |
|---|---|---|
| `granted` | — | nothing |
| `undetermined` | never, or > 7 days ago | sheet, **Turn on** → OS prompt |
| `undetermined` | ≤ 7 days ago | nothing |
| `denied` | never, or > 7 days ago | sheet, **Open Settings** → `Linking.openSettings()` |
| `denied` | ≤ 7 days ago | nothing |

Rules:
- Runs once per cold start, from `AppNavigator` (or a small hook mounted
  there), only when the initial route is `Tabs` — never during
  `EmailVerification` or `Onboarding`, which keeps its own moment. Wait for
  the splash overlay to be gone (`RootNavigator` hides it once auth resolves)
  so the sheet does not fight the launch animation.
- Never in the same launch as the onboarding sheet: onboarding writes
  `pushPromptLastShownAt`, so the 7-day gate already prevents it.
- Showing the sheet writes `pushPromptLastShownAt = now`, whatever the user
  picks. Granting makes the question moot; the heartbeat registers the Device
  (`grantPushPermission`).
- Copy is the existing sheet's. In the `denied` variant the body gains one
  sentence: **Notifications are off for Fit Nation in your phone's settings.**
  (the same line Profile shows) and the primary button reads **Open Settings**.
- No count cap. A user who wants it off says so in Settings, and the sheet's
  week-long silence is the cost of one tap.

`shouldShowPermissionSheet(status, lastShownAt: number | null, now: number):
boolean` replaces the `(status, dismissed)` signature; `PUSH_PROMPT_DISMISSED_KEY`
is removed and `OnboardingScreen.tsx:181-183` moves to the new gate. A
`pushPromptDismissed = '1'` left over from #55 is read once as "shown 7 days
ago is unknown — treat as never" and the key deleted; a one-line migration in
the same helper.

## Structure

### `src/lib/restTimerAlert.ts` — the one caller-facing API

```ts
export async function startRestAlert(input: { seconds: number; exerciseName: string | null }): Promise<void>
export async function adjustRestAlert(seconds: number): Promise<void>   // new remaining seconds from now
export async function cancelRestAlert(): Promise<void>
```

Implementation:
- `startRestAlert` → R3 permission check: `getPermissionStatus()`; if
  `undetermined`, `grantPushPermission()` from `lib/notifications.ts`. That
  helper also pokes the Device heartbeat on a grant, which is wanted here: a
  user who says yes has just made the phone reachable for push too, and
  registering it now is correct, not a side effect. Then `scheduleLocal(endAt)`;
  on Android additionally `RestTimer.start(endAt, label)` from the native
  module.
- One module-level `scheduledId: string | null` and `endAt` so adjust/cancel
  know what to touch. Only ever one rest at a time — `restRunId` in the screen
  guarantees a start supersedes the previous one.
- All calls best-effort: `try/catch` + `console.warn('[rest-timer]', e)`. A
  failure here must never break the in-app timer.
- `content.data = { kind: 'rest-timer' }`, `sound: 'default'`, Android
  `channelId: 'rest-timer'`.

### `src/components/ui/NotificationPermissionSheet.tsx` — one new prop

`variant: 'ask' | 'settings'` (default `'ask'`). `'settings'` swaps the primary
action to **Open Settings** and appends the denied sentence to the body.
Onboarding keeps `'ask'`; the launch check picks by permission status.

### `src/hooks/useLaunchPermissionCheck.ts`

Mounted once in `AppNavigator`. Reads permission + `pushPromptLastShownAt`,
decides via `shouldShowPermissionSheet`, and exposes `{ visible, variant,
onClose }` for the sheet rendered in `AppNavigator` above the stack. Best
effort: any SecureStore or permission error → don't show.

### `src/lib/notifications.ts` — additions

- `ANDROID_CHANNELS` replaces the single `ANDROID_CHANNEL_ID`:
  ```ts
  export const ANDROID_CHANNELS = {
    default:    { name: 'Notifications',    importance: AndroidImportance.DEFAULT },
    'rest-timer': { name: 'Rest timer',     importance: AndroidImportance.HIGH, sound: 'default', vibrationPattern: [0, 250, 250, 250] },
    reminders:  { name: 'Workout reminders', importance: AndroidImportance.DEFAULT },
    progress:   { name: 'Progress',          importance: AndroidImportance.DEFAULT },
  } as const
  ```
  `ensureAndroidChannels()` creates all four; call it where
  `ensureAndroidChannel()` is called today. Keep `defaultChannel: "default"` in
  `app.json`.
- `configureForegroundHandler`: if `notification.request.content.data?.kind ===
  'rest-timer'`, return all-false and **do not toast** — the screen is showing
  the timer. Everything else unchanged (M4).

### `modules/rest-timer/` — local Expo module (Android only)

```
modules/rest-timer/
  expo-module.config.json        { "platforms": ["android"], "android": { "modules": ["expo.modules.resttimer.RestTimerModule"] } }
  index.ts                       // JS API with a no-op stub on iOS/web
  plugin/withRestTimerService.js // config plugin: manifest permissions + <service>
  android/build.gradle
  android/src/main/java/expo/modules/resttimer/
    RestTimerModule.kt           // start(endAtMillis: Long, label: String), update(endAtMillis), stop()
    RestTimerService.kt          // the foreground service
```

`RestTimerService`:
- `startForeground(id, notification, FOREGROUND_SERVICE_TYPE_SPECIAL_USE)` on
  API 34+, plain `startForeground` below.
- Ongoing notification on channel `rest-timer`: title **Resting**, subtext
  `label`, `setUsesChronometer(true)`, `setChronometerCountDown(true)`,
  `setWhen(endAtMillis)`, `setOngoing(true)`, `setOnlyAlertOnce(true)`,
  content intent = launch the app.
- A `Handler.postDelayed` to `endAtMillis`: post the R2 alert (channel
  `rest-timer`, `setAutoCancel`, default sound/vibration), then `stopSelf()`.
  `update()` re-posts the ongoing notification and re-arms the handler.
- `stop()` cancels the ongoing notification and `stopSelf()`.
- Service must be started with `startForegroundService` from the module while
  the app is in the foreground (it always is — rest starts from a tap).

Config plugin adds to the manifest:
```xml
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_SPECIAL_USE" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<service android:name="expo.modules.resttimer.RestTimerService"
         android:foregroundServiceType="specialUse" android:exported="false">
  <property android:name="android.app.PROPERTY_SPECIAL_USE_FGS_SUBTYPE"
            android:value="workout rest-timer countdown" />
</service>
```
Register the plugin in `app.json` `plugins`. `ios/` and `android/` are
gitignored (CNG), so everything must come from the plugin — never edit the
generated projects.

### Wiring in `WorkoutSessionScreen.tsx`

- `handleStartRest(seconds)` (`:180`) → also `startRestAlert({ seconds, exerciseName })`.
- `handleRestFinished` (`:186`) → also `cancelRestAlert()`. It already serves both `onComplete` and `onSkip`.
- The finish / cancel / leave paths that set `isCleanExitRef` (`:302`, `:323`) → `cancelRestAlert()` before navigating.
- `RestTimer` gains an optional `onAdjust?: (remaining: number) => void`, called from `addTime`/`subTime` with the new remaining seconds; the screen passes `adjustRestAlert`.
- Unmount safety: a `useEffect` cleanup on the screen calls `cancelRestAlert()`.

## Human steps (not for an agent)

1. **Play Console → App content → Foreground service permissions**: declare
   `specialUse` with the rest-timer justification and a short screen recording
   of the timer. Required before a release with this build passes review.
2. New native code ⇒ new **EAS build** and store release; OTA cannot ship it.
   Bump `version`.
3. Test on at least one aggressive-OEM Android (Samsung or Xiaomi) with battery
   optimisation on, phone locked for a 3-minute rest.

## Tests

`vitest` (node environment; mock `expo-notifications`, `react-native`
`Platform`, and the native module).

- `restTimerAlert`: start schedules once with the right content
  (`kind: 'rest-timer'`, channel, title/body from the exercise name, fallback
  body when the name is null); adjust cancels the previous id and reschedules;
  cancel with nothing scheduled is a no-op; on Android start also calls
  `RestTimer.start` and cancel also calls `RestTimer.stop`; on iOS the native
  module is never touched; a throwing native call does not reject.
- Permission gating: `undetermined` → asks once, then schedules on grant and
  does nothing on refusal; `denied` → never asks, never schedules.
- Foreground handler: a `rest-timer` notification is fully suppressed and not
  toasted; any other notification still toasts (existing behaviour).
- `ANDROID_CHANNELS` contains exactly `default`, `rest-timer`, `reminders`,
  `progress` — the ids are a contract with the back-end.
- `shouldShowPermissionSheet(status, lastShownAt, now)`: `granted` → false
  always; `undetermined`/`denied` with null → true; with 6 days ago → false;
  with 8 days ago → true; the legacy `'1'` flag reads as null.
- Launch check decides `variant` from status (`undetermined` → `ask`,
  `denied` → `settings`) and writes the timestamp when shown.
- Manual, recorded in the PR: a pre-#55 account that never saw the sheet
  sees it on first launch; "Not now" then relaunch shows nothing; iOS
  locked-phone rest fires on time; Android
  ongoing countdown visible in the shade, alert on time with the screen
  locked, skip clears both; foreground completion shows no OS alert.

## Supersedes

0012 **M3** ("Not now is remembered and never re-prompted") — replaced by R10–R12.
Add a one-line note under M3 in 0012 pointing here.

## Out of scope

iOS Live Activity; a whole-session "workout in progress" ongoing notification
(same service could carry it — spec 0004 option 3); any change to how rest
seconds are chosen; web.

## Order of work

1. Launch check: `pushPrompt.ts` new gate + migration, sheet `variant`,
   `useLaunchPermissionCheck` in `AppNavigator`, onboarding moved to the new
   gate. Tests. Ship-able on its own.
2. `lib/notifications.ts` channels + handler suppression; `lib/restTimerAlert.ts`
   with the iOS path; wiring in the screen. Tests. Ship-able on its own — iOS
   is fully solved at this point and Android gets the fallback-alarm behaviour.
3. `modules/rest-timer` native module + config plugin; Android path in
   `restTimerAlert`. Dev build, real-device test.
4. Human steps; release.

One branch, `feat/mobile/rest-timer-alert`, one PR.
