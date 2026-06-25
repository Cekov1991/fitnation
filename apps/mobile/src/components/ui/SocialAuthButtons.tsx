import { useState } from 'react'
import { View, Text, TouchableOpacity, ActivityIndicator, Platform } from 'react-native'
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin'
import * as AppleAuthentication from 'expo-apple-authentication'
import Svg, { Path } from 'react-native-svg'
import { useTheme } from '../../context/ThemeContext'

interface SocialAuthButtonsProps {
  onSuccess: (provider: 'google' | 'apple', token: string, name?: string) => Promise<void>
  onError: (provider: 'google' | 'apple', message?: string) => void
  dividerLabel?: string
}

export function SocialAuthButtons({
  onSuccess,
  onError,
  dividerLabel = 'or continue with',
}: SocialAuthButtonsProps) {
  const { colors } = useTheme()
  const [loading, setLoading] = useState<'google' | 'apple' | null>(null)

  async function handleGoogle() {
    try {
      setLoading('google')
      await GoogleSignin.hasPlayServices()
      const { data } = await GoogleSignin.signIn()
      const { idToken } = await GoogleSignin.getTokens()
      if (!idToken) throw new Error('No ID token returned from Google.')
      await onSuccess('google', idToken, data?.user.name ?? undefined)
    } catch (e: any) {
      if (e.code !== statusCodes.SIGN_IN_CANCELLED) {
        onError('google', e.message || 'Google sign in failed.')
      }
    } finally {
      setLoading(null)
    }
  }

  async function handleApple() {
    try {
      setLoading('apple')
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      })
      const name = [credential.fullName?.givenName, credential.fullName?.familyName]
        .filter(Boolean)
        .join(' ') || undefined
      await onSuccess('apple', credential.identityToken!, name)
    } catch (e: any) {
      if (e.code !== 'ERR_REQUEST_CANCELED') {
        onError('apple', e.message || 'Apple sign in failed.')
      }
    } finally {
      setLoading(null)
    }
  }

  return (
    <View style={{ marginTop: 24 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <View style={{ flex: 1, height: 1, backgroundColor: colors.bgElevated }} />
        <Text style={{ fontSize: 12, color: colors.textMuted }}>{dividerLabel}</Text>
        <View style={{ flex: 1, height: 1, backgroundColor: colors.bgElevated }} />
      </View>

      <TouchableOpacity
        onPress={handleGoogle}
        disabled={loading !== null}
        style={{
          width: '100%',
          height: 52,
          borderRadius: 14,
          backgroundColor: colors.bgBase,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          marginBottom: 12,
        }}
      >
        {loading === 'google' ? (
          <ActivityIndicator size="small" color={colors.textPrimary} />
        ) : (
          <Svg width={22} height={22} viewBox="0 0 24 24">
            <Path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <Path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <Path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <Path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </Svg>
        )}
        <Text style={{ fontSize: 15, fontWeight: '600', color: colors.textPrimary }}>Google</Text>
      </TouchableOpacity>

      {Platform.OS === 'ios' && (
        <TouchableOpacity
          onPress={handleApple}
          disabled={loading !== null}
          style={{
            width: '100%',
            height: 52,
            borderRadius: 14,
            backgroundColor: colors.bgBase,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
          }}
        >
          {loading === 'apple' ? (
            <ActivityIndicator size="small" color={colors.textPrimary} />
          ) : (
            <Svg width={22} height={22} viewBox="1.5 1.5 21 21" fill={colors.textPrimary}>
              <Path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </Svg>
          )}
          <Text style={{ fontSize: 15, fontWeight: '600', color: colors.textPrimary }}>Apple</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}
