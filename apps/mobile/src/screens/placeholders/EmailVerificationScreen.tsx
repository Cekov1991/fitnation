import { useState, useEffect, useRef } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Mail } from 'lucide-react-native'
import { authApi, failureOf, withAlpha } from '@fit-nation/shared'
import { useAuth } from '../../context/AuthContext'
import { useEntitlements, Entitlement } from '../../hooks/useEntitlements'
import { entryRoute } from '../../navigation/gate'
import { useTheme } from '../../context/ThemeContext'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { SectionLabel } from '../../components/ui/SectionLabel'
import { AuthLogoHeader } from '../../components/ui/AuthLogoHeader'
import { RADIUS, SCREEN, SECTION_GAP, STACK_GAP } from '../../constants/layout'
import { showToast } from '../../lib/toast'
import type { AppScreenProps } from '../../navigation/types'

const RESEND_COOLDOWN_MS = 60_000

/** The "sent to" card's tile is the settings rows' 36 tile, so it reads as the same family. */
const EMAIL_CARD = { tile: 36, icon: 18 } as const

/**
 * The gate between sign-up and the app: the person has to tap the link we
 * emailed. The brand header, the message and the "sent to" card sit centred
 * in the free space; the two buttons and the sign-out link are pinned at the
 * bottom (mock of 2026-10-02).
 * Verification is detected by polling and by the foreground refresh; the
 * primary button is only the impatient way to check now.
 */
export function EmailVerificationScreen({ navigation }: AppScreenProps<'EmailVerification'>) {
  const { user, refreshUser, logout } = useAuth()
  const { colors } = useTheme()

  const [refreshing, setRefreshing] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const { has } = useEntitlements()

  // Auto-advance when email_verified_at is set (triggered by AppState refresh or
  // manual refresh): on to onboarding, or past the subscription gate.
  useEffect(() => {
    if (user?.email_verified_at) {
      navigation.reset({
        index: 0,
        routes: [{ name: entryRoute(user, has(Entitlement.AppAccess)) }],
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
    } catch (e) {
      const failure = failureOf(e)
      if (failure.kind === 'validation') {
        showToast('Your email is already verified!', 'success')
        try { await refreshUser() } catch { /* will auto-advance via useEffect */ }
      } else {
        showToast(failure.message || 'Could not resend email. Please try again.', 'error')
      }
    } finally {
      setResending(false)
    }
  }

  async function handleSignOut() {
    await logout()
  }

  const resendLabel = resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Email'

  return (
    <SafeAreaView edges={['top', 'bottom']} style={[styles.screen, { backgroundColor: colors.bgBase }]}>
      <View style={styles.body}>
        <AuthLogoHeader
          logoUrl={user?.partner?.visual_identity?.logo ?? null}
          titleTone="plain"
          title="Check your email"
          subtitle="We sent a verification link to"
        />
        <Card style={[styles.emailCard, { borderColor: withAlpha(colors.primary, 0.3) }]}>
          <View style={[styles.emailTile, { backgroundColor: withAlpha(colors.primary, 0.1) }]}>
            <Mail size={EMAIL_CARD.icon} color={colors.primary} />
          </View>
          <View style={styles.emailText}>
            <SectionLabel tone="muted" style={styles.emailLabel}>
              Sent to
            </SectionLabel>
            <Text numberOfLines={1} style={[styles.email, { color: colors.textPrimary }]}>
              {user?.email}
            </Text>
          </View>
        </Card>
        <Text style={[styles.text, styles.hint, { color: colors.textSecondary }]}>
          Tap the link in the email, then come back here to get started.
        </Text>
      </View>

      <View style={styles.footer}>
        <Button label="I've Verified My Email" loading={refreshing} onPress={handleRefresh} />
        <Button
          variant="secondary"
          label={resendLabel}
          loading={resending}
          disabled={resendCooldown > 0}
          onPress={handleResend}
          style={styles.resend}
        />
        <View style={styles.signOutRow}>
          <Text style={[styles.text, { color: colors.textSecondary }]}>Wrong email? </Text>
          <Text
            accessibilityRole="button"
            onPress={handleSignOut}
            style={[styles.text, styles.signOut, { color: colors.primary }]}
          >
            Sign out
          </Text>
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: SCREEN.paddingX },
  body: { flex: 1, justifyContent: 'center' },
  emailCard: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1 },
  emailTile: {
    width: EMAIL_CARD.tile,
    height: EMAIL_CARD.tile,
    borderRadius: RADIUS.control,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emailText: { flex: 1, minWidth: 0 },
  emailLabel: { marginBottom: 2 },
  email: { fontSize: 16, fontWeight: '700' },
  text: { fontSize: 14, lineHeight: 20, textAlign: 'center' },
  hint: { paddingHorizontal: 16 },
  footer: { paddingBottom: SCREEN.paddingBottom },
  resend: { marginTop: STACK_GAP },
  signOutRow: { flexDirection: 'row', justifyContent: 'center', marginTop: SECTION_GAP },
  signOut: { fontWeight: '600' },
})
