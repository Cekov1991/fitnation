import { useState } from 'react'
import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Mail, AlertCircle, ArrowLeft } from 'lucide-react-native'
import { forgotPasswordSchema, type ForgotPasswordFormData, authApi } from '@fit-nation/shared'
import { useTheme } from '../../context/ThemeContext'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { AuthLogoHeader } from '../../components/ui/AuthLogoHeader'
import type { AuthScreenProps } from '../../navigation/types'

const SUCCESS_MESSAGE =
  "If an account exists for this email, we've sent a password reset link."

export function ForgotPasswordScreen({ navigation }: AuthScreenProps<'ForgotPassword'>) {
  const { colors } = useTheme()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  })

  async function onSubmit(data: ForgotPasswordFormData) {
    setError(null)
    setSuccess(false)
    try {
      await authApi.forgotPassword(data.email)
      setSuccess(true)
    } catch (e: unknown) {
      const err = e as { status?: number; errors?: { email?: string | string[] }; message?: string }
      // Only surface validation errors (422 with email errors); everything else shows generic success
      if (err?.status === 422 && err?.errors?.email) {
        const first = Array.isArray(err.errors.email) ? err.errors.email[0] : err.errors.email
        setError(first || err.message || 'Invalid email')
        return
      }
      // Avoid email enumeration — show success for all other errors
      setSuccess(true)
    }
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
            title="Forgot password?"
            subtitle="Enter your email and we'll send you a link to reset your password."
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
            {success ? (
              <View>
                <View
                  className="p-4 rounded-xl mb-6"
                  style={{
                    backgroundColor: `${colors.primary}18`,
                    borderWidth: 1,
                    borderColor: `${colors.primary}30`,
                  }}
                >
                  <Text className="text-sm" style={{ color: colors.textPrimary }}>
                    {SUCCESS_MESSAGE}
                  </Text>
                </View>
                <Button
                  label="Back to Sign In"
                  onPress={() => navigation.navigate('Login')}
                />
              </View>
            ) : (
              <View>
                {error && (
                  <View
                    className="flex-row items-center gap-3 p-4 rounded-xl mb-4"
                    style={{ backgroundColor: `${colors.error}18`, borderWidth: 1, borderColor: `${colors.error}30` }}
                  >
                    <AlertCircle color={colors.error} size={18} />
                    <Text className="text-sm flex-1" style={{ color: colors.error }}>{error}</Text>
                  </View>
                )}

                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, value } }) => (
                    <Input
                      label="Email address"
                      value={value}
                      onChangeText={onChange}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                      placeholder="you@example.com"
                      error={errors.email?.message}
                      leftIcon={<Mail color={colors.textMuted} size={20} />}
                    />
                  )}
                />

                <Button
                  label="Send reset link"
                  loading={isSubmitting}
                  onPress={handleSubmit(onSubmit)}
                />
              </View>
            )}
          </View>

          <View className="flex-row items-center justify-center gap-1 mt-6">
            <ArrowLeft color={colors.primary} size={16} />
            <Text
              className="text-sm font-semibold"
              style={{ color: colors.primary }}
              onPress={() => navigation.navigate('Login')}
            >
              Back to sign in
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
