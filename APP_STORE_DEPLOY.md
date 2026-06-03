# App Store Deployment Guide

## Every time you want to release a new version

### 1. Bump the version

In `apps/mobile/app.json`, increment `version` higher than the last approved version:
```json
"version": "1.0.2"
```

### 2. Build for production

```bash
cd apps/mobile
eas build --platform ios --profile production
```

Wait for the build to finish. EAS will auto-increment the `buildNumber`.

### 3. Submit the build to App Store Connect

```bash
eas submit --platform ios
```

Select the build you just created when prompted.  
Wait ~5-10 minutes for Apple to process it.

### 4. Create the new version in App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com) → your app → **App Store** tab
2. Click **"+"** next to "iOS App" in the left sidebar
3. Enter the version number (must match `app.json`, e.g. `1.0.2`)

### 5. Attach the build

1. Scroll down to the **Build** section
2. Click **"+"** and select your new build (e.g. `1.0.2 (7)`)
3. If it doesn't appear yet, wait a few more minutes and refresh

### 6. Fill in release notes

In the **"What's New in This Version"** field, describe what changed.

### 7. Submit for review

1. Click **Save**
2. Click **"Add for Review"**
3. Click **"Submit to App Review"**

Apple review typically takes **24-48 hours**. You'll get an email when approved.

---

## Common errors

| Error | Fix |
|---|---|
| ITMS-90062: version not higher than approved | Bump `version` in `app.json` |
| ITMS-90186: train closed | Same — version must be incremented |
| Build not showing in App Store Connect | Wait 5-10 min after `eas submit`, then refresh |
