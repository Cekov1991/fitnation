import { useState } from 'react'
import { View, Text } from 'react-native'
import { Image } from 'expo-image'
import { useTheme } from '../../context/ThemeContext'

const localLogo = require('../../../assets/logo.png')

interface AuthLogoHeaderProps {
  title: string
  subtitle: string
  logoUrl?: string | null
  /**
   * `brand` (default) sets the title in the brand colour, as on Login.
   * `plain` sets it in textPrimary — for a status page such as "Check your
   * email", where the brand colour belongs to the actions below it.
   */
  titleTone?: 'brand' | 'plain'
}

export function AuthLogoHeader({ title, subtitle, logoUrl, titleTone = 'brand' }: AuthLogoHeaderProps) {
  const { colors } = useTheme()
  // A partner logo that fails to load (a missing file on the server) would
  // leave a blank square above the title; fall back to the app's own logo.
  const [logoFailed, setLogoFailed] = useState(false)

  return (
    <View className="items-center mb-8">
      <Image
        source={logoUrl && !logoFailed ? logoUrl : localLogo}
        onError={() => setLogoFailed(true)}
        style={{ width: 120, height: 120, borderRadius: 16, marginBottom: 24 }}
        contentFit="contain"
      />

      <Text
        className="text-3xl font-bold mb-2 text-center"
        style={{ color: titleTone === 'plain' ? colors.textPrimary : colors.primary }}
      >
        {title}
      </Text>
      <Text className="text-sm text-center" style={{ color: colors.textSecondary }}>
        {subtitle}
      </Text>
    </View>
  )
}
