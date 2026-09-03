// M3: the one-time explainer shown after onboarding, before the OS prompt.
// "Not now" is remembered and never re-prompted; the Profile toggle is the
// way back. Styled like ConfirmDialog.
import { useState } from 'react'
import { Modal, View, Text, TouchableOpacity, Pressable, StyleSheet, ActivityIndicator } from 'react-native'
import * as SecureStore from 'expo-secure-store'
import { Bell } from 'lucide-react-native'
import { useTheme } from '../../context/ThemeContext'
import { grantPushPermission } from '../../lib/notifications'
import { PUSH_PROMPT_DISMISSED_KEY } from '../../lib/pushPrompt'

interface NotificationPermissionSheetProps {
  visible: boolean
  // Called after either choice has been handled.
  onClose: () => void
}

export function NotificationPermissionSheet({ visible, onClose }: NotificationPermissionSheetProps) {
  const { colors } = useTheme()
  const [busy, setBusy] = useState(false)

  const handleTurnOn = async () => {
    if (busy) return
    setBusy(true)
    try {
      await grantPushPermission()
    } finally {
      setBusy(false)
      onClose()
    }
  }

  const handleNotNow = async () => {
    if (busy) return
    await SecureStore.setItemAsync(PUSH_PROMPT_DISMISSED_KEY, '1').catch(() => {})
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
              We'll only nudge you when you've gone quiet — no spam, no marketing.
            </Text>
          </View>

          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              onPress={handleTurnOn}
              disabled={busy}
              activeOpacity={0.75}
              style={[styles.confirmButton, { backgroundColor: colors.primary, opacity: busy ? 0.7 : 1 }]}
            >
              {busy ? (
                <ActivityIndicator color={colors.textButton} size="small" />
              ) : (
                <Text style={[styles.confirmLabel, { color: colors.textButton }]}>Turn on</Text>
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
