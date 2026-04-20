import { useState, useEffect } from 'react'
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Lock, Eye, EyeOff, AlertCircle } from 'lucide-react-native'
import { resetPasswordSchema, type ResetPasswordFormData, authApi } from '@fit-nation/shared'
import { useTheme } from '../../context/ThemeContext'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { AuthLogoHeader } from '../../components/ui/AuthLogoHeader'
import type { AuthScreenProps } from '../../navigation/types'

export function ResetPasswordScreen({ navigation, route }: AuthScreenProps<'ResetPassword'>) {
  const { colors } = useTheme()
  const token = route.params?.token ?? ''
  const email = route.params?.email ?? ''

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isInvalidLink, setIsInvalidLink] = useState(false)

  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', password_confirmation: '' },
  })

  // Auto-redirect to Login 2s after success
  useEffect(() => {
    if (!success) return
    const t = setTimeout(() => navigation.replace('Login'), 2000)
    return () => clearTimeout(t)
  }, [success, navigation])

  async function onSubmit(data: ResetPasswordFormData) {
    setError(null)
    setIsInvalidLink(false)
    try {
      await authApi.resetPassword({
        token,
        email: decodeURIComponent(email),
        password: data.password,
        password_confirmation: data.password_confirmation,
      })
      setSuccess(true)
    } catch (e: unknown) {
      const err = e as { status?: number; errors?: { password?: string | string[]; password_confirmation?: string | string[] }; message?: string }
      const msg = err?.message || 'Something went wrong.'
      const isExpired =
        err?.status === 422 &&
        (msg.toLowerCase().includes('token') ||
          msg.toLowerCase().includes('invalid') ||
          msg.toLowerCase().includes('expired'))
      if (isExpired) {
        setError('This password reset link is invalid or has expired.')
        setIsInvalidLink(true)
      } else if (err?.errors?.password) {
        const first = Array.isArray(err.errors.password) ? err.errors.password[0] : err.errors.password
        setError(first)
      } else if (err?.errors?.password_confirmation) {
        const first = Array.isArray(err.errors.password_confirmation) ? err.errors.password_confirmation[0] : err.errors.password_confirmation
        setError(first)
      } else {
        setError(msg)
      }
    }
  }

  // Missing token or email — link is incomplete
  if (!token || !email) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center px-6" style={{ backgroundColor: colors.bgBase }}>
        <View
          style={{
            backgroundColor: colors.bgSurface,
            borderRadius: 24,
            padding: 24,
            borderWidth: 1,
            borderColor: colors.bgElevated,
            width: '100%',
            alignItems: 'center',
          }}
        >
          <AlertCircle color={colors.warning} size={48} style={{ marginBottom: 16 }} />
          <Text className="text-xl font-bold mb-2" style={{ color: colors.textPrimary }}>
            Missing reset link
          </Text>
          <Text className="text-sm text-center mb-6" style={{ color: colors.textSecondary }}>
            This page needs a valid reset link. If your link expired or didn't open correctly, request a new one.
          </Text>
          <Button
            label="Request a new link"
            onPress={() => navigation.navigate('ForgotPassword')}
          />
          <Button
            label="Back to sign in"
            variant="ghost"
            style={{ marginTop: 8 }}
            onPress={() => navigation.navigate('Login')}
          />
        </View>
      </SafeAreaView>
    )
  }

  // Success state
  if (success) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center px-6" style={{ backgroundColor: colors.bgBase }}>
        <View
          style={{
            backgroundColor: colors.bgSurface,
            borderRadius: 24,
            padding: 24,
            borderWidth: 1,
            borderColor: colors.bgElevated,
            width: '100%',
            alignItems: 'center',
          }}
        >
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: `${colors.primary}20`,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            <Lock color={colors.primary} size={32} />
          </View>
          <Text className="text-xl font-bold mb-2" style={{ color: colors.textPrimary }}>
            Password reset
          </Text>
          <Text className="text-sm text-center mb-6" style={{ color: colors.textSecondary }}>
            Your password has been reset. Redirecting you to sign in...
          </Text>
          <Text
            className="text-sm font-semibold"
            style={{ color: colors.primary }}
            onPress={() => navigation.replace('Login')}
          >
            Go to sign in now
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.bgBase }}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 24, justifyContent: 'center', flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <AuthLogoHeader
            title="New password"
            subtitle="Enter your new password below."
          />

          {/* Form card */}
          <View
            style={{
              backgroundColor: colors.bgSurface,
              borderRadius: 24,
              padding: 24,
              borderWidth: 1,
              borderColor: colors.bgElevated,
            }}
          >
            {error && (
              <View
                className="flex-row items-center gap-3 p-4 rounded-xl mb-4"
                style={{ backgroundColor: `${colors.error}18`, borderWidth: 1, borderColor: `${colors.error}30` }}
              >
                <AlertCircle color={colors.error} size={18} />
                <Text className="text-sm flex-1" style={{ color: colors.error }}>{error}</Text>
              </View>
            )}

            {isInvalidLink && (
              <Button
                label="Request a new link"
                variant="ghost"
                style={{ marginBottom: 16, borderWidth: 1, borderColor: colors.bgElevated }}
                onPress={() => navigation.navigate('ForgotPassword')}
              />
            )}

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="New password"
                  value={value}
                  onChangeText={onChange}
                  secureTextEntry={!showPassword}
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  error={errors.password?.message}
                  leftIcon={<Lock color={colors.textMuted} size={20} />}
                  rightElement={
                    <TouchableOpacity onPress={() => setShowPassword(v => !v)}>
                      {showPassword
                        ? <EyeOff color={colors.textMuted} size={20} />
                        : <Eye color={colors.textMuted} size={20} />
                      }
                    </TouchableOpacity>
                  }
                />
              )}
            />

            <Controller
              control={control}
              name="password_confirmation"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Confirm password"
                  value={value}
                  onChangeText={onChange}
                  secureTextEntry={!showConfirmPassword}
                  autoComplete="new-password"
                  placeholder="Confirm your password"
                  error={errors.password_confirmation?.message}
                  leftIcon={<Lock color={colors.textMuted} size={20} />}
                  rightElement={
                    <TouchableOpacity onPress={() => setShowConfirmPassword(v => !v)}>
                      {showConfirmPassword
                        ? <EyeOff color={colors.textMuted} size={20} />
                        : <Eye color={colors.textMuted} size={20} />
                      }
                    </TouchableOpacity>
                  }
                />
              )}
            />

            <Button
              label="Reset password"
              loading={isSubmitting}
              onPress={handleSubmit(onSubmit)}
            />

            <View className="items-center mt-6">
              <Text
                className="text-sm font-semibold"
                style={{ color: colors.primary }}
                onPress={() => navigation.navigate('ForgotPassword')}
              >
                Request a new link
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
