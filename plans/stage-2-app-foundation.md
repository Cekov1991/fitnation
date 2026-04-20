# Stage 2 — App Foundation

## Overview
Build the structural skeleton of the mobile app: all React Navigation navigators, NativeWind verified working, ThemeContext for partner branding, and all top-level providers wired into `App.tsx`. Every screen is a placeholder at this stage — the goal is a working navigation shell where you can tap between all routes.

## Prerequisites
- Stage 0 and Stage 1 complete
- Expo Go running on iPhone

## Final File Structure (this stage)
```
apps/mobile/
├── src/
│   ├── navigation/
│   │   ├── RootNavigator.tsx       ← Auth vs App switch
│   │   ├── AuthNavigator.tsx       ← Login, Register, etc.
│   │   ├── AppNavigator.tsx        ← Tab + Stack for authenticated screens
│   │   ├── TabNavigator.tsx        ← Bottom tabs
│   │   └── types.ts                ← Navigation type definitions
│   ├── screens/
│   │   ├── placeholders/           ← Empty screens for every route
│   │   │   ├── DashboardScreen.tsx
│   │   │   ├── ProgressScreen.tsx
│   │   │   ├── PlansScreen.tsx
│   │   │   ├── ProfileScreen.tsx
│   │   │   ├── LoginScreen.tsx
│   │   │   ├── RegisterScreen.tsx
│   │   │   └── ... (all screens)
│   ├── context/
│   │   ├── ThemeContext.tsx         ← Partner branding colors
│   │   └── AuthContext.tsx          ← Auth state
│   └── constants/
│       └── theme.ts                ← Default color values
├── App.tsx                         ← All providers + RootNavigator
├── global.css
└── app.json
```

---

## Step 1 — Create Navigation Type Definitions

Create `apps/mobile/src/navigation/types.ts`:
```ts
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs'

// Auth stack
export type AuthStackParamList = {
  Login: undefined
  Register: { invitationToken?: string }
  ForgotPassword: undefined
  ResetPassword: { token?: string }
}

// Bottom tabs — order matches web app: Dashboard → Plans → Progress → Catalog → Profile
export type TabParamList = {
  Dashboard: undefined
  Plans: undefined
  Progress: undefined
  Catalog: undefined
  Profile: undefined
}

// Main app stack (full-screen screens, no bottom tabs)
export type AppStackParamList = {
  Tabs: undefined
  Onboarding: undefined
  WorkoutSession: { sessionId: string }
  WorkoutSessionExerciseDetail: { sessionId: string; exerciseName: string }
  GenerateWorkout: undefined
  WorkoutPreview: { sessionId: string }
  WorkoutPreviewExercisePicker: { sessionId: string }
  ExercisePicker: undefined
  ExerciseDetail: { exerciseName: string }
  CreatePlan: undefined
  EditPlan: { planId: number }
  CreateWorkout: undefined
  EditWorkout: { templateId: number }
  ManageExercises: { templateId: number }
  ProgramLibrary: undefined
  ProgramDetail: { programId: number }
  RoutineDetail: { routineId: number }
  RoutineWorkoutDetail: { routineId: number; workoutId: number }
  SessionDetail: { sessionId: string }
}

// Screen prop helpers
export type AuthScreenProps<T extends keyof AuthStackParamList> =
  NativeStackScreenProps<AuthStackParamList, T>

export type AppScreenProps<T extends keyof AppStackParamList> =
  NativeStackScreenProps<AppStackParamList, T>

export type TabScreenProps<T extends keyof TabParamList> =
  BottomTabScreenProps<TabParamList, T>
```

---

## Step 2 — Create Default Theme Constants

Create `apps/mobile/src/constants/theme.ts`:
```ts
export const defaultColors = {
  // Backgrounds
  bgBase: '#0F0F0F',
  bgSurface: '#1A1A1A',
  bgElevated: '#242424',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#A0A0A0',
  textMuted: '#606060',

  // Brand (Fit Nation defaults — overridden per partner)
  primary: '#3B82F6',
  secondary: '#8B5CF6',

  // Segment control
  segmentTrack: '#1A1A1A',
  segmentActive: '#2A2A2A',

  // Status
  success: '#22C55E',
  error: '#EF4444',
  warning: '#F59E0B',
}

export type AppColors = typeof defaultColors
```

---

## Step 3 — Create ThemeContext

Create `apps/mobile/src/context/ThemeContext.tsx`:
```tsx
import React, { createContext, useContext, useState } from 'react'
import { defaultColors, type AppColors } from '../constants/theme'

interface ThemeContextValue {
  colors: AppColors
  setColors: (colors: Partial<AppColors>) => void
}

const ThemeContext = createContext<ThemeContextValue>({
  colors: defaultColors,
  setColors: () => {},
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [colors, setColorsState] = useState<AppColors>(defaultColors)

  function setColors(partial: Partial<AppColors>) {
    setColorsState(prev => ({ ...prev, ...partial }))
  }

  return (
    <ThemeContext.Provider value={{ colors, setColors }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
```

---

## Step 4 — Create AuthContext

Create `apps/mobile/src/context/AuthContext.tsx`:
```tsx
import React, { createContext, useContext, useState, useEffect } from 'react'
import * as SecureStore from 'expo-secure-store'
import { initAuth, initApi, AUTH_TOKEN_KEY, api } from '@fit-nation/shared'
import type { UserResource } from '@fit-nation/shared'

// Wire up storage injection (called once at module load)
initAuth({
  storage: {
    getItem: (key) => SecureStore.getItemAsync(key),
    setItem: (key, value) => SecureStore.setItemAsync(key, value),
    removeItem: (key) => SecureStore.deleteItemAsync(key),
  }
})

interface AuthContextValue {
  user: UserResource | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  setUser: (user: UserResource | null) => void
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
  setUser: () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserResource | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadUser() {
      try {
        const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY)
        if (token) {
          const currentUser = await api.getCurrentUser()
          setUser(currentUser)
        }
      } catch {
        await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY)
      } finally {
        setIsLoading(false)
      }
    }
    loadUser()
  }, [])

  async function login(email: string, password: string) {
    const response = await api.login({ email, password })
    await SecureStore.setItemAsync(AUTH_TOKEN_KEY, response.token)
    setUser(response.user)
  }

  async function logout() {
    await api.logout()
    await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
```

---

## Step 5 — Create Placeholder Screens

Create a placeholder component to reuse for all screens:

Create `apps/mobile/src/screens/placeholders/Placeholder.tsx`:
```tsx
import { View, Text } from 'react-native'

export function Placeholder({ name }: { name: string }) {
  return (
    <View className="flex-1 items-center justify-center bg-[#0F0F0F]">
      <Text className="text-white text-xl font-bold">{name}</Text>
      <Text className="text-gray-400 text-sm mt-2">Coming soon</Text>
    </View>
  )
}
```

Create the following placeholder screens (each imports and returns `<Placeholder name="..." />`):
- `DashboardScreen.tsx`
- `ProgressScreen.tsx`
- `PlansScreen.tsx`
- `ProfileScreen.tsx`
- `LoginScreen.tsx`
- `RegisterScreen.tsx`
- `ForgotPasswordScreen.tsx`
- `ResetPasswordScreen.tsx`
- `OnboardingScreen.tsx`
- `WorkoutSessionScreen.tsx`
- `WorkoutSessionExerciseDetailScreen.tsx`
- `GenerateWorkoutScreen.tsx`
- `WorkoutPreviewScreen.tsx`
- `ExerciseCatalogScreen.tsx`
- `ExerciseDetailScreen.tsx`
- `ExercisePickerScreen.tsx`
- `CreatePlanScreen.tsx`
- `EditPlanScreen.tsx`
- `CreateWorkoutScreen.tsx`
- `EditWorkoutScreen.tsx`
- `ManageExercisesScreen.tsx`
- `ProgramLibraryScreen.tsx`
- `ProgramDetailScreen.tsx`
- `RoutineDetailScreen.tsx`
- `RoutineWorkoutDetailScreen.tsx`
- `SessionDetailScreen.tsx`

Example (`DashboardScreen.tsx`):
```tsx
import { Placeholder } from './Placeholder'
export function DashboardScreen() {
  return <Placeholder name="Dashboard" />
}
```

---

## Step 6 — Create Tab Navigator

Create `apps/mobile/src/navigation/TabNavigator.tsx`:
```tsx
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Home, Dumbbell, TrendingUp, Search, User } from 'lucide-react-native'
import { DashboardScreen } from '../screens/placeholders/DashboardScreen'
import { PlansScreen } from '../screens/placeholders/PlansScreen'
import { ProgressScreen } from '../screens/placeholders/ProgressScreen'
import { ExerciseCatalogScreen } from '../screens/placeholders/ExerciseCatalogScreen'
import { ProfileScreen } from '../screens/placeholders/ProfileScreen'
import type { TabParamList } from './types'

const Tab = createBottomTabNavigator<TabParamList>()

// Tab order matches web app: Dashboard → Plans → Progress → Catalog → Profile
export function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1A1A1A',
          borderTopColor: '#2A2A2A',
        },
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#606060',
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ tabBarIcon: ({ color }) => <Home color={color} size={22} /> }}
      />
      <Tab.Screen
        name="Plans"
        component={PlansScreen}
        options={{ tabBarIcon: ({ color }) => <Dumbbell color={color} size={22} /> }}
      />
      <Tab.Screen
        name="Progress"
        component={ProgressScreen}
        options={{ tabBarIcon: ({ color }) => <TrendingUp color={color} size={22} /> }}
      />
      <Tab.Screen
        name="Catalog"
        component={ExerciseCatalogScreen}
        options={{ tabBarLabel: 'Exercises', tabBarIcon: ({ color }) => <Search color={color} size={22} /> }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarIcon: ({ color }) => <User color={color} size={22} /> }}
      />
    </Tab.Navigator>
  )
}
```

---

## Step 7 — Create Auth Navigator

Create `apps/mobile/src/navigation/AuthNavigator.tsx`:
```tsx
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { LoginScreen } from '../screens/placeholders/LoginScreen'
import { RegisterScreen } from '../screens/placeholders/RegisterScreen'
import { ForgotPasswordScreen } from '../screens/placeholders/ForgotPasswordScreen'
import { ResetPasswordScreen } from '../screens/placeholders/ResetPasswordScreen'
import type { AuthStackParamList } from './types'

const Stack = createNativeStackNavigator<AuthStackParamList>()

export function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    </Stack.Navigator>
  )
}
```

---

## Step 8 — Create App Navigator

Create `apps/mobile/src/navigation/AppNavigator.tsx`:
```tsx
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { TabNavigator } from './TabNavigator'
import { OnboardingScreen } from '../screens/placeholders/OnboardingScreen'
import { WorkoutSessionScreen } from '../screens/placeholders/WorkoutSessionScreen'
import { WorkoutSessionExerciseDetailScreen } from '../screens/placeholders/WorkoutSessionExerciseDetailScreen'
import { GenerateWorkoutScreen } from '../screens/placeholders/GenerateWorkoutScreen'
import { WorkoutPreviewScreen } from '../screens/placeholders/WorkoutPreviewScreen'
import { ExerciseDetailScreen } from '../screens/placeholders/ExerciseDetailScreen'
import { ExercisePickerScreen } from '../screens/placeholders/ExercisePickerScreen'
import { CreatePlanScreen } from '../screens/placeholders/CreatePlanScreen'
import { EditPlanScreen } from '../screens/placeholders/EditPlanScreen'
import { CreateWorkoutScreen } from '../screens/placeholders/CreateWorkoutScreen'
import { EditWorkoutScreen } from '../screens/placeholders/EditWorkoutScreen'
import { ManageExercisesScreen } from '../screens/placeholders/ManageExercisesScreen'
import { ProgramLibraryScreen } from '../screens/placeholders/ProgramLibraryScreen'
import { ProgramDetailScreen } from '../screens/placeholders/ProgramDetailScreen'
import { RoutineDetailScreen } from '../screens/placeholders/RoutineDetailScreen'
import { RoutineWorkoutDetailScreen } from '../screens/placeholders/RoutineWorkoutDetailScreen'
import { SessionDetailScreen } from '../screens/placeholders/SessionDetailScreen'
import type { AppStackParamList } from './types'

const Stack = createNativeStackNavigator<AppStackParamList>()

export function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={TabNavigator} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen
        name="WorkoutSession"
        component={WorkoutSessionScreen}
        options={{ presentation: 'fullScreenModal' }}
      />
      <Stack.Screen
        name="WorkoutSessionExerciseDetail"
        component={WorkoutSessionExerciseDetailScreen}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen
        name="GenerateWorkout"
        component={GenerateWorkoutScreen}
        options={{ presentation: 'fullScreenModal' }}
      />
      <Stack.Screen name="WorkoutPreview" component={WorkoutPreviewScreen} />
      <Stack.Screen
        name="WorkoutPreviewExercisePicker"
        component={ExercisePickerScreen}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen
        name="ExercisePicker"
        component={ExercisePickerScreen}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen name="ExerciseDetail" component={ExerciseDetailScreen} />
      <Stack.Screen name="CreatePlan" component={CreatePlanScreen} />
      <Stack.Screen name="EditPlan" component={EditPlanScreen} />
      <Stack.Screen name="CreateWorkout" component={CreateWorkoutScreen} />
      <Stack.Screen name="EditWorkout" component={EditWorkoutScreen} />
      <Stack.Screen name="ManageExercises" component={ManageExercisesScreen} />
      <Stack.Screen name="ProgramLibrary" component={ProgramLibraryScreen} />
      <Stack.Screen name="ProgramDetail" component={ProgramDetailScreen} />
      <Stack.Screen name="RoutineDetail" component={RoutineDetailScreen} />
      <Stack.Screen name="RoutineWorkoutDetail" component={RoutineWorkoutDetailScreen} />
      <Stack.Screen name="SessionDetail" component={SessionDetailScreen} />
    </Stack.Navigator>
  )
}
```

---

## Step 9 — Create Root Navigator

Create `apps/mobile/src/navigation/RootNavigator.tsx`:
```tsx
import { NavigationContainer } from '@react-navigation/native'
import { View, ActivityIndicator } from 'react-native'
import { useAuth } from '../context/AuthContext'
import { AuthNavigator } from './AuthNavigator'
import { AppNavigator } from './AppNavigator'

export function RootNavigator() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#0F0F0F]">
        <ActivityIndicator color="#3B82F6" />
      </View>
    )
  }

  return (
    <NavigationContainer>
      {user ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  )
}
```

---

## Step 10 — Wire Up `App.tsx`

Replace `apps/mobile/App.tsx`:
```tsx
import './global.css'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { initApi } from '@fit-nation/shared'
import { ThemeProvider } from './src/context/ThemeContext'
import { AuthProvider } from './src/context/AuthContext'
import { RootNavigator } from './src/navigation/RootNavigator'

// Initialise API
initApi({
  baseUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api',
})

const queryClient = new QueryClient()

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <AuthProvider>
            <RootNavigator />
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  )
}
```

---

## Step 11 — Add Environment Variable

Create `apps/mobile/.env`:
```
EXPO_PUBLIC_API_URL=http://localhost:8000/api
```

Update `apps/mobile/app.json` to add the env var reference if needed.

---

## Step 12 — Verify

```bash
pnpm dev:mobile
```

- [ ] App loads on Expo Go without crashing
- [ ] Login placeholder screen shows (user not authenticated)
- [ ] TypeScript shows no errors
- [ ] NativeWind classes apply correctly (dark background visible)

---

## Step 13 — Commit

```bash
git add -A
git commit -m "feat(mobile): app foundation — navigation skeleton, ThemeContext, AuthContext, all placeholder screens"
```

---

## Verification Checklist
- [ ] All navigators created with correct TypeScript types
- [ ] Every route from the web app has a corresponding mobile screen (even if placeholder)
- [ ] `App.tsx` has all providers in correct nesting order
- [ ] ThemeContext provides default Fit Nation colors
- [ ] AuthContext loads user from SecureStore on startup
- [ ] RootNavigator switches between Auth and App based on user state
- [ ] NativeWind `className` works on at least one component
- [ ] No TypeScript errors
