import { useEffect, useRef } from 'react'
import { AppState, AppStateStatus, View, Text, TouchableOpacity, Pressable } from 'react-native'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { useVideoPlayer, VideoView } from 'expo-video'
import { MoreVertical } from 'lucide-react-native'
import { useTheme } from '../../context/ThemeContext'

interface ExerciseVideoCardProps {
  name: string
  muscleGroup?: string | null
  imageUrl?: string | null
  videoUrl?: string | null
  isActive: boolean
  onOpenMenu: () => void
  onView: () => void
}

function ExerciseVideoPlayer({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, p => {
    p.loop = true
    p.muted = true
    p.play()
  })

  const appState = useRef(AppState.currentState)

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        player.play()
      }
      appState.current = nextState
    })
    return () => sub.remove()
  }, [player])

  useEffect(() => {
    const sub = player.addListener('statusChange', ({ status, error }) => {
      if (error) {
        console.warn('[ExerciseVideoCard]', status, error)
      }
    })
    return () => sub.remove()
  }, [player])

  return (
    <VideoView
      player={player}
      style={{ width: '100%', height: '100%' }}
      contentFit="cover"
      nativeControls={false}
    />
  )
}

export function ExerciseVideoCard({
  name,
  muscleGroup,
  imageUrl,
  videoUrl,
  isActive,
  onOpenMenu,
  onView,
}: ExerciseVideoCardProps) {
  const { colors } = useTheme()
  const hasVideo = !!videoUrl && videoUrl.trim() !== ''

  return (
    <Pressable
      onPress={onView}
      style={{
        marginHorizontal: 20,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        backgroundColor: colors.bgSurface,
      }}
    >
      {/* Media (4:3 aspect) */}
      <View style={{ width: '100%', aspectRatio: 4 / 3 }}>
        {hasVideo && isActive ? (
          <ExerciseVideoPlayer uri={videoUrl!} />
        ) : imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
          />
        ) : (
          <View style={{ width: '100%', height: '100%', backgroundColor: colors.bgElevated }} />
        )}

        {/* Top gradient for text readability */}
        <LinearGradient
          colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.2)', 'transparent']}
          locations={[0, 0.4, 1]}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
          pointerEvents="none"
        />

        {/* Name + muscle chip overlay */}
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            padding: 16,
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: 12,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: '#fff',
                fontSize: 20,
                fontWeight: '700',
                lineHeight: 24,
                marginBottom: 8,
                textShadowColor: 'rgba(0,0,0,0.6)',
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 4,
              }}
              numberOfLines={2}
            >
              {name}
            </Text>
            {muscleGroup && (
              <View
                style={{
                  alignSelf: 'flex-start',
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                  borderRadius: 999,
                  backgroundColor: 'rgba(6,182,212,0.25)',
                  borderWidth: 1,
                  borderColor: 'rgba(6,182,212,0.4)',
                }}
              >
                <Text
                  style={{
                    color: '#67e8f9',
                    fontSize: 11,
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
            style={{
              padding: 8,
              borderRadius: 10,
              backgroundColor: 'rgba(0,0,0,0.45)',
            }}
          >
            <MoreVertical size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </Pressable>
  )
}
