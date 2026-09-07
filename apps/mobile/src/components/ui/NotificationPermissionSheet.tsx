// The permission explainer shown before the OS prompt — after onboarding and,
// since 0013 R10–R12, from the launch check at most once every 7 days. Showing
// it stamps `pushPromptLastShownAt`, whatever the user picks. Styled like
// ConfirmDialog.
import { useEffect, useState } from 'react'
import {
  Modal, View, Text, TouchableOpacity, Pressable, StyleSheet, ActivityIndicator, Linking,
} from 'react-native'
import { Bell } from 'lucide-react-native'
import { useTheme } from '../../context/ThemeContext'
import { grantPushPermission } from '../../lib/notifications'
import { markPushPromptShown, type PermissionSheetVariant } from '../../lib/pushPrompt'

interface NotificationPermissionSheetProps {
  visible: boolean
  // 'ask' (default): "Turn on" fires the OS prompt. 'settings': permission is
  // denied and the OS will never prompt again, so "Open Settings" is the way back (R11).
  variant?: PermissionSheetVariant
  // Called after either choice has been handled.
  onClose: () => void
}

const BODY = "We'll only nudge you when you've gone quiet — no spam, no marketing."
// Same line Profile shows next to its toggle when permission is denied.
const DENIED_BODY = `${BODY} Notifications are off for Fit Nation in your phone's settings.`

export function NotificationPermissionSheet({
  visible,
  variant = 'ask',
  onClose,
}: NotificationPermissionSheetProps) {
  const { colors } = useTheme()
  const [busy, setBusy] = useState(false)

  // R12: the 7-day clock starts the moment the sheet appears, from any caller.
  useEffect(() => {
    if (visible) markPushPromptShown()
  }, [visible])

  const handlePrimary = async () => {
    if (busy) return
    setBusy(true)
    try {
      if (variant === 'settings') await Linking.openSettings()
      else await grantPushPermission()
    } catch (e) {
      console.warn('[push]', e)
    } finally {
      setBusy(false)
      onClose()
    }
  }

  const handleNotNow = () => {
    if (busy) return
    onClose()
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleNotNow}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={handleNotNow}>
        <Pressable
          onPress={() => {}}
          style={[styles.card, { backgroundColor: colors.bgSurface, borderColor: colors.border }]}
        >
          <View style={styles.headerSection}>
            <View style={[styles.iconWrap, { backgroundColor: `${colors.primary}18` }]}>
              <Bell size={22} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Stay on track</Text>
            <Text style={[styles.message, { color: colors.textSecondary }]}>
              {variant === 'settings' ? DENIED_BODY : BODY}
            </Text>
          </View>

          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              onPress={handlePrimary}
              disabled={busy}
              activeOpacity={0.75}
              style={[styles.confirmButton, { backgroundColor: colors.primary, opacity: busy ? 0.7 : 1 }]}
            >
              {busy ? (
                <ActivityIndicator color={colors.textButton} size="small" />
              ) : (
                <Text style={[styles.confirmLabel, { color: colors.textButton }]}>
                  {variant === 'settings' ? 'Open Settings' : 'Turn on'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={handleNotNow} disabled={busy} activeOpacity={0.6} style={styles.cancelButton}>
              <Text style={[styles.cancelLabel, { color: colors.textSecondary }]}>Not now</Text>
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
