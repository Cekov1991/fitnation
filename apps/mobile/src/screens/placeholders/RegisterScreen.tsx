import { useState, useRef } from 'react'
import { View, Text, ScrollView, TouchableOpacity, TextInput, Linking } from 'react-native'
import { KeyboardAvoidingView } from 'react-native-keyboard-controller'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as SecureStore from 'expo-secure-store'
import { User, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react-native'
import { registerSchema, type RegisterFormData, authApi, AUTH_TOKEN_KEY } from '@fit-nation/shared'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { AuthLogoHeader } from '../../components/ui/AuthLogoHeader'
import { SocialAuthButtons } from '../../components/ui/SocialAuthButtons'
import type { AuthScreenProps } from '../../navigation/types'

export function RegisterScreen({ navigation }: AuthScreenProps<'Register'>) {
  const { setUser, loginWithSocial } = useAuth()
  const { colors } = useTheme()

  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const scrollRef = useRef<ScrollView>(null)
  const emailRef = useRef<TextInput>(null)
  const passwordRef = useRef<TextInput>(null)
  const confirmPasswordRef = useRef<TextInput>(null)

  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', password_confirmation: '', partner_id: 1 },
  })

  async function onSubmit(data: RegisterFormData) {
    try {
      setError(null)
      const response = await authApi.register(data)
      await SecureStore.setItemAsync(AUTH_TOKEN_KEY, response.token)
      setUser(response.user)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Registration failed'
      setError(msg)
    }
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1" style={{ backgroundColor: colors.bgBase }}>
      <KeyboardAvoidingView className="flex-1" behavior="padding">
        <ScrollView
          ref={scrollRef}
          className="flex-1"
          contentContainerStyle={{ padding: 24, flexGrow: 1, paddingBottom: 48 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <AuthLogoHeader
            title="Create Your Account"
            subtitle="Start your fitness journey"
            logoUrl={null}
          />

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
                  autoCorrect={false}
                  placeholder="John Doe"
                  error={errors.name?.message}
                  leftIcon={<User color={colors.textMuted} size={18} />}
                  returnKeyType="next"
                  onSubmitEditing={() => emailRef.current?.focus()}
                  blurOnSubmit={false}
                />
              )}
            />

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Email Address"
                  value={value}
                  onChangeText={onChange}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  placeholder="you@example.com"
                  error={errors.email?.message}
                  leftIcon={<Mail color={colors.textMuted} size={18} />}
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  blurOnSubmit={false}
                  inputRef={emailRef}
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
                  secureTextEntry={!showPassword}
                  placeholder="At least 8 characters"
                  error={errors.password?.message}
                  leftIcon={<Lock color={colors.textMuted} size={18} />}
                  returnKeyType="next"
                  onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                  blurOnSubmit={false}
                  inputRef={passwordRef}
                  onFocusScroll={() => {
                    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120)
                  }}
                  rightElement={
                    <TouchableOpacity onPress={() => setShowPassword(v => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      {showPassword
                        ? <EyeOff color={colors.textMuted} size={18} />
                        : <Eye color={colors.textMuted} size={18} />
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
                  leftIcon={<Lock color={colors.textMuted} size={18} />}
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit(onSubmit)}
                  inputRef={confirmPasswordRef}
                  onFocusScroll={() => {
                    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120)
                  }}
                  rightElement={
                    <TouchableOpacity onPress={() => setShowConfirmPassword(v => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      {showConfirmPassword
                        ? <EyeOff color={colors.textMuted} size={18} />
                        : <Eye color={colors.textMuted} size={18} />
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

          <SocialAuthButtons
            onSuccess={async (provider, token, name) => {
              setError(null)
              await loginWithSocial(provider, token, name)
            }}
            onError={(_, message) => setError(message ?? 'Social sign in failed.')}
            dividerLabel="or sign up with"
          />

          <Text className="text-xs text-center mt-4" style={{ color: colors.textMuted }}>
            By creating an account, you agree to our{' '}
            <Text
              onPress={() => Linking.openURL('https://fitnation.mk/terms')}
              style={{ color: colors.primary, textDecorationLine: 'underline' }}
            >
              Terms of Service
            </Text>
            {' '}and{' '}
            <Text
              onPress={() => Linking.openURL('https://fitnation.mk/privacy')}
              style={{ color: colors.primary, textDecorationLine: 'underline' }}
            >
              Privacy Policy
            </Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
