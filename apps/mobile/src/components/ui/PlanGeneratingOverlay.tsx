import { ActivityIndicator, Modal, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { useTheme } from '../../context/ThemeContext'

const defaultLogo = require('../../../assets/logo.png')

interface PlanGeneratingContentProps {
  partnerLogoUrl?: string | null
  title?: string
  subtitle?: string
}

export function PlanGeneratingContent({
  partnerLogoUrl,
  title = 'Building your plan...',
  subtitle = 'This takes a few seconds',
}: PlanGeneratingContentProps) {
  const { colors } = useTheme()

  return (
    <View style={styles.content}>
      <Image
        source={partnerLogoUrl ? { uri: partnerLogoUrl } : defaultLogo}
        style={styles.logo}
        contentFit="contain"
      />
      <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
      <ActivityIndicator color={colors.primary} style={{ marginTop: 8 }} />
    </View>
  )
}

interface PlanGeneratingOverlayProps extends PlanGeneratingContentProps {
  visible: boolean
}

export function PlanGeneratingOverlay({ visible, ...contentProps }: PlanGeneratingOverlayProps) {
  const { colors } = useTheme()

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={[styles.backdrop, { backgroundColor: `${colors.bgBase}E6` }]}>
        <PlanGeneratingContent {...contentProps} />
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  content: {
    alignItems: 'center',
    gap: 12,
    maxWidth: 360,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 16,
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
})
