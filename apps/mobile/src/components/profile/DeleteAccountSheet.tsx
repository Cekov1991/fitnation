import { useState } from 'react'
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { KeyboardAvoidingView } from 'react-native-keyboard-controller'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Trash2 } from 'lucide-react-native'
import { failureOf, withAlpha } from '@fit-nation/shared'
import { useTheme } from '../../context/ThemeContext'
import { STACK_GAP } from '../../constants/layout'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { DELETE_CONFIRMATION_WORD, isDeleteConfirmed } from './deleteAccountCopy'

/**
 * The last step of deleting the account: a bottom card that says what goes
 * and asks for the word DELETE before the app's one solid-red button enables.
 * Nothing else is asked for — deleteAccountCopy.ts says why. `onConfirm` runs
 * the deletion; its failure shows under the field and the sheet stays open;
 * on success the caller signs out, which unmounts it.
 */
export const DELETE_ACCOUNT_SHEET = { tile: 48, icon: 22, title: 22 } as const

const CONFIRM_LABEL = `Type ${DELETE_CONFIRMATION_WORD} to confirm`

interface DeleteAccountSheetProps {
  visible: boolean
  onClose: () => void
  /** What the deletion removes and what it leaves running — from deleteAccountMessage. */
  message: string
  onConfirm: () => Promise<void>
}

export function DeleteAccountSheet({ visible, onClose, message, onConfirm }: DeleteAccountSheetProps) {
  const { colors } = useTheme()
  const [typed, setTyped] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const confirmed = isDeleteConfirmed(typed)

  const handleClose = () => {
    if (isLoading) return
    setTyped('')
    setError(null)
    onClose()
  }

  const handleConfirm = async () => {
    if (!confirmed || isLoading) return
    setError(null)
    setIsLoading(true)
    try {
      await onConfirm()
    } catch (err) {
      setError(failureOf(err).message)
      setIsLoading(false)
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose} statusBarTranslucent>
      <KeyboardAvoidingView behavior="padding" style={styles.flex}>
        <Pressable style={[styles.backdrop, { backgroundColor: colors.scrim }]} onPress={handleClose}>
          <SafeAreaView edges={['bottom']}>
            <Pressable onPress={() => {}} style={styles.container}>
              <View style={[styles.card, { backgroundColor: colors.bgSurface, borderColor: colors.border }]}>
                <View style={[styles.tile, { backgroundColor: withAlpha(colors.error, 0.094) }]}>
                  <Trash2 size={DELETE_ACCOUNT_SHEET.icon} color={colors.error} />
                </View>
                <Text style={[styles.title, { color: colors.textPrimary }]}>Delete your account?</Text>
                <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>

                <Input
                  label={CONFIRM_LABEL}
                  accessibilityLabel={CONFIRM_LABEL}
                  value={typed}
                  onChangeText={(v) => {
                    setTyped(v)
                    if (error) setError(null)
                  }}
                  placeholder={DELETE_CONFIRMATION_WORD}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={handleConfirm}
                  editable={!isLoading}
                  error={error ?? undefined}
                />

                <Button
                  label="Delete Account"
                  variant="destructiveSolid"
                  disabled={!confirmed}
                  loading={isLoading}
                  onPress={handleConfirm}
                />
                <Button label="Cancel" variant="secondary" disabled={isLoading} onPress={handleClose} style={styles.cancel} />
              </View>
            </Pressable>
          </SafeAreaView>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  container: { paddingHorizontal: 12, paddingBottom: 8 },
  card: { borderRadius: 20, borderWidth: 1, padding: 20 },
  tile: {
    width: DELETE_ACCOUNT_SHEET.tile,
    height: DELETE_ACCOUNT_SHEET.tile,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: { fontSize: DELETE_ACCOUNT_SHEET.title, fontWeight: '700', marginBottom: 8 },
  message: { fontSize: 14, lineHeight: 20, marginBottom: 20 },
  cancel: { marginTop: STACK_GAP },
})
