import { View, Text } from 'react-native'
import { Image } from 'expo-image'
import { useTheme } from '../../context/ThemeContext'

const localLogo = require('../../../assets/logo.png')

interface AuthLogoHeaderProps {
  title: string
  subtitle: string
  logoUrl?: string | null
}

export function AuthLogoHeader({ title, subtitle, logoUrl }: AuthLogoHeaderProps) {
  const { colors } = useTheme()

  return (
    <View className="items-center mb-8">
      <Image
        source={logoUrl ?? localLogo}
        style={{ width: 120, height: 120, borderRadius: 16, marginBottom: 24 }}
        contentFit="contain"
      />

      <Text
        className="text-3xl font-bold mb-2 text-center"
        style={{ color: colors.primary }}
      >
        {title}
      </Text>
      <Text className="text-sm text-center" style={{ color: colors.textSecondary }}>
        {subtitle}
      </Text>
    </View>
  )
}
