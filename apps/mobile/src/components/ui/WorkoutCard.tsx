import { useMemo } from 'react'
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { Activity, Clock, Dumbbell, Edit2 } from 'lucide-react-native'
import {
  estimateWorkoutDuration,
  formatRepRange,
  type TemplateExercise,
  type WorkoutTemplateResource,
} from '@fit-nation/shared'
import { useTheme } from '../../context/ThemeContext'
import { GradientText } from './GradientText'

interface WorkoutCardProps {
  template: WorkoutTemplateResource | null
  title?: string
  onStartWorkout?: (templateId: number) => void
  onStartNextWorkout?: () => void
  showStartButton?: boolean
  startButtonText?: string
  startButtonDisabled?: boolean
  startButtonLoading?: boolean
  onExerciseClick?: (exerciseName: string) => void
  onEditWorkout?: (templateId: number) => void
}

/** Mirrors apps/web/src/components/WorkoutCard.tsx */
export function WorkoutCard({
  template,
  title = "TODAY'S WORKOUT",
  onStartWorkout,
  onStartNextWorkout,
  showStartButton = false,
  startButtonText = 'START WORKOUT',
  startButtonDisabled = false,
  startButtonLoading = false,
  onExerciseClick,
  onEditWorkout,
}: WorkoutCardProps) {
  const { colors } = useTheme()

  const exercises = useMemo<TemplateExercise[]>(() => {
    if (!template) return []
    if (Array.isArray((template as any).exercises)) {
      return (template as any).exercises as TemplateExercise[]
    }
    return []
  }, [template])

  const duration = useMemo(() => estimateWorkoutDuration(exercises), [exercises])
  const sortedExercises = useMemo(
    () => [...exercises].sort((a, b) => (a.pivot?.order ?? 0) - (b.pivot?.order ?? 0)),
    [exercises],
  )

  if (!template) return null

  return (
    <View
      style={{
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        backgroundColor: colors.bgSurface,
        borderColor: colors.borderSubtle,
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
          <Activity size={20} color={colors.primary} />
          <GradientText
            style={{ fontSize: 18, fontWeight: '700' }}
            numberOfLines={1}
          >
            {title}
          </GradientText>
        </View>
        {onEditWorkout && (
          <TouchableOpacity
            onPress={() => template.id && onEditWorkout(template.id)}
            style={{
              padding: 8,
              borderRadius: 9999,
              backgroundColor: colors.borderSubtle,
            }}
            activeOpacity={0.7}
          >
            <Edit2 size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Duration + exercise count */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 24, marginBottom: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Clock size={16} color={colors.textSecondary} />
          <Text style={{ fontSize: 14, fontWeight: '500', color: colors.textPrimary }}>
            {duration} min
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Dumbbell size={16} color={colors.textSecondary} />
          <Text style={{ fontSize: 14, fontWeight: '500', color: colors.textPrimary }}>
            {exercises.length} exercises
          </Text>
        </View>
      </View>

      {/* Divider */}
      <View style={{ height: 1, backgroundColor: colors.borderSubtle, marginBottom: 16 }} />

      {/* Workout plan */}
      <Text
        style={{
          fontSize: 12,
          fontWeight: '700',
          letterSpacing: 1,
          color: colors.textPrimary,
          marginBottom: 12,
        }}
      >
        WORKOUT PLAN
      </Text>

      {sortedExercises.length === 0 ? (
        <Text
          style={{
            fontSize: 14,
            textAlign: 'center',
            color: colors.textSecondary,
            paddingVertical: 16,
          }}
        >
          No exercises in this workout
        </Text>
      ) : (
        <View style={{ gap: 12 }}>
          {sortedExercises.map((ex) => {
            const sets = ex.pivot?.target_sets ?? 0
            const minReps = ex.pivot?.min_target_reps ?? 0
            const maxReps = ex.pivot?.max_target_reps ?? 0
            const weight = ex.pivot?.target_weight ?? 0
            const label = `${sets} sets × ${formatRepRange(minReps, maxReps)} reps${weight ? ` × ${weight} kg` : ''}`

            return (
              <TouchableOpacity
                key={ex.pivot?.id ?? ex.id}
                activeOpacity={onExerciseClick ? 0.7 : 1}
                onPress={() => onExerciseClick?.(ex.name)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  borderRadius: 12,
                  backgroundColor: colors.bgElevated,
                  padding: 8,
                }}
              >
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 12,
                    overflow: 'hidden',
                    backgroundColor: colors.borderSubtle,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {ex.image ? (
                    <Image
                      source={{ uri: ex.image }}
                      style={{ width: '100%', height: '100%' }}
                      contentFit="cover"
                      transition={150}
                    />
                  ) : (
                    <Dumbbell size={22} color={colors.textSecondary} />
                  )}
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text
                    numberOfLines={2}
                    style={{
                      fontSize: 14,
                      fontWeight: '700',
                      color: colors.textPrimary,
                      marginBottom: 2,
                    }}
                  >
                    {ex.name}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.textSecondary }}>{label}</Text>
                </View>
              </TouchableOpacity>
            )
          })}
        </View>
      )}

      {/* Start button */}
      {showStartButton && (
        <View
          style={{
            marginTop: 20,
            paddingTop: 16,
            borderTopWidth: 1,
            borderTopColor: colors.borderSubtle,
          }}
        >
          <TouchableOpacity
            activeOpacity={0.9}
            disabled={startButtonDisabled || startButtonLoading}
            onPress={() => {
              if (onStartNextWorkout) onStartNextWorkout()
              else if (onStartWorkout && template.id) onStartWorkout(template.id)
            }}
            style={{
              height: 48,
              borderRadius: 12,
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              opacity: startButtonDisabled ? 0.5 : 1,
            }}
          >
            {startButtonDisabled ? (
              <View
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: 0,
                  right: 0,
                  backgroundColor: colors.borderSubtle,
                }}
              />
            ) : (
              <LinearGradient
                colors={[colors.primary, colors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
              />
            )}
            {startButtonLoading ? (
              <ActivityIndicator color={colors.textButton} />
            ) : (
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '700',
                  letterSpacing: 1,
                  color: startButtonDisabled ? colors.textSecondary : colors.textButton,
                }}
              >
                {startButtonText}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}
