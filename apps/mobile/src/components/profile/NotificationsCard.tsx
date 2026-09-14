import { Linking, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native'
import { Bell } from 'lucide-react-native'
import { useTheme } from '../../context/ThemeContext'
import { Card } from '../ui/Card'
import { NOTIFICATIONS_OFF_IN_SETTINGS_COPY } from '../../lib/pushPrompt'
import type { PermissionStatus } from '../../lib/notifications'

/**
 * The Profile tab's notifications block: the server's global push switch with
 * the OS permission state under it, read-only, and one way forward (Settings
 * when denied, "Allow" when never asked). The handlers stay in the screen —
 * this only lays them out.
 */
interface NotificationsCardProps {
  pushEnabled: boolean
  onToggle: (next: boolean) => void
  /** True while the setting is saving; the switch ignores taps. */
  disabled: boolean
  /** `null` until the first OS read resolves. */
  permissionStatus: PermissionStatus | null
  onAllow: () => void
}

export function NotificationsCard({ pushEnabled, onToggle, disabled, permissionStatus, onAllow }: NotificationsCardProps) {
  const { colors } = useTheme()
  return (
    <Card style={[styles.card, { borderColor: colors.border }]}>
      <View style={styles.row}>
        <Bell size={18} color={colors.textSecondary} />
        <View style={styles.text}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Push notifications</Text>
          <Text style={[styles.desc, { color: colors.textMuted }]}>A nudge when you've gone quiet. Nothing else.</Text>
        </View>
        <Switch
          value={pushEnabled}
          onValueChange={onToggle}
          disabled={disabled}
          trackColor={{ true: colors.primary, false: colors.segmentTrack }}
          thumbColor={colors.textButton}
        />
      </View>

      {/* Shown whether or not the switch is on: after an OS refusal the
          switch snaps back and this is the only feedback. */}
      {permissionStatus === 'denied' && (
        <PermissionHint text={NOTIFICATIONS_OFF_IN_SETTINGS_COPY} action="Open Settings" onPress={() => Linking.openSettings()} />
      )}
      {pushEnabled && permissionStatus === 'undetermined' && (
        <PermissionHint text="This phone hasn't allowed notifications yet." action="Allow" onPress={onAllow} />
      )}
    </Card>
  )
}

// Read-only OS permission state under the push switch, with one way forward.
function PermissionHint({ text, action, onPress }: { text: string; action: string; onPress: () => void }) {
  const { colors } = useTheme()
  return (
    <View style={[styles.hint, { borderTopColor: colors.borderSubtle }]}>
      <Text style={[styles.hintText, { color: colors.textSecondary }]}>{text}</Text>
      <TouchableOpacity onPress={onPress} accessibilityRole="button" hitSlop={8} style={styles.hintAction}>
        <Text style={[styles.hintActionText, { color: colors.primary }]}>{action}</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  card: { paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  text: { flex: 1, minWidth: 0 },
  title: { fontSize: 16, fontWeight: '500' },
  desc: { fontSize: 12, marginTop: 2 },
  hint: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1 },
  hintText: { flex: 1, fontSize: 12 },
  hintAction: { marginLeft: 8 },
  hintActionText: { fontSize: 12, fontWeight: '600' },
})
