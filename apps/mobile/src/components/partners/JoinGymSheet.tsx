import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Check, MapPin } from 'lucide-react-native'
import { withAlpha } from '@fit-nation/shared'
import { useTheme } from '../../context/ThemeContext'
import { STACK_GAP } from '../../constants/layout'
import { Button } from '../ui/Button'

/**
 * The Join Prompt's bottom sheet (ticket #94): the nearest Partner's name and
 * benefits checklist over a Join action. Styled like DeleteAccountSheet — the
 * app's bottom-card family.
 *
 * Dismissal semantics are ticket #95's: `onDismiss` carries the kind so the
 * caller can post it to `/join-prompt/dismissals` once that ships. Today the
 * sheet only emits 'snoozed' ("Not Now", the backdrop, the back gesture); #95
 * adds a "Not Interested" affordance that emits 'declined'.
 */
// radius/tileRadius are the bottom-card family's 20/14 (DeleteAccountSheet,
// NotificationPermissionSheet) — kept equal to them, not RADIUS.card, so the
// sheets move together when that drift is resolved.
export const JOIN_GYM_SHEET = { radius: 20, padding: 20, tile: 48, tileRadius: 14, icon: 22, title: 22, benefitIcon: 16 } as const

export type JoinPromptDismissalKind = 'snoozed' | 'declined'

interface JoinGymSheetProps {
  visible: boolean
  /** The nearest Partner's name — `/partners/nearby` is ordered nearest first. */
  partnerName: string
  /** The Partner's benefits, listed as a checklist. */
  benefits: string[]
  /** True while the Gym Join request is in flight; dismissal is held off meanwhile. */
  joining: boolean
  onJoin: () => void
  onDismiss: (kind: JoinPromptDismissalKind) => void
}

export function JoinGymSheet({ visible, partnerName, benefits, joining, onJoin, onDismiss }: JoinGymSheetProps) {
  const { colors } = useTheme()

  const handleSnooze = () => {
    if (joining) return
    onDismiss('snoozed')
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleSnooze} statusBarTranslucent>
      <Pressable style={[styles.backdrop, { backgroundColor: colors.scrim }]} onPress={handleSnooze}>
        <SafeAreaView edges={['bottom']}>
          <Pressable onPress={() => {}} style={styles.container}>
            <View style={[styles.card, { backgroundColor: colors.bgSurface, borderColor: colors.border }]}>
              <View style={[styles.tile, { backgroundColor: withAlpha(colors.primary, 0.094) }]}>
                <MapPin size={JOIN_GYM_SHEET.icon} color={colors.primary} />
              </View>
              <Text style={[styles.title, { color: colors.textPrimary }]}>You're at {partnerName}</Text>
              <Text style={[styles.message, { color: colors.textSecondary }]}>
                Join your gym on Fit Nation to train under its programs and branding.
              </Text>

              {benefits.length > 0 && (
                <View style={styles.benefits}>
                  {benefits.map((benefit) => (
                    <View key={benefit} style={styles.benefitRow}>
                      <Check size={JOIN_GYM_SHEET.benefitIcon} color={colors.success} />
                      <Text style={[styles.benefitText, { color: colors.textPrimary }]}>{benefit}</Text>
                    </View>
                  ))}
                </View>
              )}

              <Button label={`Join ${partnerName}`} loading={joining} onPress={onJoin} />
              <Button label="Not Now" variant="ghost" size="sm" disabled={joining} onPress={handleSnooze} style={styles.dismiss} />
            </View>
          </Pressable>
        </SafeAreaView>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  container: { paddingHorizontal: 12, paddingBottom: 8 },
  card: { borderRadius: JOIN_GYM_SHEET.radius, borderWidth: 1, padding: JOIN_GYM_SHEET.padding },
  tile: {
    width: JOIN_GYM_SHEET.tile,
    height: JOIN_GYM_SHEET.tile,
    borderRadius: JOIN_GYM_SHEET.tileRadius,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: { fontSize: JOIN_GYM_SHEET.title, fontWeight: '700', marginBottom: 8 },
  message: { fontSize: 14, lineHeight: 20, marginBottom: 16 },
  benefits: { gap: 10, marginBottom: 20 },
  benefitRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  benefitText: { flex: 1, fontSize: 14, lineHeight: 20 },
  dismiss: { marginTop: STACK_GAP },
})
