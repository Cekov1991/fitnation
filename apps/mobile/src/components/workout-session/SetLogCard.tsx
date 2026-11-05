import { View, Text, TouchableOpacity } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Timer, MoreVertical, Info, History, Sparkles, TrendingDown, TrendingUp, Minus, Plus } from 'lucide-react-native'
import type { LucideIcon } from 'lucide-react-native'
import { useTheme } from '../../context/ThemeContext'
import { Button } from '../ui/Button'
import type { WeightUnit } from '@fit-nation/shared'
import { withAlpha, formatWeight } from '@fit-nation/shared'
import { setLogHints } from './setLogHints'

/**
 * PROTOTYPE (variant D of the logging-screen prototype): the weight/reps
 * keyboard inputs are replaced by − / + steppers so a set is logged without
 * typing, and the ⓘ button opens the exercise-info sheet that now holds the
 * reference blocks. The hint row is collapsed to one line under the controls.
 */
export const SET_LOG_HINT = { text: 12, icon: 12, chipRadius: 8, chipPaddingX: 8, chipPaddingY: 4, gap: 10, rowGap: 4 } as const

/** The stepper control: [−] value [+]. */
export const SET_LOG_STEPPER = { button: 38, buttonRadius: 9, icon: 18, value: 18, unit: 11 } as const

/** The small badge on the Weight label: where today's suggested weight comes from. */
export type WeightBadge = 'estimated' | 'raised' | 'lowered'
const WEIGHT_BADGE: Record<WeightBadge, { label: string; Icon: LucideIcon }> = {
  estimated: { label: 'Estimated', Icon: Sparkles },
  raised: { label: 'Raised', Icon: TrendingUp },
  lowered: { label: 'Lowered', Icon: TrendingDown },
}

const DEFAULT_WEIGHT_STEP = 2.5

interface SetLogCardProps {
  setNumber: number
  /** Draft values as strings, still owned by the screen; empty means "use the default". */
  weight: string
  reps: string
  onWeightChange: (v: string) => void
  onRepsChange: (v: string) => void
  onLog: () => void
  onStartTimer?: () => void
  /** When provided, shows a ⋯ menu on the active set (used to remove the last set). */
  onOpenMenu?: () => void
  /** Opens the exercise-info sheet (last session, best set, progression). */
  onOpenInfo?: () => void
  /** True while the progression banner in the sheet still wants an answer. */
  infoAttention?: boolean
  defaultWeight: number
  defaultReps: number
  /** One tap on − / + moves the weight by this much. */
  weightStep?: number | null
  allowWeightLogging: boolean
  goalMinReps: number
  goalMaxReps: number
  /** Where the suggested weight comes from; null shows no badge. */
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
  onOpenInfo,
  infoAttention = false,
  defaultWeight,
  defaultReps,
  weightStep,
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

  // The steppers always display the value that Log Set would record: the
  // draft when the user has stepped away from it, the suggestion otherwise.
  const parsedWeight = parseFloat(weight)
  const currentWeight = isNaN(parsedWeight) ? defaultWeight : parsedWeight
  const parsedReps = parseInt(reps, 10)
  const currentReps = isNaN(parsedReps) || parsedReps <= 0 ? defaultReps : parsedReps
  const step = weightStep && weightStep > 0 ? weightStep : DEFAULT_WEIGHT_STEP

  const bumpWeight = (dir: 1 | -1) => {
    const next = Math.max(0, +(currentWeight + dir * step).toFixed(2))
    onWeightChange(formatWeight(next))
  }
  const bumpReps = (dir: 1 | -1) => {
    onRepsChange(String(Math.max(1, currentReps + dir)))
  }

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

  const stepperButton = (onPress: () => void, Icon: LucideIcon) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
      style={{
        width: SET_LOG_STEPPER.button,
        height: SET_LOG_STEPPER.button,
        borderRadius: SET_LOG_STEPPER.buttonRadius,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: withAlpha(colors.textButton, 0.18),
      }}
    >
      <Icon size={SET_LOG_STEPPER.icon} color={colors.textButton} strokeWidth={3} />
    </TouchableOpacity>
  )

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
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {onOpenInfo && (
            <TouchableOpacity
              onPress={onOpenInfo}
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
              <Info size={16} color={colors.textButton} />
              {infoAttention && (
                <View
                  style={{
                    position: 'absolute',
                    top: -2,
                    right: -2,
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: colors.warning,
                  }}
                />
              )}
            </TouchableOpacity>
          )}
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
      </View>

      <View style={{ flexDirection: 'row', gap: 14 }}>
        {allowWeightLogging && (
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: withAlpha(colors.textButton, 0.902) }}>
                Weight · ±{formatWeight(step)}
              </Text>
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
                padding: 5,
                gap: 4,
                backgroundColor: withAlpha(colors.textButton, 0.122),
                borderWidth: 2,
                borderColor: withAlpha(colors.textButton, 0.2),
              }}
            >
              {stepperButton(() => bumpWeight(-1), Minus)}
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: 3 }}>
                <Text
                  style={{
                    color: colors.textButton,
                    fontSize: SET_LOG_STEPPER.value,
                    fontWeight: '700',
                    fontVariant: ['tabular-nums'],
                  }}
                >
                  {formatWeight(currentWeight)}
                </Text>
                <Text style={{ color: withAlpha(colors.textButton, 0.851), fontSize: SET_LOG_STEPPER.unit, fontWeight: '600' }}>
                  {weightUnit}
                </Text>
              </View>
              {stepperButton(() => bumpWeight(1), Plus)}
            </View>
            {previousWeight != null && previousReps != null && (
              <View style={{ flexDirection: 'row', marginTop: 8 }}>
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
                  <Text style={{ fontSize: SET_LOG_HINT.text, fontWeight: '700', color: colors.textButton }}>
                    {`Last ${formatWeight(previousWeight)} ${weightUnit} × ${previousReps}`}
                  </Text>
                </View>
              </View>
            )}
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
              padding: 5,
              gap: 4,
              backgroundColor: withAlpha(colors.textButton, 0.122),
              borderWidth: 2,
              borderColor: withAlpha(colors.textButton, 0.2),
            }}
          >
            {stepperButton(() => bumpReps(-1), Minus)}
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: 3 }}>
              <Text
                style={{
                  color: colors.textButton,
                  fontSize: SET_LOG_STEPPER.value,
                  fontWeight: '700',
                  fontVariant: ['tabular-nums'],
                }}
              >
                {currentReps}
              </Text>
              <Text style={{ color: withAlpha(colors.textButton, 0.851), fontSize: SET_LOG_STEPPER.unit, fontWeight: '600' }}>
                reps
              </Text>
            </View>
            {stepperButton(() => bumpReps(1), Plus)}
          </View>
          {(hints.reps.note || (!allowWeightLogging && hints.reps.last)) && (
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                alignItems: 'center',
                columnGap: SET_LOG_HINT.gap,
                rowGap: SET_LOG_HINT.rowGap,
                marginTop: 8,
              }}
            >
              {!allowWeightLogging && hints.reps.last && (
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
                  <Text style={{ fontSize: SET_LOG_HINT.text, fontWeight: '700', color: colors.textButton }}>
                    {hints.reps.last}
                  </Text>
                </View>
              )}
              {hints.reps.note && (
                <Text style={{ flexShrink: 1, fontSize: SET_LOG_HINT.text, fontWeight: '500', color: withAlpha(colors.textButton, 0.902) }}>
                  {hints.reps.note}
                </Text>
              )}
            </View>
          )}
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
