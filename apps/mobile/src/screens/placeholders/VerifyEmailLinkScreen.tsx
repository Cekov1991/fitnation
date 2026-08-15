import { useEffect, useState } from 'react'
import { View, Text, ActivityIndicator } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { authApi } from '@fit-nation/shared'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { Button } from '../../components/ui/Button'
import type { AppScreenProps } from '../../navigation/types'

type Status = 'verifying' | 'success' | 'error'

/**
 * Landing screen for the verification universal link
 * (https://app.fitnation.mk/verify-email/{id}/{hash}?expires&signature).
 * Calls the signed API endpoint with the params carried by the link, then
 * routes the user onward exactly like EmailVerificationScreen does.
 */
export function VerifyEmailLinkScreen({ route, navigation }: AppScreenProps<'VerifyEmailLink'>) {
  const { id, hash, expires, signature } = route.params
  const { user, refreshUser } = useAuth()
  const { colors } = useTheme()

  const [status, setStatus] = useState<Status>('verifying')
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function run() {
      try {
        if (!expires || !signature) {
          throw new Error('This verification link is incomplete. Please open it from the email again.')
        }
        await authApi.verifyEmailLink({ id, hash, expires, signature })
        await refreshUser()
        if (!cancelled) setStatus('success')
      } catch (e: unknown) {
        if (!cancelled) {
          setStatus('error')
          setMessage(
            e instanceof Error && e.message
              ? e.message
              : 'Verification failed. The link may have expired.'
          )
        }
      }
    }
    run()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Once the refreshed user is verified, land them where they belong
  useEffect(() => {
    if (status !== 'success' || !user?.email_verified_at) return
    navigation.reset({
      index: 0,
      routes: [{ name: user.onboarding_completed_at ? 'Tabs' : 'Onboarding' }],
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, user?.email_verified_at])

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgBase }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 }}>
        {status === 'verifying' && (
          <>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: '600' }}>
              Verifying your email…
            </Text>
          </>
        )}

        {status === 'success' && (
          <Text style={{ color: colors.textPrimary, fontSize: 18, fontWeight: '600' }}>
            Email verified — welcome to the Nation.
          </Text>
        )}

        {status === 'error' && (
          <>
            <Text
              style={{ color: colors.textPrimary, fontSize: 18, fontWeight: '600', textAlign: 'center' }}
            >
              We couldn't verify your email
            </Text>
            <Text style={{ color: colors.textMuted, fontSize: 14, textAlign: 'center' }}>
              {message}
            </Text>
            <Button
              label="Request a new link"
              onPress={() =>
                navigation.reset({ index: 0, routes: [{ name: 'EmailVerification' }] })
              }
            />
          </>
        )}
      </View>
    </SafeAreaView>
  )
}
