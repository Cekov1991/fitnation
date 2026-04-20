# Stage 9 — Polish & Production

## Overview
Final stage before app store submission. Covers animation polish, loading states, error handling, app configuration, EAS build setup, app store assets, and TestFlight deployment. The app should feel native, handle edge cases gracefully, and be ready for real users.

## Prerequisites
- Stages 0–8 complete
- All screens functional with real data
- EAS account created at expo.dev

---

## Part A — Polish

### Step A1 — Keep Screen Awake During Sessions

The screen must not sleep during an active workout session.

```bash
cd apps/mobile && pnpm add expo-keep-awake
```

In `WorkoutSessionScreen.tsx`:
```tsx
import { useKeepAwake } from 'expo-keep-awake'

export function WorkoutSessionScreen() {
  useKeepAwake() // Prevents screen from sleeping during workout
  // ...
}
```

---

### Step A2 — Add Haptic Feedback

Add tactile feedback for key interactions: logging a set, completing a workout, buttons.

```bash
cd apps/mobile && pnpm add expo-haptics
```

Usage:
```tsx
import * as Haptics from 'expo-haptics'

// When logging a set successfully:
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)

// When completing a workout:
Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)

// On button presses:
Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
```

---

### Step A3 — Screen Transition Animations

Add smooth transitions between screens using React Navigation's built-in animation options.

In `AppNavigator.tsx`, add custom transitions for key screens:
```tsx
// Workout session — slides up from bottom
<Stack.Screen
  name="WorkoutSession"
  component={WorkoutSessionScreen}
  options={{
    presentation: 'fullScreenModal',
    animation: 'slide_from_bottom',
  }}
/>

// Exercise detail — standard iOS slide
<Stack.Screen
  name="ExerciseDetail"
  options={{ animation: 'slide_from_right' }}
/>
```

---

### Step A4 — Improve Loading States

Audit every screen for missing skeletons. Every screen that fetches data should show skeletons, not blank white space.

Checklist:
- [ ] Dashboard — skeleton for plan card and plan list
- [ ] Progress — skeleton for all metric cards
- [ ] Plans — skeleton for plan list
- [ ] Exercise Catalog — skeleton rows while exercises load
- [ ] Exercise Detail — skeleton for video area while loading
- [ ] Program Library — skeleton grid
- [ ] Session Detail — skeleton for exercise list

---

### Step A5 — Error States

Add error boundaries and error UI for failed API calls.

Create `apps/mobile/src/components/ui/ErrorState.tsx`:
```tsx
import { View, Text, TouchableOpacity } from 'react-native'
import { AlertCircle } from 'lucide-react-native'
import { useTheme } from '../../context/ThemeContext'

interface ErrorStateProps {
  message?: string
  onRetry?: () => void
}

export function ErrorState({ message = 'Something went wrong', onRetry }: ErrorStateProps) {
  const { colors } = useTheme()
  return (
    <View className="flex-1 items-center justify-center px-8">
      <AlertCircle size={48} color={colors.error} />
      <Text className="text-base font-semibold mt-4 text-center" style={{ color: colors.textPrimary }}>
        {message}
      </Text>
      {onRetry && (
        <TouchableOpacity
          onPress={onRetry}
          className="mt-6 px-6 py-3 rounded-xl"
          style={{ backgroundColor: colors.primary }}
        >
          <Text className="text-white font-semibold">Try Again</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}
```

Pattern for every screen that fetches:
```tsx
if (isError) return <ErrorState onRetry={refetch} />
```

---

### Step A6 — Empty States

Add empty state illustrations/messages for screens with no data.

Create `apps/mobile/src/components/ui/EmptyState.tsx`:
```tsx
interface EmptyStateProps {
  title: string
  description: string
  action?: { label: string; onPress: () => void }
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  // Centered message + optional action button
}
```

Apply to:
- Plans screen — "No plans yet. Create your first plan."
- Exercise history — "No sessions yet. Start your first workout."
- Program library — "No programs available."
- Dashboard — "No active plan. Create or browse a plan."

---

### Step A7 — Offline Banner

Show a banner when the device has no internet connection.

```bash
cd apps/mobile && pnpm add @react-native-community/netinfo
```

Create `apps/mobile/src/components/ui/OfflineBanner.tsx`:
```tsx
import NetInfo from '@react-native-community/netinfo'
import { useNetInfo } from '@react-native-community/netinfo'
import { View, Text } from 'react-native'
import Animated, { SlideInUp, SlideOutUp } from 'react-native-reanimated'

export function OfflineBanner() {
  const netInfo = useNetInfo()
  if (netInfo.isConnected !== false) return null

  return (
    <Animated.View entering={SlideInUp} exiting={SlideOutUp}
      className="bg-red-500 px-4 py-2">
      <Text className="text-white text-sm text-center font-medium">
        No internet connection
      </Text>
    </Animated.View>
  )
}
```

Add to `App.tsx` inside providers, above `RootNavigator`.

---

### Step A8 — Gesture-based Set Deletion

In the workout session set rows, allow swipe-left to delete a logged set.

```tsx
import Swipeable from 'react-native-gesture-handler/Swipeable'

// Wrap SetRow with Swipeable
// Right action: red delete button
// On delete: call useDeleteSetLog mutation
```

---

## Part B — App Configuration

### Step B1 — Configure `app.json`

Update `apps/mobile/app.json`:
```json
{
  "expo": {
    "name": "Fit Nation",
    "slug": "fit-nation",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "dark",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#0F0F0F"
    },
    "ios": {
      "supportsTablet": false,
      "bundleIdentifier": "com.fitnation.app",
      "infoPlist": {
        "NSCameraUsageDescription": "Used for profile photo",
        "NSPhotoLibraryUsageDescription": "Used for profile photo"
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#0F0F0F"
      },
      "package": "com.fitnation.app"
    },
    "plugins": [
      "expo-secure-store",
      "expo-video",
      [
        "expo-image",
        { "photosPermission": "Used for profile photos" }
      ]
    ]
  }
}
```

---

### Step B2 — App Icons & Splash Screen

Required assets (create or export from design tool):

| Asset | Size | Location |
|---|---|---|
| App icon | 1024×1024 PNG | `assets/icon.png` |
| Splash screen | 1284×2778 PNG | `assets/splash.png` |
| Adaptive icon (Android) | 1024×1024 PNG | `assets/adaptive-icon.png` |
| Favicon (web fallback) | 48×48 PNG | `assets/favicon.png` |

Use [appicon.co](https://appicon.co) to generate all icon sizes from the 1024×1024 source.

---

### Step B3 — Environment Variables

Create `apps/mobile/.env.production`:
```
EXPO_PUBLIC_API_URL=https://api.fitnation.app/api
```

Create `apps/mobile/.env.development`:
```
EXPO_PUBLIC_API_URL=http://localhost:8000/api
```

Update `app.json` to reference env vars:
```json
{
  "extra": {
    "apiUrl": "$EXPO_PUBLIC_API_URL"
  }
}
```

---

## Part C — EAS Build Setup

### Step C1 — Create EAS Account

1. Go to [expo.dev](https://expo.dev) and sign up
2. Create a new project named `fit-nation`

### Step C2 — Configure EAS

```bash
cd apps/mobile
eas init          # Links project to expo.dev
eas build:configure  # Creates eas.json
```

Review generated `eas.json`:
```json
{
  "cli": {
    "version": ">= 13.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {}
  }
}
```

---

### Step C3 — Build for TestFlight

```bash
# Build for iOS (TestFlight)
eas build --platform ios --profile production

# This will:
# 1. Prompt for Apple Developer account login
# 2. Create/use provisioning profiles and certificates automatically
# 3. Upload to EAS build servers
# 4. Return a download link when done (~15-20 minutes)
```

---

### Step C4 — Submit to TestFlight

```bash
eas submit --platform ios --latest
```

This uploads the most recent build to App Store Connect. Then:
1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Navigate to your app → TestFlight
3. Wait for build processing (~10 minutes)
4. Add yourself as a tester
5. Check your email for the TestFlight invite

---

### Step C5 — Build for Android (Optional)

```bash
eas build --platform android --profile production
```

Requires a Google Play Developer account ($25 one-time fee).

---

## Part D — Pre-Submission Checklist

### Functional Testing
- [ ] Full onboarding flow from fresh install
- [ ] Login / logout cycle
- [ ] Generate, preview, start, complete a workout
- [ ] All set log interactions (log, edit, delete)
- [ ] Plan creation and management
- [ ] Exercise catalog search and filtering
- [ ] Exercise detail video playback
- [ ] Performance chart renders
- [ ] Profile update and plan regeneration
- [ ] Partner branding applies on login

### Edge Cases
- [ ] No internet connection — offline banner shows
- [ ] API error — error states show with retry
- [ ] Empty states — all screens with no data show helpful message
- [ ] Very long exercise names don't overflow
- [ ] Large exercise lists scroll smoothly
- [ ] Keyboard doesn't overlap input fields

### Device Testing
- [ ] Tested on physical iPhone (latest iOS)
- [ ] Safe area respected (notch, home bar, dynamic island)
- [ ] Dark mode looks correct
- [ ] No text/layout overflow on small screens (iPhone SE)

### Performance
- [ ] No visible jank when scrolling exercise catalog
- [ ] Session screen swipe is smooth
- [ ] Chart renders without freezing
- [ ] App launches in under 3 seconds

---

## Step Final — Commit & Tag

```bash
git add -A
git commit -m "feat: polish, error states, haptics, production build config"
git tag v1.0.0
git push && git push --tags
```

---

## Verification Checklist
- [ ] `expo-keep-awake` active during sessions
- [ ] Haptic feedback on set log and workout completion
- [ ] All screens have loading skeletons
- [ ] All screens have error states with retry
- [ ] All screens have empty states
- [ ] Offline banner shows when disconnected
- [ ] `app.json` configured with correct bundle ID and name
- [ ] App icons and splash screen in place
- [ ] EAS build succeeds for iOS
- [ ] App appears in TestFlight
- [ ] Full workout flow tested on physical device
