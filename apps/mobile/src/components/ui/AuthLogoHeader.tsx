import { View, Text } from 'react-native'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { Dumbbell } from 'lucide-react-native'
import { useTheme } from '../../context/ThemeContext'

interface AuthLogoHeaderProps {
  title: string
  subtitle: string
  logoUrl?: string | null
}

export function AuthLogoHeader({ title, subtitle, logoUrl }: AuthLogoHeaderProps) {
  const { colors } = useTheme()

  return (
    <View className="items-center mb-8">
      {logoUrl ? (
        <Image
          source={logoUrl}
          style={{ width: 80, height: 80, borderRadius: 16, marginBottom: 24 }}
          contentFit="contain"
        />
      ) : (
        <LinearGradient
          colors={[colors.primary, colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: 80,
            height: 80,
            borderRadius: 24,
            marginBottom: 24,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Dumbbell color="#fff" size={40} />
        </LinearGradient>
      )}

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
