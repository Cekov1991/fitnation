import { useState, useEffect, useRef } from 'react'
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity, ActivityIndicator, TextInput, Pressable, Linking } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as SecureStore from 'expo-secure-store'
import { User, Mail, Lock, Eye, EyeOff, AlertCircle, ChevronDown } from 'lucide-react-native'
import { registerSchema, type RegisterFormData, authApi, partnersApi, AUTH_TOKEN_KEY } from '@fit-nation/shared'
import type { PartnerListResource } from '@fit-nation/shared'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { AuthLogoHeader } from '../../components/ui/AuthLogoHeader'
import { ActionSheet } from '../../components/ui/ActionSheet'
import type { AuthScreenProps } from '../../navigation/types'

export function RegisterScreen({ navigation }: AuthScreenProps<'Register'>) {
  const { setUser } = useAuth()
  const { colors } = useTheme()

  const [error, setError] = useState<string | null>(null)
  const [partners, setPartners] = useState<PartnerListResource[]>([])
  const [loadingPartners, setLoadingPartners] = useState(true)
  const [partnersError, setPartnersError] = useState<string | null>(null)
  const [selectedPartner, setSelectedPartner] = useState<PartnerListResource | null>(null)
  const [partnerSheetVisible, setPartnerSheetVisible] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const scrollRef = useRef<ScrollView>(null)
  const emailRef = useRef<TextInput>(null)
  const passwordRef = useRef<TextInput>(null)
  const confirmPasswordRef = useRef<TextInput>(null)

  const { control, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', password_confirmation: '', partner_id: 0 },
  })

  async function loadPartners() {
    setLoadingPartners(true)
    setPartnersError(null)
    try {
      const response = await partnersApi.getActivePartners()
      setPartners(response.data)
    } catch {
      setPartnersError('Could not load partners. Please try again.')
    } finally {
      setLoadingPartners(false)
    }
  }

  useEffect(() => {
    loadPartners()
  }, [])

  function selectPartner(partner: PartnerListResource) {
    setSelectedPartner(partner)
    setValue('partner_id', partner.id, { shouldValidate: true })
  }

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

  if (loadingPartners) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 items-center justify-center" style={{ backgroundColor: colors.bgBase }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="text-sm mt-4" style={{ color: colors.textSecondary }}>
          Loading partners...
        </Text>
      </SafeAreaView>
    )
  }

  if (partnersError) {
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
                Could not load partners
              </Text>
              <Text className="text-xs" style={{ color: colors.error }}>
                {partnersError}
              </Text>
            </View>
          </View>
          <Button
            label="Try Again"
            onPress={loadPartners}
          />
        </View>
      </SafeAreaView>
    )
  }

  const logoUrl = selectedPartner?.visual_identity?.logo || null

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
          contentContainerStyle={{ padding: 24, flexGrow: 1, paddingBottom: 48 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <AuthLogoHeader
            title="Create Your Account"
            subtitle={selectedPartner ? `Join ${selectedPartner.name} and start your fitness journey` : 'Select your gym to get started'}
            logoUrl={logoUrl}
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

            {/* Partner picker */}
            <View className="mb-4">
              <Text className="text-sm font-semibold mb-2" style={{ color: colors.textSecondary }}>
                Your Gym / Partner
              </Text>
              <Pressable
                onPress={() => setPartnerSheetVisible(true)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: errors.partner_id ? colors.error : colors.bgElevated,
                  backgroundColor: colors.bgElevated,
                }}
              >
                <Text
                  className="flex-1 text-base"
                  style={{ color: selectedPartner ? colors.textPrimary : colors.textMuted }}
                >
                  {selectedPartner ? selectedPartner.name : 'Select a partner...'}
                </Text>
                <ChevronDown color={colors.textMuted} size={18} />
              </Pressable>
              {errors.partner_id && (
                <Text className="text-xs mt-1" style={{ color: colors.error }}>
                  {errors.partner_id.message}
                </Text>
              )}
            </View>

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

          <Text className="text-xs text-center mt-4" style={{ color: colors.textMuted }}>
            By creating an account, you agree to our{' '}
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

      <ActionSheet
        visible={partnerSheetVisible}
        onClose={() => setPartnerSheetVisible(false)}
        title="Select Your Partner"
        actions={partners.map(p => ({
          label: p.name,
          onPress: () => selectPartner(p),
        }))}
      />
    </SafeAreaView>
  )
}
