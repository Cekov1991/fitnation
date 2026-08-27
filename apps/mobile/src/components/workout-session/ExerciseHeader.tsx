import { View, Text, TouchableOpacity, Pressable } from 'react-native'
import { Image } from 'expo-image'
import { MoreVertical } from 'lucide-react-native'
import { useTheme } from '../../context/ThemeContext'

interface ExerciseHeaderProps {
  name: string
  muscleGroup?: string | null
  imageUrl?: string | null
  onOpenMenu: () => void
  onView: () => void
}

const THUMB = 56

/**
 * Replaces the 4:3 hero video card. The in-session looping player is gone —
 * the video is one tap away on the exercise detail screen via `onView` — so
 * this keeps only what the overlay owned: name, primary muscle, and the ⋯ menu.
 */
export function ExerciseHeader({
  name,
  muscleGroup,
  imageUrl,
  onOpenMenu,
  onView,
}: ExerciseHeaderProps) {
  const { colors } = useTheme()

  return (
    <Pressable
      onPress={onView}
      style={{
        marginHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        padding: 12,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        backgroundColor: colors.bgSurface,
      }}
    >
      <View
        style={{
          width: THUMB,
          height: THUMB,
          borderRadius: 12,
          overflow: 'hidden',
          backgroundColor: colors.bgElevated,
        }}
      >
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={0}
          />
        ) : null}
      </View>

      <View style={{ flex: 1 }}>
        <Text
          style={{
            color: colors.textPrimary,
            fontSize: 17,
            fontWeight: '700',
            lineHeight: 21,
          }}
          numberOfLines={2}
        >
          {name}
        </Text>
        {muscleGroup && (
          <View
            style={{
              alignSelf: 'flex-start',
              marginTop: 6,
              paddingHorizontal: 10,
              paddingVertical: 3,
              borderRadius: 999,
              backgroundColor: `${colors.primary}1A`,
              borderWidth: 1,
              borderColor: `${colors.primary}33`,
            }}
          >
            <Text
              style={{
                color: colors.primary,
                fontSize: 10,
                fontWeight: '700',
                letterSpacing: 0.5,
              }}
            >
              {muscleGroup.toUpperCase()}
            </Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        onPress={e => {
          e.stopPropagation?.()
          onOpenMenu()
        }}
        activeOpacity={0.75}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={{
          padding: 8,
          borderRadius: 10,
          backgroundColor: colors.bgElevated,
        }}
      >
        <MoreVertical size={20} color={colors.textSecondary} />
      </TouchableOpacity>
    </Pressable>
  )
}
