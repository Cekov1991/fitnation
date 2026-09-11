import { useEffect, useRef } from 'react'
import { withAlpha } from '@fit-nation/shared'
import { ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { CheckCircle2, Clock } from 'lucide-react-native'
import { useTheme } from '../../context/ThemeContext'
import type { WorkoutTemplateResource } from '@fit-nation/shared'

interface Props {
  templates: WorkoutTemplateResource[]
  selectedTemplateId: number | null
  onTemplateSelect: (templateId: number) => void
  nextWorkout?: WorkoutTemplateResource | null
  onCompletedDayClick?: (sessionId: number) => void
  /** `card`: sits on a white card — squarer chips on a light tint, no outer padding. */
  variant?: 'default' | 'card'
}

/** Mirrors apps/web/src/components/dashboard/WorkoutTemplateSelector.tsx */
export function WorkoutTemplateSelector({
  templates,
  selectedTemplateId,
  onTemplateSelect,
  nextWorkout = null,
  onCompletedDayClick,
  variant = 'default',
}: Props) {
  const { colors } = useTheme()
  const onCard = variant === 'card'
  const restingBackground = onCard ? withAlpha(colors.textPrimary, 0.06) : colors.bgSurface
  const scrollRef = useRef<ScrollView>(null)
  const offsetsRef = useRef<Record<number, { x: number; width: number }>>({})

  useEffect(() => {
    if (selectedTemplateId == null) return
    const pos = offsetsRef.current[selectedTemplateId]
    if (pos && scrollRef.current) {
      scrollRef.current.scrollTo({ x: Math.max(0, pos.x - 120), animated: true })
    }
  }, [selectedTemplateId])

  if (templates.length === 0) return null

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={onCard ? { gap: 10 } : { gap: 12, paddingVertical: 8, paddingHorizontal: 2 }}
    >
      {templates.map((template, index) => {
        const isNext = nextWorkout != null && template.id === nextWorkout.id
        const isCompleted = template.last_completed_session_id != null
        const isSelected = selectedTemplateId === template.id
        /** Next is only outlined when not selected — selected always uses gradient */
        const showNextOutline = isNext && !isSelected

        const handlePress = () => {
          if (isCompleted && template.last_completed_session_id && onCompletedDayClick) {
            onCompletedDayClick(template.last_completed_session_id)
          } else {
            onTemplateSelect(template.id)
          }
        }

        return (
          <TouchableOpacity
            key={template.id}
            onPress={handlePress}
            onLayout={(e) => {
              offsetsRef.current[template.id] = {
                x: e.nativeEvent.layout.x,
                width: e.nativeEvent.layout.width,
              }
            }}
            activeOpacity={0.8}
            style={{
              paddingHorizontal: onCard ? 20 : 24,
              paddingVertical: onCard ? 12 : 10,
              borderRadius: onCard ? 12 : 9999,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              backgroundColor: isSelected
                ? colors.bgSurface
                : showNextOutline
                ? restingBackground
                : isCompleted
                ? withAlpha(colors.success, 0.149)
                : restingBackground,
              // borderWidth: showNextOutline ? 2 : 0,
              // borderColor: showNextOutline ? colors.primary : 'transparent',
              overflow: 'hidden',
            }}
          >
            {isSelected && (
              <LinearGradient
                colors={[colors.primary, colors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
              />
            )}
            
            {isCompleted && (
              <CheckCircle2
                size={14}
                color={colors.success}
                style={{ position: 'relative', zIndex: 1 }}
              />
            )}
            <Text
              style={{
                fontSize: 14,
                fontWeight: '700',
                color: isSelected
                  ? colors.textButton
                  : showNextOutline
                  ? colors.primary
                  : isCompleted
                  ? colors.success
                  : colors.textSecondary,
                position: 'relative',
                zIndex: 1,
              }}
            >
              Day {index + 1}
            </Text>
          </TouchableOpacity>
        )
      })}
      {!onCard && <View style={{ width: 8 }} />}
    </ScrollView>
  )
}
