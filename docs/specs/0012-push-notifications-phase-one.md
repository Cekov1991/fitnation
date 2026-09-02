# Spec: Push notifications, phase one — register a Device, ask permission, open on tap

Status: ready-for-agent
Origin: notifications design session, 2026-09-02. Back-end half is `back-end/docs/issues/018-push-notifications-phase-one.md`; the API contract lives there and is copied below — change both or neither.
Scope: `apps/mobile`, `packages/shared`

## Problem Statement

The app cannot receive a push notification. There is no `expo-notifications`,
no FCM/APNs credentials on the EAS project, no deep-link `linking` config on
the `NavigationContainer` (`src/navigation/RootNavigator.tsx:66`), and the
server has no idea which phones exist.

Phase one makes the phone reachable and gives the user control. The only
notification the server sends in this phase is the **Inactivity Nudge**
(3 / 7 / 14 days without a completed workout, 18:00 local), and it opens the
Dashboard. Everything about *what* to send and *when* is server-side; the app's
job is to register, ask once, route taps, and offer an off switch.

Vocabulary is the back-end glossary (`back-end/CONTEXT.md` → *Notifications*):
a **Device** is this installation signed in as this user; a **Push Token** is
the Expo token; the **Inactivity Nudge** is the notification. Use those words
in code and copy.

## Decisions (settled — do not reopen)

| # | Decision |
|---|---|
| M1 | **Expo Push Service.** `getExpoPushTokenAsync({ projectId })`, never `getDevicePushTokenAsync`. |
| M2 | Register with **`PUT /devices`** after auth resolves and on foreground, throttled (see *Heartbeat*). **No unregister call on logout** — the server ends the Device when the Sanctum token is revoked (`POST /logout` already does this). |
| M3 | Permission is asked **once, after onboarding completes**, behind an explainer sheet. "Not now" is remembered and never re-prompted; the Profile toggle is the way back. |
| M4 | Foreground notifications are shown as the app's own **toast** (`src/lib/toast.ts`), not the OS banner. |
| M5 | Deep links use the custom scheme **`fitnation://`** only. Universal links are phase two. |
| M6 | One Android channel, id **`default`**, name "Notifications". |
| M7 | Per-Device timezone is sent on every registration: `Intl.DateTimeFormat().resolvedOptions().timeZone`. |
| M8 | Global switch is `user.push_enabled` from the server (`PATCH /notification-settings`), shown in Profile. Local OS permission state is shown alongside it, read-only, with a "Open Settings" action when denied. |
| M9 | Explicit prompt, not iOS provisional authorization. |

## API contract (from back-end 018)

**`PUT /api/devices`** — idempotent for the calling session
```ts
interface RegisterDeviceInput {
  push_token: string           // ExponentPushToken[...]
  platform: 'ios' | 'android'
  timezone?: string | null     // IANA
  app_version?: string | null  // Constants.expoConfig?.version
  build_profile?: string | null // 'development' | 'preview' | 'production'
  device_name?: string | null  // Device.modelName
}
interface DeviceResource {
  id: number; platform: 'ios' | 'android'; timezone: string | null;
  app_version: string | null; last_seen_at: string
}
// 200 { data: DeviceResource }
```

**`PATCH /api/notification-settings`** — `{ push_enabled: boolean }` → `200 { user: UserResource }`

**`UserResource`** gains `push_enabled: boolean`.

Notification payload the server sends (what `data` contains on tap):
```ts
{ url: 'fitnation://dashboard' }   // phase one only ever sends this
```

## Native setup

1. `pnpm --filter mobile add expo-notifications expo-device`
2. `app.json` plugins: add
   ```json
   ["expo-notifications", { "icon": "./assets/notification-icon.png", "color": "#0F0F0F", "defaultChannel": "default" }]
   ```
   The icon must be a **white-on-transparent** 96×96 PNG (Android renders it
   as a silhouette). Create `assets/notification-icon.png` from the logo.
3. `app.json`: `"scheme": "fitnation"`. Also add `android.googleServicesFile:
   "./google-services.json"` and commit the file — it holds no secrets.
4. Credentials, done once by a human with Firebase + EAS access, **not by an
   agent**:
   - Firebase project → add Android app `com.fitnation.app` → download
     `google-services.json` into `apps/mobile/`.
   - Firebase → Project settings → Service accounts → Generate new private key
     → `eas credentials` → Android → production → Google Service Account Key
     for FCM V1 → upload. Repeat for `development`/`preview` if they are ever
     tested on Android.
   - iOS: `eas credentials` → iOS → Push Key → let EAS generate. (Or it will
     prompt on the next `eas build`.)
   - expo.dev → project → Credentials → Push Notifications → *Enable push
     security* → create access token → hand to whoever holds the server
     `.env` (`EXPO_ACCESS_TOKEN`).
5. New native modules ⇒ a new **build**, not an OTA update. Bump `version` in
   `app.json`; `runtimeVersion.policy` is `appVersion`, so older builds will
   not receive JS that imports `expo-notifications`. That is the intended
   guard, not a problem.

Remote push does not work in Expo Go on Android and never on the iOS
simulator. The `development` EAS profile already builds a dev client; test on
a real phone.

## `packages/shared`

- `types/api.ts`: `RegisterDeviceInput`, `DeviceResource`, `push_enabled` on
  `UserResource`.
- `api.ts`: `devicesApi.register(input)` → `PUT /devices`;
  `notificationSettingsApi.update({ push_enabled })` → `PATCH
  /notification-settings`. Export both from `index.ts`.
- `hooks/useApi.ts`: `useRegisterDevice()` (mutation, no cache side effects),
  `useUpdateNotificationSettings()` (mutation; `onSuccess` sets `['profile']`
  from `response.user` and invalidates `['user']`, mirroring
  `useUpdateProfile` at `:57`).
- No Expo imports in `shared` — it is consumed by the web app too.

## `apps/mobile`

### `src/lib/notifications.ts` — the one place that talks to `expo-notifications`

```ts
export async function getPermissionStatus(): Promise<'granted' | 'denied' | 'undetermined'>
export async function requestPermission(): Promise<boolean>
export async function getPushToken(): Promise<string | null>   // null if no permission / no projectId / simulator
export async function ensureAndroidChannel(): Promise<void>    // setNotificationChannelAsync('default', …)
export function configureForegroundHandler(): void           // setNotificationHandler → shouldShowBanner:false, then showToast(title+body)
export function buildRegistration(pushToken: string): RegisterDeviceInput
```

`projectId` comes from `Constants.expoConfig?.extra?.eas?.projectId` (it is
`3c138cd9-…` in `app.json`). `build_profile` from
`Constants.expoConfig?.extra?.eas?.buildProfile ?? (__DEV__ ? 'development' : 'production')`
— EAS injects `buildProfile` at build time; fall back rather than fail.

### `src/hooks/useDeviceRegistration.ts` — heartbeat

Mounted once inside `AuthProvider` (or as a sibling hook in `App.tsx` that
reads `useAuth()`). Runs `register()` when **all** of: `user` is set,
`onboarding_completed_at` is set, permission is `granted`. Triggers:

- auth resolves to a user (cold start, login);
- `AppState` → `active`, throttled: skip unless ≥ 24 h since the last
  successful registration **or** the token / timezone differs from what was
  last sent. Persist `{ token, timezone, sentAt }` in `SecureStore` under
  `lastDeviceRegistration`.

Failures are swallowed with `console.warn('[push]', e)` — registration is
best-effort and will retry on the next trigger. Never toast a registration
failure.

Nothing runs on logout. The `SecureStore` record is cleared on logout so a
different user on the same phone registers immediately.

### Permission flow

`src/screens/placeholders/OnboardingScreen.tsx:130` calls
`completeOnboarding()` then `refreshUser()` (`:160`). After `refreshUser`
resolves, and before the navigator swaps to `Tabs`, show
`NotificationPermissionSheet` (new, `src/components/ui/`, styled like
`ConfirmDialog`):

- Title **Stay on track**
- Body **We'll only nudge you when you've gone quiet — no spam, no marketing.**
- **Turn on** → `requestPermission()`; on grant, the heartbeat hook fires on
  the next render because `user.onboarding_completed_at` is now set.
- **Not now** → `SecureStore.setItemAsync('pushPromptDismissed', '1')`.

Skip the sheet entirely if permission is already `granted` or `denied` (denied
= the OS will not re-prompt; the sheet would lie), or if `pushPromptDismissed`
is set. Users who completed onboarding before this build never see the sheet;
they find the toggle in Profile.

### Profile toggle

`src/screens/placeholders/ProfileScreen.tsx` — new section **Notifications**
above **Log Out** (`:750`):

- Row **Push notifications** with a `Switch` bound to
  `profile.push_enabled`, calling `useUpdateNotificationSettings`. Optimistic
  flip; revert + toast on error (mutation errors already toast globally via
  `MutationCache` in `App.tsx:40`).
- When OS permission is `denied` and `push_enabled` is true, a secondary line
  **Notifications are off for Fit Nation in your phone's settings.** with an
  **Open Settings** link → `Linking.openSettings()`.
- When permission is `undetermined` (user dismissed the sheet), the switch's
  first turn-on calls `requestPermission()` first; if refused, leave
  `push_enabled` untouched and show the denied line.

### Deep links

`RootNavigator.tsx:66` — `NavigationContainer` gains a `linking` prop:

```ts
const linking: LinkingOptions<AppStackParamList> = {
  prefixes: ['fitnation://'],
  config: {
    screens: {
      Tabs: { screens: { Dashboard: 'dashboard', Progress: 'progress', Plans: 'plans', Profile: 'profile' } },
      WorkoutSession: 'workout-session/:sessionId',
      SessionDetail: 'session/:sessionId',
      ProgramDetail: 'program/:programId',
    },
  },
  async getInitialURL() {
    const url = await Linking.getInitialURL()
    if (url) return url
    const response = await Notifications.getLastNotificationResponseAsync()
    return response?.notification.request.content.data?.url ?? null
  },
  subscribe(listener) {
    const linkingSub = Linking.addEventListener('url', ({ url }) => listener(url))
    const notifSub = Notifications.addNotificationResponseReceivedListener(r => {
      const url = r.notification.request.content.data?.url
      if (typeof url === 'string') listener(url)
    })
    return () => { linkingSub.remove(); notifSub.remove() }
  },
}
```

Only `dashboard` is sent in phase one; the other routes cost nothing and stop
phase two from touching this file. A tap while logged out lands on the auth
stack and the URL is dropped — acceptable; do not build "resume after login"
now.

Routes with params (`:sessionId`) arrive as strings, which matches
`AppStackParamList` (`WorkoutSession: { sessionId: string }`).

### Foreground

`configureForegroundHandler()` is called once at module load in `App.tsx`.
Handler returns `{ shouldShowBanner: false, shouldShowList: true,
shouldPlaySound: false, shouldSetBadge: false }` and calls
`showToast(\`${title} — ${body}\`, 'info')`. The toast is not tappable in
phase one; the notification is still in the tray/list if the user wants it.

## Tests

`vitest` at the repo root (`pnpm test`); colocate as the existing
`*.test.ts` files do.

- `buildRegistration()` — produces the contract shape; `timezone` is an IANA
  string; `build_profile` falls back correctly when `extra.eas.buildProfile`
  is absent (mock `expo-constants`).
- Heartbeat throttle — a pure `shouldRegister(last, now, token, tz)` helper
  extracted for this: returns true when no record, when ≥24 h, when token
  differs, when tz differs; false otherwise. Test the helper, not the hook.
- Linking `getInitialURL` — returns the OS URL when present, else the last
  notification response's `data.url`, else null (mock both modules).
- Permission sheet gating — a pure `shouldShowPermissionSheet(status,
  dismissed)` helper: only `('undetermined', false)` is true.
- Manual, on a real phone, recorded in the PR: `php artisan push:test <id>`
  from the back-end reaches the device; tapping it cold, backgrounded and
  foregrounded lands on Dashboard / toasts respectively; the Profile toggle
  round-trips.

## Out of scope

Rest-timer local notification (phase 0 — separate, no server), workout-day
reminders, per-category preferences, an in-app inbox, badge counts, universal
links, web push. A phase-two spec will reference this one.

## Order of work

1. `shared` types + api + hooks. Web typecheck must still pass (`pnpm
   typecheck`).
2. `lib/notifications.ts`, native config, credentials (human), a dev build.
3. Heartbeat hook + permission sheet + Profile toggle.
4. `linking` + foreground handler.
5. Manual verification against back-end PR 2 (`push:test`) and PR 3 (a real
   nudge, by setting a test user's sessions in the past).

One branch, `feat/mobile/push-phase-one`, one PR; the native-config step
alone is not shippable.
