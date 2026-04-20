import { useState, useEffect } from 'react'
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as SecureStore from 'expo-secure-store'
import { User, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react-native'
import { registerSchema, type RegisterFormData, authApi, AUTH_TOKEN_KEY } from '@fit-nation/shared'
import type { InvitationResource } from '@fit-nation/shared'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { AuthLogoHeader } from '../../components/ui/AuthLogoHeader'
import type { AuthScreenProps } from '../../navigation/types'

export function RegisterScreen({ navigation, route }: AuthScreenProps<'Register'>) {
  const { setUser } = useAuth()
  const { colors } = useTheme()
  const invitationToken = route.params?.invitationToken

  const [error, setError] = useState<string | null>(null)
  const [invitation, setInvitation] = useState<InvitationResource | null>(null)
  const [validating, setValidating] = useState(true)
  const [invitationError, setInvitationError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const { control, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', password_confirmation: '' },
  })

  useEffect(() => {
    async function validateToken() {
      if (!invitationToken) {
        setInvitationError('No invitation token provided. Please use the invitation link from your email.')
        setValidating(false)
        return
      }
      try {
        const response = await authApi.validateInvitation(invitationToken)
        setInvitation(response.data)
        setValue('email', response.data.email)
        setValidating(false)
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Invalid or expired invitation token'
        setInvitationError(msg)
        setValidating(false)
      }
    }
    validateToken()
  }, [invitationToken, setValue])

  async function onSubmit(data: RegisterFormData) {
    if (!invitationToken) {
      setError('No invitation token found')
      return
    }
    try {
      setError(null)
      const response = await authApi.register({
        ...data,
        invitation_token: invitationToken,
      })
      await SecureStore.setItemAsync(AUTH_TOKEN_KEY, response.token)
      setUser(response.user)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Registration failed'
      setError(msg)
    }
  }

  // Loading state while validating
  if (validating) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 items-center justify-center" style={{ backgroundColor: colors.bgBase }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="text-sm mt-4" style={{ color: colors.textSecondary }}>
          Validating invitation...
        </Text>
      </SafeAreaView>
    )
  }

  // Invalid token state
  if (invitationError || !invitation) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 items-center justify-center px-6" style={{ backgroundColor: colors.bgBase }}>
        <View
          style={{
            backgroundColor: colors.bgSurface,
            borderRadius: 24,
            padding: 24,
            borderWidth: 1,
            borderColor: colors.bgElevated,
            width: '100%',
          }}
        >
          <View
            className="flex-row items-start gap-3 p-4 rounded-xl mb-6"
            style={{ backgroundColor: `${colors.error}18`, borderWidth: 1, borderColor: `${colors.error}30` }}
          >
            <AlertCircle color={colors.error} size={22} />
            <View className="flex-1">
              <Text className="text-sm font-semibold mb-1" style={{ color: colors.error }}>
                Invalid Invitation
              </Text>
              <Text className="text-xs" style={{ color: colors.error }}>
                {invitationError}
              </Text>
            </View>
          </View>
          <Button label="Go to Login" onPress={() => navigation.navigate('Login')} />
        </View>
      </SafeAreaView>
    )
  }

  const logoUrl = invitation.partner?.visual_identity?.logo || null

  return (
    <SafeAreaView edges={['top']} className="flex-1" style={{ backgroundColor: colors.bgBase }}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 24, flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <AuthLogoHeader
            title="Create Your Account"
            subtitle={`Join ${invitation.partner?.name || 'Fit Nation'} and start your fitness journey`}
            logoUrl={logoUrl}
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

            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Full Name"
                  value={value}
                  onChangeText={onChange}
                  autoComplete="name"
                  placeholder="John Doe"
                  error={errors.name?.message}
                  leftIcon={<User color={colors.textMuted} size={20} />}
                />
              )}
            />

            <Controller
              control={control}
              name="email"
              render={({ field: { value } }) => (
                <Input
                  label="Email Address"
                  value={value}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  error={errors.email?.message}
                  leftIcon={<Mail color={colors.textMuted} size={20} />}
                  readOnly
                />
              )}
            />
            <Text className="text-xs -mt-3 mb-4" style={{ color: colors.textMuted }}>
              This email is from your invitation
            </Text>

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Password"
                  value={value}
                  onChangeText={onChange}
                  secureTextEntry={!showPassword}
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
                  label="Confirm Password"
                  value={value}
                  onChangeText={onChange}
                  secureTextEntry={!showConfirmPassword}
                  placeholder="Re-enter your password"
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
              label="Create Account"
              loading={isSubmitting}
              onPress={handleSubmit(onSubmit)}
            />
          </View>

          <View className="flex-row justify-center mt-6">
            <Text style={{ color: colors.textSecondary }}>Already have an account? </Text>
            <Text
              style={{ color: colors.primary, fontWeight: '600' }}
              onPress={() => navigation.navigate('Login')}
            >
              Sign in
            </Text>
          </View>

          <Text className="text-xs text-center mt-4" style={{ color: colors.textMuted }}>
            By creating an account, you agree to our Terms of Service and Privacy Policy
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
