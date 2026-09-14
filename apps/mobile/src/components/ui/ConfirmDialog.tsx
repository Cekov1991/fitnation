import { Modal, View, Text, Pressable, StyleSheet } from 'react-native'
import { withAlpha } from '@fit-nation/shared'
import { AlertTriangle, Info } from 'lucide-react-native'
import { useTheme } from '../../context/ThemeContext'
import { Button } from './Button'

interface ConfirmDialogProps {
  visible: boolean
  onClose: () => void
  title: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  onConfirm: () => void
}

export function ConfirmDialog({
  visible,
  onClose,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
}: ConfirmDialogProps) {
  const { colors } = useTheme()

  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  const iconColor = destructive ? colors.error : colors.primary
  const iconBg = destructive ? withAlpha(colors.error, 0.094) : withAlpha(colors.primary, 0.094)
  const Icon = destructive ? AlertTriangle : Info

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={[styles.backdrop, { backgroundColor: colors.scrim }]} onPress={onClose}>
        <Pressable
          onPress={() => {}}
          style={[
            styles.card,
            { backgroundColor: colors.bgSurface, borderColor: colors.border },
          ]}
        >
          {/* Icon + Header */}
          <View style={styles.headerSection}>
            <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
              <Icon size={22} color={iconColor} />
            </View>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              {title}
            </Text>
            {!!message && (
              <Text style={[styles.message, { color: colors.textSecondary }]}>
                {message}
              </Text>
            )}
          </View>

          {/* Buttons stacked vertically */}
          <View style={styles.buttonsContainer}>
            <Button
              label={confirmLabel}
              variant={destructive ? 'destructive' : 'primary'}
              size="md"
              onPress={handleConfirm}
            />
            <Button label={cancelLabel} variant="ghost" size="sm" onPress={onClose} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  card: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    paddingBottom: 16,
  },

  // Header
  headerSection: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 20,
    alignItems: 'center',
    gap: 10,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  message: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },

  // Buttons
  buttonsContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
})
