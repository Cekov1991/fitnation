import { Modal, View, Text, TouchableOpacity, Pressable, StyleSheet } from 'react-native'
import { AlertTriangle, Info } from 'lucide-react-native'
import { useTheme } from '../../context/ThemeContext'

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
  const iconBg = destructive ? `${colors.error}18` : `${colors.primary}18`
  const Icon = destructive ? AlertTriangle : Info

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
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
            {/* Confirm button */}
            <TouchableOpacity
              onPress={handleConfirm}
              activeOpacity={0.75}
              style={[
                styles.confirmButton,
                {
                  backgroundColor: destructive ? colors.error : colors.primary,
                },
              ]}
            >
              <Text style={[styles.confirmLabel, { color: '#FFFFFF' }]}>
                {confirmLabel}
              </Text>
            </TouchableOpacity>

            {/* Cancel — subtle, no fill */}
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.6}
              style={styles.cancelButton}
            >
              <Text style={[styles.cancelLabel, { color: colors.textSecondary }]}>
                {cancelLabel}
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
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
  confirmButton: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  cancelButton: {
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
})
