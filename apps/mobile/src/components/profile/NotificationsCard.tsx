import { Linking, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native'
import { Bell } from 'lucide-react-native'
import { useTheme } from '../../context/ThemeContext'
import { Card } from '../ui/Card'
import { PROFILE_SECTION_ROW, ProfileSectionRow } from './ProfileSectionRow'
import { NOTIFICATIONS_OFF_IN_SETTINGS_COPY } from '../../lib/pushPrompt'
import type { PermissionStatus } from '../../lib/notifications'

/**
 * The Profile tab's notifications block: a settings row with the server's
 * global push switch in place of the chevron, and the OS permission state
 * under it, read-only, with one way forward (Settings when denied, "Allow"
 * when never asked). The handlers stay in the screen — this only lays them out.
 */
interface NotificationsCardProps {
  pushEnabled: boolean
  onToggle: (next: boolean) => void
  /** True while the setting is saving; the switch and the row ignore taps. */
  disabled: boolean
  /** `null` until the first OS read resolves. */
  permissionStatus: PermissionStatus | null
  onAllow: () => void
}

export function NotificationsCard({ pushEnabled, onToggle, disabled, permissionStatus, onAllow }: NotificationsCardProps) {
  const { colors } = useTheme()
  return (
    <Card style={styles.card}>
      <ProfileSectionRow
        icon={Bell}
        title="Push notifications"
        summary="A nudge when you've gone quiet. Nothing else."
        summaryLines={2}
        first
        onPress={() => {
          if (!disabled) onToggle(!pushEnabled)
        }}
        right={
          <Switch
            value={pushEnabled}
            onValueChange={onToggle}
            disabled={disabled}
            trackColor={{ true: colors.primary, false: colors.segmentTrack }}
            thumbColor={colors.textButton}
          />
        }
      />

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

// Read-only OS permission state under the push row, with one way forward.
function PermissionHint({ text, action, onPress }: { text: string; action: string; onPress: () => void }) {
  const { colors } = useTheme()
  return (
    <View style={[styles.hint, { borderTopColor: colors.border }]}>
      <Text style={[styles.hintText, { color: colors.textSecondary }]}>{text}</Text>
      <TouchableOpacity onPress={onPress} accessibilityRole="button" hitSlop={8} style={styles.hintAction}>
        <Text style={[styles.hintActionText, { color: colors.primary }]}>{action}</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  card: { padding: 0, overflow: 'hidden' },
  hint: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    paddingHorizontal: PROFILE_SECTION_ROW.paddingX,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  hintText: { flex: 1, fontSize: 12 },
  hintAction: { marginLeft: 8 },
  hintActionText: { fontSize: 12, fontWeight: '600' },
})
