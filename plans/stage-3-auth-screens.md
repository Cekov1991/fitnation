# Stage 3 — Auth Screens

## Overview
Build all authentication screens: Login, Register, Forgot Password, and Reset Password. Wire them to the real API via the shared `useApi` hooks and React Hook Form + Zod. On successful login the app navigates to the main app. Mirrors the web app auth flow exactly.

## Design Parity
Before building each screen, read the corresponding web component and match the design exactly.

| Mobile Screen | Read This Web File |
|---|---|
| `LoginScreen` | `apps/web/src/components/LoginPage.tsx` |
| `RegisterScreen` | `apps/web/src/components/RegisterPage.tsx` |
| `ForgotPasswordScreen` | `apps/web/src/components/ForgotPasswordPage.tsx` |
| `ResetPasswordScreen` | `apps/web/src/components/ResetPasswordPage.tsx` |

Match exactly: logo/title treatment, form field styling, error message styling, link styles, button design, background, spacing. Translate CSS variables to `colors.X`.

---

## Prerequisites
- Stage 0, 1, 2 complete
- Backend running and accessible from device/simulator

## Screens Built This Stage
- `LoginScreen` — email + password, submit → navigate to app
- `RegisterScreen` — invitation token validation, name/email/password
- `ForgotPasswordScreen` — email input, send reset link
- `ResetPasswordScreen` — new password + confirmation

---

## Step 1 — Create Shared UI Components

These components will be reused across all auth screens and later across the whole app.

### `apps/mobile/src/components/ui/Input.tsx`
```tsx
import { TextInput, View, Text, type TextInputProps } from 'react-native'
import { useTheme } from '../../context/ThemeContext'

interface InputProps extends TextInputProps {
  label?: string
  error?: string
}

export function Input({ label, error, ...props }: InputProps) {
  const { colors } = useTheme()
  return (
    <View className="mb-4">
      {label && (
        <Text className="text-sm font-medium mb-1" style={{ color: colors.textSecondary }}>
          {label}
        </Text>
      )}
      <TextInput
        className="w-full px-4 py-3 rounded-xl text-base"
        style={{
          backgroundColor: colors.bgElevated,
          color: colors.textPrimary,
          borderWidth: 1,
          borderColor: error ? colors.error : 'transparent',
        }}
        placeholderTextColor={colors.textMuted}
        {...props}
      />
      {error && (
        <Text className="text-xs mt-1" style={{ color: colors.error }}>
          {error}
        </Text>
      )}
    </View>
  )
}
```

### `apps/mobile/src/components/ui/Button.tsx`
```tsx
import { TouchableOpacity, Text, ActivityIndicator, type TouchableOpacityProps } from 'react-native'
import { useTheme } from '../../context/ThemeContext'

interface ButtonProps extends TouchableOpacityProps {
  label: string
  loading?: boolean
  variant?: 'primary' | 'ghost'
}

export function Button({ label, loading, variant = 'primary', ...props }: ButtonProps) {
  const { colors } = useTheme()
  const isPrimary = variant === 'primary'

  return (
    <TouchableOpacity
      className="w-full py-4 rounded-xl items-center justify-center"
      style={{
        backgroundColor: isPrimary ? colors.primary : 'transparent',
        opacity: props.disabled ? 0.6 : 1,
      }}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text className="text-base font-semibold" style={{ color: isPrimary ? '#fff' : colors.textSecondary }}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  )
}
```

---

## Step 2 — Build Login Screen

Replace `apps/mobile/src/screens/placeholders/LoginScreen.tsx` with the real screen:

```tsx
import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from 'react-native'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, type LoginInput } from '@fit-nation/shared'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import type { AuthScreenProps } from '../../navigation/types'
import { useState } from 'react'

export function LoginScreen({ navigation }: AuthScreenProps<'Login'>) {
  const { login } = useAuth()
  const { colors } = useTheme()
  const [error, setError] = useState<string | null>(null)

  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(data: LoginInput) {
    try {
      setError(null)
      await login(data.email, data.password)
      // RootNavigator automatically switches to AppNavigator on user state change
    } catch (e: any) {
      setError(e?.message || 'Invalid credentials')
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ backgroundColor: colors.bgBase }}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 24, justifyContent: 'center', flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo / Title */}
        <Text className="text-3xl font-bold mb-2" style={{ color: colors.textPrimary }}>
          Welcome back
        </Text>
        <Text className="text-base mb-8" style={{ color: colors.textSecondary }}>
          Sign in to continue
        </Text>

        {/* Error */}
        {error && (
          <View className="mb-4 p-3 rounded-xl" style={{ backgroundColor: `${colors.error}20` }}>
            <Text style={{ color: colors.error }}>{error}</Text>
          </View>
        )}

        {/* Form */}
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Email"
              value={value}
              onChangeText={onChange}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              error={errors.email?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, value } }) => (
            <Input
              label="Password"
              value={value}
              onChangeText={onChange}
              secureTextEntry
              autoComplete="password"
              error={errors.password?.message}
            />
          )}
        />

        {/* Forgot password */}
        <Text
          className="text-sm mb-6 text-right"
          style={{ color: colors.primary }}
          onPress={() => navigation.navigate('ForgotPassword')}
        >
          Forgot password?
        </Text>

        <Button
          label="Sign In"
          loading={isSubmitting}
          onPress={handleSubmit(onSubmit)}
        />

        {/* Register link */}
        <View className="flex-row justify-center mt-6">
          <Text style={{ color: colors.textSecondary }}>Don't have an account? </Text>
          <Text
            style={{ color: colors.primary }}
            onPress={() => navigation.navigate('Register', {})}
          >
            Register
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
```

---

## Step 3 — Build Register Screen

Key differences from web:
- Validates invitation token via `useValidateInvitation` query
- Collects: invitation token, name, email, password, password confirmation

```tsx
import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from 'react-native'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { registerSchema, type RegisterInput, api } from '@fit-nation/shared'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import type { AuthScreenProps } from '../../navigation/types'
import { useState } from 'react'

export function RegisterScreen({ navigation, route }: AuthScreenProps<'Register'>) {
  const { setUser } = useAuth()
  const { colors } = useTheme()
  const [error, setError] = useState<string | null>(null)

  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      invitation_token: route.params?.invitationToken || '',
    }
  })

  async function onSubmit(data: RegisterInput) {
    try {
      setError(null)
      const response = await api.register(data)
      // Store token and update user — AuthContext will handle navigation
      import * as SecureStore from 'expo-secure-store'
      await SecureStore.setItemAsync('authToken', response.token)
      setUser(response.user)
    } catch (e: any) {
      setError(e?.message || 'Registration failed')
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ backgroundColor: colors.bgBase }}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 24, flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-3xl font-bold mb-2 mt-12" style={{ color: colors.textPrimary }}>
          Create account
        </Text>
        <Text className="text-base mb-8" style={{ color: colors.textSecondary }}>
          Enter your invitation token to get started
        </Text>

        {error && (
          <View className="mb-4 p-3 rounded-xl" style={{ backgroundColor: `${colors.error}20` }}>
            <Text style={{ color: colors.error }}>{error}</Text>
          </View>
        )}

        <Controller control={control} name="invitation_token"
          render={({ field: { onChange, value } }) => (
            <Input label="Invitation Token" value={value} onChangeText={onChange}
              autoCapitalize="none" error={errors.invitation_token?.message} />
          )}
        />
        <Controller control={control} name="name"
          render={({ field: { onChange, value } }) => (
            <Input label="Full Name" value={value} onChangeText={onChange}
              autoComplete="name" error={errors.name?.message} />
          )}
        />
        <Controller control={control} name="email"
          render={({ field: { onChange, value } }) => (
            <Input label="Email" value={value} onChangeText={onChange}
              keyboardType="email-address" autoCapitalize="none"
              autoComplete="email" error={errors.email?.message} />
          )}
        />
        <Controller control={control} name="password"
          render={({ field: { onChange, value } }) => (
            <Input label="Password" value={value} onChangeText={onChange}
              secureTextEntry error={errors.password?.message} />
          )}
        />
        <Controller control={control} name="password_confirmation"
          render={({ field: { onChange, value } }) => (
            <Input label="Confirm Password" value={value} onChangeText={onChange}
              secureTextEntry error={errors.password_confirmation?.message} />
          )}
        />

        <Button label="Create Account" loading={isSubmitting} onPress={handleSubmit(onSubmit)} />

        <View className="flex-row justify-center mt-6">
          <Text style={{ color: colors.textSecondary }}>Already have an account? </Text>
          <Text style={{ color: colors.primary }} onPress={() => navigation.navigate('Login')}>
            Sign in
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
```

---

## Step 4 — Build Forgot Password Screen

Simple: email input + submit. Shows confirmation message on success.

```tsx
// Key logic only — build full screen matching Login pattern
async function onSubmit(data: { email: string }) {
  await api.forgotPassword(data.email)
  setSuccess(true) // Show "Check your email" message
}
```

---

## Step 5 — Build Reset Password Screen

```tsx
// Key logic only — build full screen matching Login pattern  
// Route params: token (from deep link or navigation)
async function onSubmit(data: { password: string; password_confirmation: string }) {
  await api.resetPassword({ token: route.params?.token, ...data })
  navigation.navigate('Login')
}
```

---

## Step 6 — Update ThemeContext to Load Partner Colors

After a successful login, fetch the partner's visual identity and update the ThemeContext:

In `AuthContext.tsx`, after loading the user:
```ts
// After getting currentUser, load partner colors
if (currentUser?.partner?.visual_identity) {
  const identity = currentUser.partner.visual_identity
  setColors({
    primary: identity.primary_color,
    secondary: identity.secondary_color,
    // ... map other identity fields to AppColors
  })
}
```

This requires passing `setColors` from ThemeContext into AuthContext — do this via a separate hook call or pass as a prop.

---

## Step 7 — Verify

```bash
pnpm dev:mobile
```

- [ ] Login screen renders correctly
- [ ] Form validation shows inline errors on bad input
- [ ] Successful login navigates to the app (Dashboard placeholder)
- [ ] Wrong credentials shows error message
- [ ] Forgot password screen reachable from Login
- [ ] Back navigation works on all auth screens

---

## Step 8 — Commit

```bash
git add -A
git commit -m "feat(mobile): auth screens — login, register, forgot/reset password"
```

---

## Verification Checklist
- [ ] `LoginScreen` — form validates, submits, navigates to app on success
- [ ] `RegisterScreen` — invitation token field, all fields validate
- [ ] `ForgotPasswordScreen` — success state shown after submit
- [ ] `ResetPasswordScreen` — password confirmation validates
- [ ] Error messages display from API responses
- [ ] KeyboardAvoidingView works on both iOS and Android
- [ ] Partner colors applied after login
- [ ] No TypeScript errors
