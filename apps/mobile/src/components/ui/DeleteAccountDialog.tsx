import { useState } from 'react'
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from 'react-native'
import { AlertTriangle, Eye, EyeOff } from 'lucide-react-native'
import { useTheme } from '../../context/ThemeContext'

interface DeleteAccountDialogProps {
  visible: boolean
  onClose: () => void
  onConfirm: (password: string) => Promise<void>
}

export function DeleteAccountDialog({
  visible,
  onClose,
  onConfirm,
}: DeleteAccountDialogProps) {
  const { colors } = useTheme()
  const [password, setPassword] = useState('')
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleClose = () => {
    if (isLoading) return
    setPassword('')
    setPasswordVisible(false)
    setError(null)
    onClose()
  }

  const handleConfirm = async () => {
    if (!password) {
      setError('Please enter your password.')
      return
    }
    setError(null)
    setIsLoading(true)
    try {
      await onConfirm(password)
    } catch (err: any) {
      const msg =
        err?.errors?.password?.[0] ||
        err?.message ||
        'Incorrect password. Please try again.'
      setError(msg)
      setIsLoading(false)
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Pressable
          onPress={() => {}}
          style={[
            styles.card,
            { backgroundColor: colors.bgSurface, borderColor: colors.border },
          ]}
        >
          {/* Icon + heading */}
          <View style={styles.headerSection}>
            <View style={[styles.iconWrap, { backgroundColor: `${colors.error}18` }]}>
              <AlertTriangle size={22} color={colors.error} />
            </View>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              Delete Account
            </Text>
            <Text style={[styles.message, { color: colors.textSecondary }]}>
              This will permanently delete your account and all training data.{' '}
              <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>
                This cannot be undone.
              </Text>
            </Text>
          </View>

          {/* Password input */}
          <View style={styles.inputSection}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
              Confirm your password
            </Text>
            <View
              style={[
                styles.inputRow,
                {
                  backgroundColor: colors.bgElevated,
                  borderColor: error ? colors.error : colors.border,
                },
              ]}
            >
              <TextInput
                value={password}
                onChangeText={(v) => {
                  setPassword(v)
                  if (error) setError(null)
                }}
                secureTextEntry={!passwordVisible}
                placeholder="Enter your password"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                style={[styles.textInput, { color: colors.textPrimary }]}
                onSubmitEditing={handleConfirm}
                returnKeyType="done"
              />
              <TouchableOpacity
                onPress={() => setPasswordVisible((v) => !v)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                {passwordVisible ? (
                  <EyeOff size={18} color={colors.textMuted} />
                ) : (
                  <Eye size={18} color={colors.textMuted} />
                )}
              </TouchableOpacity>
            </View>
            {error && (
              <Text style={[styles.errorText, { color: colors.error }]}>
                {error}
              </Text>
            )}
          </View>

          {/* Buttons */}
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              onPress={handleConfirm}
              disabled={isLoading}
              activeOpacity={0.75}
              style={[
                styles.deleteButton,
                { backgroundColor: colors.error, opacity: isLoading ? 0.7 : 1 },
              ]}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.deleteLabel}>Delete My Account</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleClose}
              disabled={isLoading}
              activeOpacity={0.6}
              style={styles.cancelButton}
            >
              <Text style={[styles.cancelLabel, { color: colors.textSecondary }]}>
                Cancel
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
  headerSection: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 16,
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
  inputSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    paddingRight: 8,
  },
  errorText: {
    fontSize: 12,
    marginTop: 2,
  },
  buttonsContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  deleteButton: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
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
