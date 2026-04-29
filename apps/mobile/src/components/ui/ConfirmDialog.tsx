import { Modal, View, Text, TouchableOpacity, Pressable, StyleSheet } from 'react-native'
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
          style={[styles.card, { backgroundColor: colors.bgSurface }]}
        >
          {/* Header */}
          <View style={styles.headerSection}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              {title}
            </Text>
            {!!message && (
              <Text
                style={[styles.message, { color: colors.textSecondary }]}
              >
                {message}
              </Text>
            )}
          </View>

          {/* Divider */}
          <View
            style={[styles.divider, { backgroundColor: colors.bgElevated }]}
          />

          {/* Actions side-by-side */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.6}
              style={styles.actionButton}
            >
              <Text
                style={[
                  styles.actionLabel,
                  { color: colors.textPrimary },
                ]}
              >
                {cancelLabel}
              </Text>
            </TouchableOpacity>

            <View
              style={[
                styles.verticalDivider,
                { backgroundColor: colors.bgElevated },
              ]}
            />

            <TouchableOpacity
              onPress={handleConfirm}
              activeOpacity={0.6}
              style={styles.actionButton}
            >
              <Text
                style={[
                  styles.actionLabel,
                  {
                    color: destructive ? colors.error : colors.primary,
                    fontWeight: '600',
                  },
                ]}
              >
                {confirmLabel}
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
    borderRadius: 16,
    overflow: 'hidden',
  },
  headerSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 18,
    alignItems: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  message: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 6,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: 16,
  },
  verticalDivider: {
    width: StyleSheet.hairlineWidth,
  },
})
