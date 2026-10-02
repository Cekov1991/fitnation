import { View, Text, TextInput, TouchableOpacity } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Timer, MoreVertical, History, Sparkles, TrendingDown, TrendingUp } from 'lucide-react-native'
import type { LucideIcon } from 'lucide-react-native'
import { useTheme } from '../../context/ThemeContext'
import { Button } from '../ui/Button'
import type { WeightUnit } from '@fit-nation/shared'
import { sanitizeDecimalText, withAlpha, formatWeight } from '@fit-nation/shared'
import { setLogHints, type ColumnHint } from './setLogHints'

/** The hint row under each field: a "Last …" chip and a plain note beside it. */
export const SET_LOG_HINT = { text: 12, icon: 12, chipRadius: 8, chipPaddingX: 8, chipPaddingY: 4, gap: 10 } as const

/** The small badge on the Weight label: where today's placeholder weight comes from. */
export type WeightBadge = 'estimated' | 'raised' | 'lowered'
const WEIGHT_BADGE: Record<WeightBadge, { label: string; Icon: LucideIcon }> = {
  estimated: { label: 'Estimated', Icon: Sparkles },
  raised: { label: 'Raised', Icon: TrendingUp },
  lowered: { label: 'Lowered', Icon: TrendingDown },
}

interface SetLogCardProps {
  setNumber: number
  weight: string
  reps: string
  onWeightChange: (v: string) => void
  onRepsChange: (v: string) => void
  onLog: () => void
  onStartTimer?: () => void
  /** When provided, shows a ⋯ menu on the active set (used to remove the last set). */
  onOpenMenu?: () => void
  defaultWeight: number
  defaultReps: number
  allowWeightLogging: boolean
  goalMinReps: number
  goalMaxReps: number
  /** Where the placeholder weight comes from; null shows no badge. */
  weightBadge?: WeightBadge | null
  /** Last session's set in this slot, for the "last time" line. */
  previousWeight?: number | null
  previousReps?: number | null
  totalRepsTarget?: number | null
  showTimerButton?: boolean
  /** Required so a missed call site is a compile error. */
  weightUnit: WeightUnit
}

export function SetLogCard({
  setNumber,
  weight,
  reps,
  onWeightChange,
  onRepsChange,
  onLog,
  onStartTimer,
  onOpenMenu,
  defaultWeight,
  defaultReps,
  allowWeightLogging,
  goalMinReps,
  goalMaxReps,
  weightBadge = null,
  previousWeight,
  previousReps,
  totalRepsTarget,
  showTimerButton = false,
  weightUnit,
}: SetLogCardProps) {
  const { colors } = useTheme()

  // A hint under each field says where its placeholder comes from, and the
  // reps one carries the target. The fields stay empty on purpose: a pre-filled
  // value would have to be deleted whenever the lift goes differently.
  const hints = setLogHints({
    allowWeightLogging,
    weightUnit,
    goalMinReps,
    goalMaxReps,
    totalRepsTarget,
    defaultWeight,
    defaultReps,
    previousWeight,
    previousReps,
  })
  const renderHint = (hint: ColumnHint) =>
    hint.last || hint.note ? (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: SET_LOG_HINT.gap, marginTop: 8 }}>
        {hint.last && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              paddingHorizontal: SET_LOG_HINT.chipPaddingX,
              paddingVertical: SET_LOG_HINT.chipPaddingY,
              borderRadius: SET_LOG_HINT.chipRadius,
              backgroundColor: colors.imageScrim,
            }}
          >
            <History size={SET_LOG_HINT.icon} color={colors.textButton} strokeWidth={2.5} />
            <Text style={{ fontSize: SET_LOG_HINT.text, fontWeight: '700', color: colors.textButton }}>{hint.last}</Text>
          </View>
        )}
        {hint.note && (
          <Text style={{ fontSize: SET_LOG_HINT.text, fontWeight: '500', color: withAlpha(colors.textButton, 0.902) }}>
            {hint.note}
          </Text>
        )}
      </View>
    ) : null

  return (
    <LinearGradient
      colors={[colors.primary, colors.secondary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        borderRadius: 24,
        padding: 20,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 8,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <Text
          style={{
            fontSize: 13,
            fontWeight: '700',
            color: withAlpha(colors.textButton, 0.902),
          }}
        >
          Set {setNumber}
        </Text>
        {onOpenMenu && (
          <TouchableOpacity
            onPress={onOpenMenu}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: withAlpha(colors.textButton, 0.18),
            }}
          >
            <MoreVertical size={16} color={colors.textButton} />
          </TouchableOpacity>
        )}
      </View>

      <View style={{ flexDirection: 'row', gap: 14 }}>
        {allowWeightLogging && (
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: withAlpha(colors.textButton, 0.902) }}>Weight</Text>
              {weightBadge && (() => {
                const { label, Icon } = WEIGHT_BADGE[weightBadge]
                return (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 3,
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      borderRadius: SET_LOG_HINT.chipRadius,
                      backgroundColor: withAlpha(colors.textButton, 0.18),
                    }}
                  >
                    <Icon size={11} color={colors.textButton} strokeWidth={2.5} />
                    <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textButton }}>{label}</Text>
                  </View>
                )
              })()}
            </View>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 10,
                backgroundColor: withAlpha(colors.textButton, 0.122),
                borderWidth: 2,
                borderColor: withAlpha(colors.textButton, 0.2),
              }}
            >
              <TextInput
                style={{
                  flex: 1,
                  color: colors.textButton,
                  fontSize: 18,
                  fontWeight: '700',
                  padding: 0,
                }}
                value={weight}
                // decimal-pad emits ',' on some locales; parseFloat('154,5') would
                // silently truncate to 154, so normalise before it reaches state.
                onChangeText={(t) => onWeightChange(sanitizeDecimalText(t))}
                keyboardType="decimal-pad"
                placeholder={defaultWeight > 0 ? formatWeight(defaultWeight) : '0'}
                placeholderTextColor={withAlpha(colors.textButton, 0.502)}
              />
              <Text
                style={{
                  color: withAlpha(colors.textButton, 0.851),
                  fontSize: 13,
                  fontWeight: '600',
                  marginLeft: 4,
                }}
              >
                {weightUnit}
              </Text>
            </View>
            {hints.weight && renderHint(hints.weight)}
          </View>
        )}

        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 11,
              fontWeight: '600',
              color: withAlpha(colors.textButton, 0.902),
              marginBottom: 8,
            }}
          >
            Reps
          </Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              borderRadius: 12,
              paddingHorizontal: 14,
              paddingVertical: 10,
              backgroundColor: withAlpha(colors.textButton, 0.122),
              borderWidth: 2,
              borderColor: withAlpha(colors.textButton, 0.2),
            }}
          >
            <TextInput
              style={{
                flex: 1,
                color: colors.textButton,
                fontSize: 18,
                fontWeight: '700',
                padding: 0,
              }}
              value={reps}
              onChangeText={onRepsChange}
              keyboardType="number-pad"
              placeholder={defaultReps > 0 ? defaultReps.toString() : '0'}
              placeholderTextColor={withAlpha(colors.textButton, 0.502)}
            />
            <Text
              style={{
                color: withAlpha(colors.textButton, 0.851),
                fontSize: 13,
                fontWeight: '600',
                marginLeft: 4,
              }}
            >
              reps
            </Text>
          </View>
          {renderHint(hints.reps)}
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
        {/* No pending state: useLogSet is optimistic, so by the time a request
            is in flight this card already belongs to the *next* set. A spinner
            here would sit on a set nobody has logged, and disabling the button
            would stop a fast user logging back-to-back sets. */}
        <Button variant="onBrand" label="Log Set" onPress={onLog} style={{ flex: 1 }} />
        {showTimerButton && onStartTimer && (
          <TouchableOpacity
            onPress={onStartTimer}
            activeOpacity={0.75}
            style={{
              paddingHorizontal: 18,
              paddingVertical: 16,
              borderRadius: 18,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: withAlpha(colors.textButton, 0.18),
              borderWidth: 2,
              borderColor: withAlpha(colors.textButton, 0.302),
            }}
          >
            <Timer size={22} color={colors.textButton} />
          </TouchableOpacity>
        )}
      </View>
    </LinearGradient>
  )
}
