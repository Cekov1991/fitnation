# Dev Environment Setup

This guide covers setting up local development builds for iOS and Android.
The app uses a custom Expo dev build (not Expo Go), which enables native modules
like `react-native-pager-view`, `expo-video`, and others.

---

## Prerequisites (both platforms)

- macOS with Homebrew installed
- Node.js 18+
- pnpm (`npm install -g pnpm`)
- Xcode installed from the Mac App Store

---

## iOS Setup

### 1. Point Xcode CLI tools at Xcode.app

By default macOS points the CLI tools at a lightweight Command Line Tools
package. Redirect it to the full Xcode.app:

```bash
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
```

Accept the Xcode license (one-time):

```bash
sudo xcodebuild -license accept
```

Verify:

```bash
xcodebuild -version
# Xcode 16.x  Build version 16Xxx
```

### 2. Install iOS Simulator runtimes

Check if simulators are available:

```bash
xcrun simctl list devices available | grep iPhone
```

If the list is empty, open **Xcode → Settings → Platforms** and download
an iOS 17 or iOS 18 simulator runtime.

### 3. Install CocoaPods

```bash
brew install cocoapods
```

Verify:

```bash
pod --version
# 1.16.x
```

### 4. First build (iOS Simulator)

```bash
cd apps/mobile
npx expo run:ios
```

The first build takes 10–15 minutes. It will:
- Generate the `ios/` native project via prebuild
- Run `pod install` to link native deps
- Compile the native app
- Launch the iOS Simulator and open the app
- Start Metro bundler

### 5. Subsequent dev sessions (fast)

Once the native app is installed on the simulator, you only need to start Metro:

```bash
cd apps/mobile
npx expo start --dev-client
```

Press `i` in the Metro terminal to open on the iOS simulator.
JS changes hot-reload instantly — no rebuild needed.

---

## iOS — Physical Device (USB)

### 1. Sign the app with your Apple ID

After prebuild has run (step 4 above), open the project in Xcode:

```bash
open apps/mobile/ios/FitNation.xcworkspace
```

In Xcode:
- Select the project in the left sidebar
- Go to **Signing & Capabilities**
- Check **"Automatically manage signing"**
- Set **Team** to your Apple ID (free account works)

> **Note:** With a free Apple Developer account, the signing certificate expires
> every 7 days. Re-run `npx expo run:ios --device` weekly to re-sign.
> A paid $99/year account extends this to 1 year.

### 2. Connect the device

Plug in your iPhone via USB. Tap **"Trust"** on the phone if prompted.

### 3. Run on device

```bash
npx expo run:ios --device
```

Expo will list connected devices — pick your iPhone.

### 4. Subsequent sessions (wireless)

After the first install, unplug the cable. As long as your iPhone and Mac
are on the same WiFi network, Metro connects wirelessly:

```bash
npx expo start --dev-client
```

---

## Android Setup

### 1. Install Android Studio

Download from [developer.android.com/studio](https://developer.android.com/studio)
and install as a standard Mac app (drag to `/Applications`).

Android Studio bundles the Android SDK, emulator, and build tools.

### 2. Create a Virtual Device (emulator)

1. Open Android Studio
2. Click **More Actions → Virtual Device Manager** (or **Tools → Device Manager**)
3. Click **Create device**
4. Select **Pixel 9** (or any modern Pixel)
5. Select system image **API 35 (Android 15)** — download if needed
6. Click **Finish**

### 3. Set Android environment variables

Add to `~/.zshrc`:

```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

Reload and verify:

```bash
source ~/.zshrc
adb --version
# Android Debug Bridge version 1.x.x
```

### 4. Install JDK 17

> **Important:** Android Studio ships with JDK 21, which has a TLS bug that
> breaks Gradle's ability to download dependencies from Maven Central.
> JDK 17 must be used instead.

```bash
brew install --cask zulu@17
```

Add to `~/.zshrc`:

```bash
export JAVA_HOME=/Library/Java/JavaVirtualMachines/zulu-17.jdk/Contents/Home
```

Reload and verify:

```bash
source ~/.zshrc
java -version
# openjdk version "17.x.x"
```

### 5. First build (Android Emulator)

Start the Pixel 9 emulator from Android Studio and **wait for it to fully boot**
(Android home screen visible). Then:

```bash
adb devices
# Should show: emulator-5554   device  (not "offline")
```

Once it shows `device`:

```bash
cd apps/mobile
npx expo run:android
```

The first build takes 10–15 minutes. Subsequent builds are incremental (a few seconds).

### 6. Subsequent dev sessions (fast)

```bash
cd apps/mobile
npx expo start --dev-client
```

Press `a` in the Metro terminal to open on the Android emulator.

---

## Android — Physical Device (USB)

### 1. Enable Developer Mode on your Android phone

1. **Settings → About phone**
2. Tap **Build number** 7 times rapidly
3. Go back to **Settings → Developer options**
4. Enable **USB debugging**

### 2. Connect via USB

Plug in your phone. When prompted on the phone:
> "Allow USB debugging from this computer?"

Tap **"Always allow from this computer"** → **OK**.

Also check the USB notification in the notification shade — set the connection
mode to **File transfer (MTP)**, not "Charging only".

### 3. Verify the device is detected

```bash
adb devices
# R5CW30XXXXX    device
```

If it shows `unauthorized`, unplug and replug — the prompt may have reappeared.

### 4. Run on device

```bash
npx expo run:android --device
```

Expo will list connected devices — pick your phone.

> **If you get `INSTALL_FAILED_VERSION_DOWNGRADE`:** A newer version of the app
> is already installed on the device. Uninstall it first:
> ```bash
> adb uninstall com.fitnation.app
> ```
> Then run again.

### 5. Subsequent sessions (wireless)

After the first install, unplug the cable. On the same WiFi network:

```bash
npx expo start --dev-client
```

---

## Quick Reference

| Task | Command |
|---|---|
| First iOS build (simulator) | `npx expo run:ios` |
| First iOS build (device) | `npx expo run:ios --device` |
| First Android build (emulator) | `npx expo run:android` |
| First Android build (device) | `npx expo run:android --device` |
| Start Metro only (after first build) | `npx expo start --dev-client` |
| Check connected Android devices | `adb devices` |
| Uninstall Android app | `adb uninstall com.fitnation.app` |

## When do you need to rebuild?

You only need to run `expo run:ios` or `expo run:android` again when:
- Adding a new native module (then also run `pod install` for iOS)
- Changing `app.json` fields that affect native config (permissions, bundle ID, plugins)
- Upgrading the Expo SDK

All JS/TypeScript changes hot-reload through Metro without a rebuild.
