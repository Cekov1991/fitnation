import { TouchableOpacity, View, Text } from 'react-native'
import { Image } from 'expo-image'
import { Dumbbell } from 'lucide-react-native'
import { useTheme } from '../../context/ThemeContext'
import type { ExerciseResource } from '@fit-nation/shared'

interface ExerciseCardProps {
  exercise: ExerciseResource
  onPress: () => void
  rightAction?: React.ReactNode
}

export function ExerciseCard({ exercise, onPress, rightAction }: ExerciseCardProps) {
  const { colors } = useTheme()
  const primaryMuscle = exercise.muscle_groups?.find(m => m.is_primary)?.name

  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-row items-center p-4 rounded-2xl mb-3"
      style={{ backgroundColor: colors.bgSurface }}
      activeOpacity={0.7}
    >
      {exercise.image ? (
        <Image
          source={{ uri: exercise.image }}
          style={{ width: 56, height: 56, borderRadius: 12 }}
          contentFit="cover"
          placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
        />
      ) : (
        <View
          className="items-center justify-center rounded-xl"
          style={{ width: 56, height: 56, backgroundColor: `${colors.primary}18` }}
        >
          <Dumbbell size={22} color={colors.primary} />
        </View>
      )}

      <View className="flex-1 ml-3 min-w-0">
        <Text
          className="font-semibold text-base"
          style={{ color: colors.textPrimary }}
          numberOfLines={1}
        >
          {exercise.name}
        </Text>
        <Text
          className="text-xs mt-0.5"
          style={{ color: colors.textSecondary }}
          numberOfLines={1}
        >
          {[exercise.equipment_type?.name, primaryMuscle].filter(Boolean).join(' · ')}
        </Text>
      </View>

      {rightAction}
    </TouchableOpacity>
  )
}
