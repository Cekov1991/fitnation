import { View, Text, TextInput, TouchableOpacity } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Timer } from 'lucide-react-native'
import { useTheme } from '../../context/ThemeContext'

interface SetLogCardProps {
  setNumber: number
  weight: string
  reps: string
  onWeightChange: (v: string) => void
  onRepsChange: (v: string) => void
  onLog: () => void
  onStartTimer?: () => void
  defaultWeight: number
  defaultReps: number
  allowWeightLogging: boolean
  goalMinReps: number
  goalMaxReps: number
  goalWeight?: number | null
  totalRepsPrevious?: number | null
  totalRepsTarget?: number | null
  showTimerButton?: boolean
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
  defaultWeight,
  defaultReps,
  allowWeightLogging,
  goalMinReps,
  goalMaxReps,
  goalWeight,
  totalRepsPrevious,
  totalRepsTarget,
  showTimerButton = false,
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
      <Text
        style={{
          fontSize: 13,
          fontWeight: '700',
          color: 'rgba(255,255,255,0.9)',
          marginBottom: 16,
        }}
      >
        Set {setNumber}
      </Text>

      <View style={{ flexDirection: 'row', gap: 14 }}>
        {allowWeightLogging && (
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 11,
                fontWeight: '600',
                color: 'rgba(255,255,255,0.9)',
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
                backgroundColor: 'rgba(255,255,255,0.12)',
                borderWidth: 2,
                borderColor: 'rgba(255,255,255,0.2)',
              }}
            >
              <TextInput
                style={{
                  flex: 1,
                  color: '#fff',
                  fontSize: 18,
                  fontWeight: '700',
                  padding: 0,
                }}
                value={weight}
                onChangeText={onWeightChange}
                keyboardType="decimal-pad"
                placeholder={defaultWeight > 0 ? formatWeight(defaultWeight) : '0'}
                placeholderTextColor="rgba(255,255,255,0.5)"
              />
              <Text
                style={{
                  color: 'rgba(255,255,255,0.85)',
                  fontSize: 13,
                  fontWeight: '600',
                  marginLeft: 4,
                }}
              >
                kg
              </Text>
            </View>
            {showGoalWeightBadge && (
              <Text
                style={{
                  marginTop: 6,
                  fontSize: 11,
                  color: 'rgba(255,255,255,0.7)',
                }}
              >
                Suggested: {formatWeight(goalWeight!)} kg
              </Text>
            )}
          </View>
        )}

        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 11,
              fontWeight: '600',
              color: 'rgba(255,255,255,0.9)',
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
              backgroundColor: 'rgba(255,255,255,0.12)',
              borderWidth: 2,
              borderColor: 'rgba(255,255,255,0.2)',
            }}
          >
            <TextInput
              style={{
                flex: 1,
                color: '#fff',
                fontSize: 18,
                fontWeight: '700',
                padding: 0,
              }}
              value={reps}
              onChangeText={onRepsChange}
              keyboardType="number-pad"
              placeholder={defaultReps > 0 ? defaultReps.toString() : '0'}
              placeholderTextColor="rgba(255,255,255,0.5)"
            />
            <Text
              style={{
                color: 'rgba(255,255,255,0.85)',
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
                color: 'rgba(255,255,255,0.7)',
              }}
            >
              {totalRepsPrevious != null
                ? `Last: ${totalRepsPrevious} / Goal: ${totalRepsTarget}`
                : `Goal: ${totalRepsTarget} total reps`}
            </Text>
          ) : (
            <Text
              style={{
                marginTop: 6,
                fontSize: 11,
                color: 'rgba(255,255,255,0.7)',
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
          activeOpacity={0.85}
          style={{
            flex: 1,
            paddingVertical: 16,
            borderRadius: 18,
            alignItems: 'center',
            backgroundColor: '#fff',
          }}
        >
          <Text style={{ color: colors.primary, fontSize: 16, fontWeight: '700' }}>
            Log Set
          </Text>
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
              backgroundColor: 'rgba(255,255,255,0.18)',
              borderWidth: 2,
              borderColor: 'rgba(255,255,255,0.3)',
            }}
          >
            <Timer size={22} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    </LinearGradient>
  )
}
