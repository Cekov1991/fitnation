import { View, Text, TouchableOpacity, type ViewStyle } from 'react-native'
import { formatWeight } from '@fit-nation/shared'
import { MoreVertical } from 'lucide-react-native'
import { useTheme } from '../../context/ThemeContext'
import type { AppColors } from '../../constants/theme'
import type { WeightUnit } from '@fit-nation/shared'

/**
 * Logged and pending sets share one shell. A logged set is distinguished by
 * carrying real values where a pending one shows placeholders — it does not
 * also need its own colour.
 */
const rowShell = (colors: AppColors): ViewStyle => ({
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingHorizontal: 16,
  paddingVertical: 14,
  borderRadius: 14,
  borderWidth: 1,
  borderColor: colors.borderSubtle,
  backgroundColor: colors.bgElevated,
})

interface CompletedSetRowProps {
  setNumber: number
  weight: number | null
  reps: number
  allowWeightLogging: boolean
  /** Required so a missed call site is a compile error. */
  weightUnit: WeightUnit
  onOpenMenu: () => void
}

export function CompletedSetRow({
  setNumber,
  weight,
  reps,
  allowWeightLogging,
  weightUnit,
  onOpenMenu,
}: CompletedSetRowProps) {
  const { colors } = useTheme()

  return (
    <View style={rowShell(colors)}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, flex: 1 }}>
        <Text
          style={{
            fontSize: 13,
            fontWeight: '700',
            color: colors.textSecondary,
          }}
        >
          Set {setNumber}
        </Text>
        {allowWeightLogging && (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: colors.textPrimary }}>
                {weight != null ? formatWeight(weight) : '--'}
              </Text>
              <Text style={{ fontSize: 11, color: colors.textMuted }}>{weightUnit}</Text>
            </View>
            <Text style={{ color: colors.textMuted, fontSize: 16 }}>×</Text>
          </>
        )}
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.textPrimary }}>
            {reps}
          </Text>
          <Text style={{ fontSize: 11, color: colors.textMuted }}>reps</Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={onOpenMenu}
        activeOpacity={0.7}
        style={{
          padding: 8,
          borderRadius: 10,
          backgroundColor: colors.bgSurface,
        }}
      >
        <MoreVertical size={18} color={colors.textSecondary} />
      </TouchableOpacity>
    </View>
  )
}

interface PendingSetRowProps {
  setNumber: number
  allowWeightLogging: boolean
  /** Required so a missed call site is a compile error. */
  weightUnit: WeightUnit
  onOpenMenu: () => void
}

export function PendingSetRow({
  setNumber,
  allowWeightLogging,
  weightUnit,
  onOpenMenu,
}: PendingSetRowProps) {
  const { colors } = useTheme()

  return (
    <View style={rowShell(colors)}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, flex: 1 }}>
        <Text
          style={{
            fontSize: 13,
            fontWeight: '700',
            color: colors.textSecondary,
          }}
        >
          Set {setNumber}
        </Text>
        {allowWeightLogging && (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: colors.textMuted }}>--</Text>
              <Text style={{ fontSize: 11, color: colors.textMuted }}>{weightUnit}</Text>
            </View>
            <Text style={{ color: colors.textMuted, fontSize: 16 }}>×</Text>
          </>
        )}
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.textMuted }}>--</Text>
          <Text style={{ fontSize: 11, color: colors.textMuted }}>reps</Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={onOpenMenu}
        activeOpacity={0.7}
        style={{
          padding: 8,
          borderRadius: 10,
          backgroundColor: colors.bgSurface,
        }}
      >
        <MoreVertical size={18} color={colors.textSecondary} />
      </TouchableOpacity>
    </View>
  )
}
