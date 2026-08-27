import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Timer, MoreVertical } from 'lucide-react-native'
import { useTheme } from '../../context/ThemeContext'
import type { WeightUnit } from '@fit-nation/shared'
import { sanitizeDecimalText } from '@fit-nation/shared'

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
  goalWeight?: number | null
  totalRepsPrevious?: number | null
  totalRepsTarget?: number | null
  showTimerButton?: boolean
  /** Required so a missed call site is a compile error. */
  weightUnit: WeightUnit
  isPending?: boolean
}

function formatWeight(w: number) {
  return Number.isInteger(w) ? w.toString() : w.toFixed(1)
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
  goalWeight,
  totalRepsPrevious,
  totalRepsTarget,
  showTimerButton = false,
  weightUnit,
  isPending = false,
}: SetLogCardProps) {
  const { colors } = useTheme()

  const showGoalWeightBadge =
    goalWeight != null && goalWeight > 0 && goalWeight !== defaultWeight
  const showTotalRepsHint = totalRepsTarget != null

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
            color: `${colors.textButton}E6`,
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
              backgroundColor: `${colors.textButton}2E`,
            }}
          >
            <MoreVertical size={16} color={colors.textButton} />
          </TouchableOpacity>
        )}
      </View>

      <View style={{ flexDirection: 'row', gap: 14 }}>
        {allowWeightLogging && (
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 11,
                fontWeight: '600',
                color: `${colors.textButton}E6`,
                marginBottom: 8,
              }}
            >
              Weight
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 10,
                backgroundColor: `${colors.textButton}1F`,
                borderWidth: 2,
                borderColor: `${colors.textButton}33`,
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
                placeholderTextColor={`${colors.textButton}80`}
              />
              <Text
                style={{
                  color: `${colors.textButton}D9`,
                  fontSize: 13,
                  fontWeight: '600',
                  marginLeft: 4,
                }}
              >
                {weightUnit}
              </Text>
            </View>
            {showGoalWeightBadge && (
              <Text
                style={{
                  marginTop: 6,
                  fontSize: 11,
                  color: `${colors.textButton}B3`,
                }}
              >
                Suggested: {formatWeight(goalWeight!)} {weightUnit}
              </Text>
            )}
          </View>
        )}

        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 11,
              fontWeight: '600',
              color: `${colors.textButton}E6`,
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
              backgroundColor: `${colors.textButton}1F`,
              borderWidth: 2,
              borderColor: `${colors.textButton}33`,
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
              placeholderTextColor={`${colors.textButton}80`}
            />
            <Text
              style={{
                color: `${colors.textButton}D9`,
                fontSize: 13,
                fontWeight: '600',
                marginLeft: 4,
              }}
            >
              reps
            </Text>
          </View>
          {showTotalRepsHint ? (
            <Text
              style={{
                marginTop: 6,
                fontSize: 11,
                color: `${colors.textButton}B3`,
              }}
            >
              {totalRepsPrevious != null
                ? `Last: ${totalRepsPrevious} reps`
                : `Target: ${goalMinReps}-${goalMaxReps} reps`}
            </Text>
          ) : (
            <Text
              style={{
                marginTop: 6,
                fontSize: 11,
                color: `${colors.textButton}B3`,
              }}
            >
              Target: {goalMinReps}-{goalMaxReps} reps
            </Text>
          )}
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
        <TouchableOpacity
          onPress={onLog}
          disabled={isPending}
          activeOpacity={0.85}
          style={{
            flex: 1,
            paddingVertical: 16,
            borderRadius: 18,
            alignItems: 'center',
            backgroundColor: colors.textButton,
            opacity: isPending ? 0.7 : 1,
          }}
        >
          {isPending ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={{ color: colors.primary, fontSize: 16, fontWeight: '700' }}>
              Log Set
            </Text>
          )}
        </TouchableOpacity>
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
              backgroundColor: `${colors.textButton}2E`,
              borderWidth: 2,
              borderColor: `${colors.textButton}4D`,
            }}
          >
            <Timer size={22} color={colors.textButton} />
          </TouchableOpacity>
        )}
      </View>
    </LinearGradient>
  )
}
