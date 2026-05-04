import { View, Text, TouchableOpacity } from 'react-native'
import { MoreVertical } from 'lucide-react-native'
import { useTheme } from '../../context/ThemeContext'

interface CompletedSetRowProps {
  setNumber: number
  weight: number | null
  reps: number
  allowWeightLogging: boolean
  onOpenMenu: () => void
}

function formatWeight(w: number) {
  return Number.isInteger(w) ? w.toString() : w.toFixed(1)
}

export function CompletedSetRow({
  setNumber,
  weight,
  reps,
  allowWeightLogging,
  onOpenMenu,
}: CompletedSetRowProps) {
  const { colors } = useTheme()

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: colors.success,
        backgroundColor: `${colors.success}0D`,
      }}
    >
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
              <Text style={{ fontSize: 11, color: colors.textMuted }}>kg</Text>
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
  onOpenMenu: () => void
}

export function PendingSetRow({
  setNumber,
  allowWeightLogging,
  onOpenMenu,
}: PendingSetRowProps) {
  const { colors } = useTheme()

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        backgroundColor: colors.bgElevated,
      }}
    >
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
              <Text style={{ fontSize: 11, color: colors.textMuted }}>kg</Text>
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
