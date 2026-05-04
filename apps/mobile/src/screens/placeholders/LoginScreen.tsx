import { useState, useRef } from 'react'
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, TextInput, Linking } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react-native'
import { loginSchema, type LoginFormData } from '@fit-nation/shared'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { AuthLogoHeader } from '../../components/ui/AuthLogoHeader'
import type { AuthScreenProps } from '../../navigation/types'

export function LoginScreen({ navigation }: AuthScreenProps<'Login'>) {
  const { login } = useAuth()
  const { colors } = useTheme()
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const scrollRef = useRef<ScrollView>(null)
  const passwordRef = useRef<TextInput>(null)
  const passwordContainerRef = useRef<import('react-native').View>(null)

  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  async function onSubmit(data: LoginFormData) {
    try {
      setError(null)
      await login(data.email, data.password)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Invalid email or password'
      setError(msg)
    }
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1" style={{ backgroundColor: colors.bgBase }}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      >
        <ScrollView
          ref={scrollRef}
          className="flex-1"
          contentContainerStyle={{ padding: 24, justifyContent: 'center', flexGrow: 1, paddingBottom: 80 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <AuthLogoHeader
            title="Welcome Back"
            subtitle="Sign in to Fit Nation"
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
              name="email"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Email Address"
                  value={value}
                  onChangeText={onChange}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  placeholder="you@example.com"
                  error={errors.email?.message}
                  leftIcon={<Mail color={colors.textMuted} size={18} />}
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                  blurOnSubmit={false}
                />
              )}
            />

            <View ref={passwordContainerRef}>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label="Password"
                    value={value}
                    onChangeText={onChange}
                    secureTextEntry={!showPassword}
                    autoComplete="password"
                    placeholder="Enter your password"
                    error={errors.password?.message}
                    leftIcon={<Lock color={colors.textMuted} size={18} />}
                    returnKeyType="done"
                    onSubmitEditing={handleSubmit(onSubmit)}
                    inputRef={passwordRef}
                    onFocusScroll={() => {
                      setTimeout(() => {
                        passwordContainerRef.current?.measureLayout(
                          scrollRef.current as any,
                          (_x, y) => {
                            scrollRef.current?.scrollTo({ y: y - 16, animated: true })
                          },
                          () => scrollRef.current?.scrollToEnd({ animated: true }),
                        )
                      }, 150)
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
            </View>

            <View className="flex-row justify-end mb-6">
              <Text
                className="text-sm"
                style={{ color: colors.primary }}
                onPress={() => navigation.navigate('ForgotPassword')}
              >
                Forgot password?
              </Text>
            </View>

            <Button
              label="Sign In"
              loading={isSubmitting}
              onPress={handleSubmit(onSubmit)}
            />
          </View>

          <View className="flex-row justify-center mt-6">
            <Text style={{ color: colors.textSecondary }}>Don't have an account? </Text>
            <Text
              style={{ color: colors.primary, fontWeight: '600' }}
              onPress={() => navigation.navigate('Register', {})}
            >
              Sign up
            </Text>
          </View>

          <Text className="text-xs text-center mt-8" style={{ color: colors.textMuted }}>
            By signing in, you agree to our{' '}
            <Text
              onPress={() => Linking.openURL('https://admin.fitnation.mk/terms')}
              style={{ color: colors.primary, textDecorationLine: 'underline' }}
            >
              Terms of Service
            </Text>
            {' '}and{' '}
            <Text
              onPress={() => Linking.openURL('https://admin.fitnation.mk/privacy')}
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
