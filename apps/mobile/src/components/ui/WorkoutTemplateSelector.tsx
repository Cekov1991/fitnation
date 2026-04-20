import { useEffect, useRef } from 'react'
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
}

/** Mirrors apps/web/src/components/dashboard/WorkoutTemplateSelector.tsx */
export function WorkoutTemplateSelector({
  templates,
  selectedTemplateId,
  onTemplateSelect,
  nextWorkout = null,
  onCompletedDayClick,
}: Props) {
  const { colors } = useTheme()
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
      contentContainerStyle={{ gap: 12, paddingVertical: 8, paddingHorizontal: 2 }}
    >
      {templates.map((template, index) => {
        const isNext = nextWorkout != null && template.id === nextWorkout.id
        const isCompleted = template.last_completed_session_id != null
        const isSelected = selectedTemplateId === template.id

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
              paddingHorizontal: 24,
              paddingVertical: 10,
              borderRadius: 9999,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              backgroundColor: isSelected
                ? colors.bgSurface
                : isNext
                ? `${colors.primary}24`
                : isCompleted
                ? 'transparent'
                : colors.borderSubtle,
              borderWidth: isSelected || isCompleted ? 1 : 0,
              borderColor: colors.borderSubtle,
              overflow: 'hidden',
            }}
          >
            {isCompleted && (
              <LinearGradient
                colors={[colors.primary, colors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
              />
            )}
            {isNext && (
              <Clock
                size={14}
                color={colors.primary}
                style={{ position: 'relative', zIndex: 1 }}
              />
            )}
            {isCompleted && (
              <CheckCircle2
                size={14}
                color={colors.textButton}
                style={{ position: 'relative', zIndex: 1 }}
              />
            )}
            <Text
              style={{
                fontSize: 14,
                fontWeight: '700',
                color: isCompleted
                  ? colors.textButton
                  : isSelected || isNext
                  ? colors.primary
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
      <View style={{ width: 8 }} />
    </ScrollView>
  )
}
