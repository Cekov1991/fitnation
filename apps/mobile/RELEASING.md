# Releasing the Fit Nation mobile app

A plain-English guide to building and shipping the app to the Google Play Store.
If you're new to this, read top to bottom once — after that you'll only need the
**Cheat sheet** at the bottom.

---

## The mental model (read this first)

There are **two separate steps** to ship an update. They are not the same thing:

1. **Build** — turns the code into an installable app file (`.aab` for Android).
   This runs on Expo's (EAS) servers, not your laptop. Output lives on Expo.
2. **Submit** — takes a finished build and hands it to Google Play.
   This is what makes it available to people.

You always **build first, then submit** the build you just made.

### Where a submit can land: "tracks"

Google Play has several **tracks**. A track is just "who can see this version":

| Track          | Who gets it                          | Use it for                       |
| -------------- | ------------------------------------ | -------------------------------- |
| **internal**   | A small list of testers you invite   | Trying a build before real users |
| **production** | **All real users** on the Play Store | The actual public release        |

We've set up two ready-to-use submit profiles: **`internal`** and **`production`**.
You pick where a build goes by choosing the profile name — nothing else to remember.

---

## Prerequisites (one-time, already done)

- ✅ `play-service-account.json` exists in this folder (`apps/mobile/`). This is the
  secret key that lets the command log into Google Play. It is **gitignored** — never
  commit it, never share it. If it's ever lost, regenerate it (see "If the key is lost").
- ✅ The service account `expo-eas-submission@…` has release permission in Play Console.
- ✅ You're logged into EAS (`eas whoami` should print `fitnation`).

If `eas` isn't found, install it: `npm install -g eas-cli`.

---

## Day-to-day: how to ship an update

Run these from inside `apps/mobile/`.

### Step 1 — Build the new version (once per code change)

```bash
eas build --platform android --profile production
```

- This uploads the code to Expo, builds it, and auto-increments the version number
  (you don't manage version numbers by hand — `autoIncrement` does it).
- Takes ~10–20 min. You'll get a build when it finishes. You only build **once**;
  the same build can then be sent to internal **and** later to production.

### Step 2 — Submit that build to a track

**To send it to testers first (recommended):**

```bash
eas submit --platform android --profile internal --latest
```

`--latest` just means "use the most recent finished build" so you don't get asked which one.

Then install it from the Play Store **Internal testing** link, check it works, and when
you're happy:

**To send it to all real users:**

```bash
eas submit --platform android --profile production --latest
```

After a production submit, Google **reviews** it (a few hours up to ~a day). When approved,
it goes live and users get it as an update automatically.

---

## How to choose: internal vs production

- **Just want to ship to everyone?** Use `--profile production`. (Valid — testing is
  optional, not required for updates.)
- **Want to sanity-check on a real phone first?** Use `--profile internal`, test it,
  then run the production submit. Same build, no rebuild needed.

---

## Watching status

- Expo: each submit prints a link like
  `https://expo.dev/accounts/fitnation/projects/fit-nation/submissions/…`
- Play Console: **Test and release → Production** (or **Testing → Internal testing**)
  → **Releases**. "In review" → "Available on Google Play" means it's live.

---

## iOS (for reference)

iOS has no "tracks" like Android — a submit always goes to **TestFlight**, then you
promote to the App Store from App Store Connect. Submit with:

```bash
eas submit --platform ios --profile production --latest
```

(Requires the Apple credentials already configured in `eas.json`.)

---

## If the service account key is lost

1. Google Cloud Console → project `smooth-maxim-497119-b4` → **IAM & Admin → Service
   Accounts** → `expo-eas-submission@…` → **Keys → Add key → JSON**.
2. Save it as `apps/mobile/play-service-account.json` (exact name).
3. Make sure the **Google Play Android Developer API** is enabled on that project.

---

## Cheat sheet

```bash
# 1. Build (once per code change)
eas build --platform android --profile production

# 2a. Send to testers (Internal testing)
eas submit --platform android --profile internal --latest

# 2b. Send to all users (Production)
eas submit --platform android --profile production --latest
```
