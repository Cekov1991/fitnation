import { useState, useEffect, useRef } from 'react'
import { View, Text, ActivityIndicator } from 'react-native'
import { Image } from 'expo-image'
import { SafeAreaView } from 'react-native-safe-area-context'
import { authApi } from '@fit-nation/shared'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { Button } from '../../components/ui/Button'
import { showToast } from '../../lib/toast'
import type { AppScreenProps } from '../../navigation/types'

const localLogo = require('../../../assets/logo.png')

const RESEND_COOLDOWN_MS = 60_000

export function EmailVerificationScreen({ navigation }: AppScreenProps<'EmailVerification'>) {
  const { user, refreshUser, logout } = useAuth()
  const { colors } = useTheme()

  const [refreshing, setRefreshing] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const logoUrl = user?.partner?.visual_identity?.logo ?? null
  const needsOnboarding = !user?.onboarding_completed_at

  // Auto-advance when email_verified_at is set (triggered by AppState refresh or manual refresh)
  useEffect(() => {
    if (user?.email_verified_at) {
      navigation.reset({
        index: 0,
        routes: [{ name: needsOnboarding ? 'Onboarding' : 'Tabs' }],
      })
    }
  }, [user?.email_verified_at])

  // Poll every 10 s to handle cross-device verification
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        await refreshUser()
      } catch {
        // silent — AppState listener will also trigger on foreground
      }
    }, 10_000)
    return () => clearInterval(interval)
  }, [])

  // Resend cooldown ticker
  useEffect(() => {
    if (resendCooldown <= 0) {
      if (cooldownRef.current) clearInterval(cooldownRef.current)
      return
    }
    cooldownRef.current = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) {
          if (cooldownRef.current) clearInterval(cooldownRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1_000)
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current)
    }
  }, [resendCooldown > 0])

  async function handleRefresh() {
    setRefreshing(true)
    try {
      await refreshUser()
      // If not verified yet, the useEffect above won't fire — give feedback
      if (!user?.email_verified_at) {
        showToast('Email not yet verified. Please check your inbox.', 'error')
      }
    } catch {
      showToast('Could not check verification status. Please try again.', 'error')
    } finally {
      setRefreshing(false)
    }
  }

  async function handleResend() {
    if (resendCooldown > 0) return
    setResending(true)
    try {
      await authApi.resendVerificationEmail()
      showToast('Verification email sent!', 'success')
      setResendCooldown(RESEND_COOLDOWN_MS / 1_000)
    } catch (e: unknown) {
      const err = e as any
      if (err?.status === 422) {
        showToast('Your email is already verified!', 'success')
        try { await refreshUser() } catch { /* will auto-advance via useEffect */ }
      } else {
        showToast(err?.message || 'Could not resend email. Please try again.', 'error')
      }
    } finally {
      setResending(false)
    }
  }

  async function handleSignOut() {
    await logout()
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} className="flex-1 px-6 items-center justify-center" style={{ backgroundColor: colors.bgBase }}>
      {/* Partner logo or default app logo */}
      <View className="mb-8 items-center">
        <Image
          source={logoUrl ? { uri: logoUrl } : localLogo}
          style={{ width: 120, height: 120, borderRadius: 16 }}
          contentFit="contain"
        />
      </View>

      <Text className="text-2xl font-bold text-center mb-3" style={{ color: colors.textPrimary }}>
        Check your email
      </Text>

      <Text className="text-sm text-center mb-2" style={{ color: colors.textSecondary }}>
        We sent a verification link to
      </Text>
      <Text className="text-base font-semibold text-center mb-6" style={{ color: colors.primary }}>
        {user?.email}
      </Text>

      <Text className="text-sm text-center mb-8" style={{ color: colors.textMuted }}>
        Click the link in the email to verify your account and get started. You can return to the app once you've verified.
      </Text>

      <View className="w-full gap-3">
        <Button
          label={refreshing ? 'Checking...' : 'I have verified my email'}
          onPress={handleRefresh}
          disabled={refreshing}
        />

        <Button
          variant="ghost"
          label={
            resending
              ? 'Sending...'
              : resendCooldown > 0
              ? `Resend in ${resendCooldown}s`
              : 'Resend verification email'
          }
          onPress={handleResend}
          disabled={resending || resendCooldown > 0}
        />

        <Button
          variant="ghost"
          label="Sign out"
          onPress={handleSignOut}
        />
      </View>

      {(refreshing || resending) && (
        <ActivityIndicator className="mt-4" color={colors.primary} />
      )}
    </SafeAreaView>
  )
}
