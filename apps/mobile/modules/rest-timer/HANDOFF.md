# Handoff: ship the Android rest-timer service

Written 2026-09-10 for whoever releases spec 0013 step 3. Read top to bottom
once; every command is meant to be copied as-is. Run commands from the
`front-end` folder unless a step says otherwise.

## What this is

When a user starts a rest between sets, Android shows a notification with a
live countdown ("Resting · Wide-Grip Lat Pulldown · 1:30") and, at zero, a
"Rest over" alert with sound and vibration. This works with the screen locked
and with the app in the background. It is done by a small **foreground
service** written in Kotlin, which Android exempts from battery optimisation.
The design and the reasons are in `docs/specs/0013-rest-timer-notification.md`.

Everything is already coded, reviewed and tested on an emulator. What is left:

1. Check it builds and works on your machine.
2. One form in Google Play Console (a human must do this; it cannot be automated).
3. Merge, build, release.

iOS is not affected by this work. iOS already got its part in PR #56.

## Where the code is

Branch: `feat/mobile/rest-timer-android-service` (rebased on `main` 2026-09-10).

| Path | What it is |
|---|---|
| `apps/mobile/modules/rest-timer/` | The native module. Nothing outside this folder is native. |
| `…/android/src/main/java/expo/modules/resttimer/RestTimerService.kt` | The foreground service: countdown notification, the alert at zero, wake lock. |
| `…/android/src/main/java/expo/modules/resttimer/RestTimerModule.kt` | The bridge JavaScript calls: `start`, `update`, `stop`. |
| `…/plugin/withRestTimerService.js` | Adds the permissions and the `<service>` entry to the Android manifest at build time. |
| `…/index.ts` | The JavaScript side of the module. |
| `apps/mobile/src/lib/restTimerAlert.ts` | Decides when to start, move and stop the service. |
| `apps/mobile/app.json` | Registers the plugin (`"./modules/rest-timer/plugin/withRestTimerService.js"`). |

Do **not** edit anything under `apps/mobile/android/` or `apps/mobile/ios/`.
Those folders are generated from `app.json` and the plugin, and are not
committed.

## Before you start

You need:

- The repo cloned, `pnpm install` done, and the app running once via
  `npx expo run:ios` or `npx expo run:android` (see `apps/mobile/DEV_SETUP.md`).
- Android Studio with an SDK, and one emulator image at **API 34 or newer**
  (a Pixel with Android 14 or 15). Android 14 is where the foreground-service
  rules changed, so test on that or newer.
- Logged in to EAS: `eas whoami` prints `fitnation`.
- Someone with **Google Play Console** access for the Fit Nation app (for step 3).
- One physical Samsung or Xiaomi phone for the final test (step 6). Any recent
  model is fine.

## Step 1 — get the branch

```bash
git fetch origin
git checkout feat/mobile/rest-timer-android-service
git log --oneline origin/main..HEAD
```

You should see exactly four commits, all about the rest-timer service. If
`main` has moved since 2026-09-10, rebase first:

```bash
git rebase origin/main
```

If git reports a conflict, the only file likely to conflict is
`apps/mobile/src/screens/placeholders/WorkoutSessionScreen.tsx`, in a comment.
Keep this branch's version of that block, then `git add` the file and
`git rebase --continue`.

Then run the checks. Both must be green before you continue:

```bash
pnpm test
cd apps/mobile && pnpm exec tsc --noEmit; cd ../..
```

`tsc` prints a handful of errors that also exist on `main` (old screens). That
is normal. Anything mentioning `rest-timer`, `restTimerAlert`, `RestTimer` or
`WorkoutSessionScreen` is not normal — stop and ask.

## Step 2 — build it locally and try it on the emulator

Native code changed, so the app has to be rebuilt. Metro alone is not enough.

```bash
cd apps/mobile
npx expo prebuild --platform android --clean
npx expo run:android
```

The first command regenerates the `android/` folder with the plugin applied.
The second builds and installs the app on the running emulator and starts
Metro. First build takes several minutes.

Check the manifest came out right (run from `apps/mobile`):

```bash
grep -c "RestTimerService\|FOREGROUND_SERVICE_SPECIAL_USE\|WAKE_LOCK" android/app/src/main/AndroidManifest.xml
```

It must print `3` or more. If it prints `0`, the plugin did not run; check
that `app.json` still lists it under `plugins`.

Now test by hand. In a second terminal, keep this running so you see what the
service does:

```bash
adb logcat -s rest-timer
```

Start a workout, log a set, tap the stopwatch button to start a rest. Then:

| Do this | You should see |
|---|---|
| Pull down the notification shade | A "Resting" notification with the exercise name and a countdown that ticks by itself. Log line `armed: endAt=…`. |
| Tap **+15s** or **-15s** in the app | The countdown in the shade jumps by 15 s. A new `armed:` log line. |
| Press Home, wait for zero | One "Rest over / Back to <exercise>" notification with sound. Log lines `rest over: … appVisible=false` then `alert posted`. |
| Start a rest, press the power button to lock, wait for zero | Same alert on the lock screen. (Set a screen lock first if the emulator has none: `adb shell locksettings set-disabled false`.) |
| Start a rest, tap the **X** (skip) | "Resting" disappears. No alert. Log `stop requested`, `destroyed`. |
| Start a rest and stay in the app until zero | Phone vibrates from the app. **No** OS notification. Log `rest over: … appVisible=true`. |
| Start a new rest while the old "Rest over" is still in the shade | The old "Rest over" disappears. |

If the app says "Cannot find native module 'RestTimer'", the emulator is
running an old build. Run `npx expo run:android` again.

## Step 3 — Google Play Console declaration (human step)

Android 14+ makes every foreground service declare a *type*. Ours is
`specialUse`, which Google reviews by hand. Without this form, the first
release containing this code is **rejected** at upload, including to the
internal testing track.

1. Open Play Console → the Fit Nation app.
2. Left menu → **Policy** → **App content**.
3. Find **Foreground service permissions** → **Manage** (or **Start**).
4. Answer that the app uses foreground services. When asked for the type, pick
   **Special use**.
5. Describe the task. Suggested text:

   > The app runs a rest-timer countdown between exercise sets. The service
   > keeps a user-started countdown running for a few minutes while the phone
   > is locked or another app is open, shows the remaining time in an ongoing
   > notification, and alerts the user at the exact second the rest ends.
   > It runs only during an active workout and stops itself at zero or when the
   > user skips the rest.

   The manifest carries the same purpose as `workout rest-timer countdown`; keep
   the wording consistent.
6. Upload a **screen recording** (they ask for a video URL; an unlisted YouTube
   link works). Record on the emulator or a phone: start a rest → show the
   countdown notification → lock the phone → the alert fires. 30–60 seconds
   is enough. Emulator recording: `adb shell screenrecord /sdcard/rest.mp4`,
   stop with Ctrl+C, then `adb pull /sdcard/rest.mp4`.
7. Save. This is done once per app, not per release.

## Step 4 — open the pull request and merge

Bump the app version so the new native code gets its own runtime. In
`apps/mobile/app.json`, raise `version` by one patch number. `1.0.7` is the
notifications release (spec 0013 steps 1–2), so this one is `1.0.8`; check
`main` again in case it moved further. Commit it on this branch.

Push and open a PR from `feat/mobile/rest-timer-android-service` to `main`:

```bash
git push -u origin feat/mobile/rest-timer-android-service
```

Then in the browser:
`https://github.com/Cekov1991/fitnation/compare/main...feat/mobile/rest-timer-android-service?expand=1`

Suggested PR description:

> Spec 0013 step 3: Android foreground service for the rest timer. Ongoing
> notification with an OS-rendered countdown while resting; "Rest over"
> alert posted by the service at the exact second; partial wake lock for the
> rest so the countdown survives the phone sleeping. Requires a new native
> build and the Play Console `specialUse` declaration (done on <date>).
> Tested on emulator API 35 and on <phone model>.

Merge after review. Nothing here can be shipped over the air; it needs the
build in step 5.

## Step 5 — build and release

Follow `apps/mobile/RELEASING.md`. In short, from `apps/mobile` on `main`
after the merge:

```bash
eas build --platform android --profile production
eas submit --platform android --profile internal --latest
```

Install the internal-testing build on the test phone from the Play Store link.
Do step 6 on it. Then:

```bash
eas submit --platform android --profile production --latest
```

Do the iOS build in the same release as usual so both stores are on the same
version number. iOS has no functional change from this branch.

## Step 6 — test on a real Samsung or Xiaomi (why this matters)

Emulators do not kill background apps. Samsung and Xiaomi do, aggressively,
and that is the whole reason this service exists. On the test phone, with the
internal-testing build:

1. Settings → Apps → Fit Nation → Battery: leave it on the default
   ("Optimized" / "Battery saver" allowed). Do not whitelist the app; we are
   testing the normal case.
2. Start a workout, start a **3-minute** rest (tap +15s until it reads 3:00).
3. Lock the phone. Put it down. Do not touch it.
4. At 3:00 the phone must sound and show "Rest over". Up to two seconds late is
   fine. If it is late by more than that, or silent, note the phone model and
   Android version and report it.
5. Repeat once with the app sent to the background (Home button) instead of
   locked.

## After release — what to watch

- Play Console → **Quality → Android vitals → Crashes and ANRs**. Anything
  mentioning `RestTimerService`, `ForegroundServiceStartNotAllowedException` or
  `RemoteServiceException` is ours.
- If Google ever asks for the foreground-service justification again (it can
  happen on a policy change), the text in step 3 is the answer.

## Things to know

- **Do not remove** `android.permission.WAKE_LOCK` from the plugin. Without it
  the countdown stops when the phone sleeps and the alert arrives late.
- The service cancels its own alert if the app is on screen at zero (the app
  vibrates instead). That is intended.
- If the OS refuses to start the service (rare, Android 12+ from the
  background), JavaScript schedules a normal notification instead. You will
  see `[rest-timer]` warnings in Metro when that happens.
- An app build that predates this branch has no `RestTimer` module; the code
  detects that and uses the normal notification. So an over-the-air JS update
  to old builds is safe.
- The service writes plain `rest-timer` log lines (`armed`, `rest over`,
  `alert posted`, `stop requested`, `destroyed`). They are cheap; leave them in.

## If something goes wrong

| Symptom | Cause | Fix |
|---|---|---|
| Android Studio shows "A problem occurred starting process 'command node'" | Android Studio was opened from the Dock and does not see your Node install | You do not need Android Studio to build. Use `npx expo run:android`. If you want Studio's sync, start it from a terminal: `open -a "Android Studio"`. |
| Gradle: "Project with path ':expo-notifications' could not be found" | Someone re-added a dependency on that project | The module must depend only on `androidx.core`; check `modules/rest-timer/android/build.gradle`. |
| Emulator wakes straight into the app when unlocked, no lock screen | Emulator has no screen lock | `adb shell locksettings set-disabled false` |
| Play upload rejected mentioning foreground service | Step 3 not done, or done after the build was uploaded | Complete step 3, then upload again. No rebuild needed. |
| "Cannot find native module 'RestTimer'" | Old build on the device | `npx expo run:android` again, or install the new EAS build. |
