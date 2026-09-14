import { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Sparkles } from 'lucide-react-native'
import {
  DEFAULT_TRAINING_STYLES,
  TRAINING_STYLE_OPTIONS,
  useEquipmentTypes,
  useGenerateDraftSession,
  useProfile,
  withAlpha,
  WORKOUT_DURATION_OPTIONS,
} from '@fit-nation/shared'
import type { EquipmentTypeResource } from '@fit-nation/shared'
import { useTheme } from '../../context/ThemeContext'
import { SCREEN } from '../../constants/layout'
import { ScreenHeader } from '../../components/ui/ScreenHeader'
import { Button, BUTTON, useButtonContentColor } from '../../components/ui/Button'
import { SectionLabel } from '../../components/ui/SectionLabel'
import type { AppScreenProps } from '../../navigation/types'

const PRESETS = [
  { key: 'push', name: 'Push', targetRegions: ['UPPER_PUSH'] },
  { key: 'pull', name: 'Pull', targetRegions: ['UPPER_PULL'] },
  { key: 'legs', name: 'Legs', targetRegions: ['LOWER'] },
  { key: 'upper', name: 'Upper Body', targetRegions: ['UPPER_PUSH', 'UPPER_PULL'] },
  { key: 'lower', name: 'Lower Body', targetRegions: ['LOWER', 'CORE'] },
  { key: 'fullBody', name: 'Full Body', targetRegions: [] },
]

const DURATION_OPTIONS = WORKOUT_DURATION_OPTIONS

type Props = AppScreenProps<'GenerateWorkout'>

export function GenerateWorkoutScreen({ navigation }: Props) {
  const { colors } = useTheme()
  const generateContentColor = useButtonContentColor('primary')
  const { data: profile } = useProfile()
  const generateDraft = useGenerateDraftSession()
  const { data: equipmentTypes = [] } = useEquipmentTypes()

  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null)
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([])
  const [selectedStyles, setSelectedStyles] = useState<string[]>([...DEFAULT_TRAINING_STYLES])

  useEffect(() => {
    if (profile?.profile?.workout_duration_minutes) {
      const profileDuration = profile.profile.workout_duration_minutes
      const closest =
        DURATION_OPTIONS.find(opt => opt.value >= profileDuration) ??
        DURATION_OPTIONS[DURATION_OPTIONS.length - 1]
      setSelectedDuration(closest.value)
    } else {
      setSelectedDuration(45)
    }
  }, [profile?.profile?.workout_duration_minutes])

  const toggleEquipment = (code: string) => {
    setSelectedEquipment(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    )
  }

  const toggleStyle = (code: string) => {
    setSelectedStyles(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    )
  }

  const handleGenerate = async () => {
    try {
      const preset = selectedPreset ? PRESETS.find(p => p.key === selectedPreset) : null
      const generationParams = {
        target_regions: preset && preset.targetRegions.length > 0 ? preset.targetRegions : undefined,
        duration_minutes: selectedDuration ?? undefined,
        difficulty: profile?.profile?.training_experience ?? undefined,
        equipment_types: selectedEquipment.length > 0 ? selectedEquipment : undefined,
        training_styles: selectedStyles.length > 0 ? selectedStyles : [...DEFAULT_TRAINING_STYLES],
      }
      const response = await generateDraft.mutateAsync(generationParams)
      const sessionId = response.data.id
      navigation.navigate('WorkoutPreview', {
        sessionId: sessionId.toString(),
        generationParams,
      })
    } catch (error) {
      console.error('Failed to generate workout:', error)
    }
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.bgBase }}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: SCREEN.paddingX, paddingBottom: SCREEN.paddingBottom }}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          title="Smart Workout"
          subtitle="Powered by Fit Nation's Engine"
          onBack={() => navigation.goBack()}
          right={<Sparkles size={24} color={colors.primary} />}
        />

        {/* Quick Select / Presets */}
        <View className="mb-8">
          <SectionLabel>Quick Select</SectionLabel>
          <View className="flex-row flex-wrap gap-3">
            {PRESETS.map(preset => {
              const isSelected = selectedPreset === preset.key
              return (
                <TouchableOpacity
                  key={preset.key}
                  onPress={() => setSelectedPreset(isSelected ? null : preset.key)}
                  className="rounded-xl border-2"
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    flexBasis: '47%',
                    backgroundColor: isSelected ? withAlpha(colors.primary, 0.082) : colors.bgSurface,
                    borderColor: isSelected ? colors.primary : withAlpha(colors.textMuted, 0.251),
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    className="text-sm font-bold text-center"
                    style={{ color: isSelected ? colors.primary : colors.textPrimary }}
                  >
                    {preset.name}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>
          {!selectedPreset && (
            <Text className="text-xs mt-2" style={{ color: colors.textMuted }}>
              Select a workout type or leave empty for full body
            </Text>
          )}
        </View>

        {/* Duration */}
        <View className="mb-8">
          <SectionLabel>Duration</SectionLabel>
          <View className="flex-row flex-wrap gap-2">
            {DURATION_OPTIONS.map(opt => {
              const isSelected = selectedDuration === opt.value
              return (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => setSelectedDuration(opt.value)}
                  className="px-4 py-2 rounded-full border"
                  style={{
                    backgroundColor: isSelected ? colors.primary : colors.bgSurface,
                    borderColor: isSelected ? colors.primary : withAlpha(colors.textMuted, 0.251),
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    className="text-sm font-medium"
                    style={{ color: isSelected ? colors.textButton : colors.textPrimary }}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>

        {/* Equipment */}
        {equipmentTypes.length > 0 && (
          <View className="mb-8">
            <SectionLabel>Equipment</SectionLabel>
            <View className="flex-row flex-wrap gap-2">
              {equipmentTypes.map((eq: EquipmentTypeResource) => {
                const isSelected = selectedEquipment.includes(eq.code)
                return (
                  <TouchableOpacity
                    key={eq.code}
                    onPress={() => toggleEquipment(eq.code)}
                    className="px-3 py-2 rounded-xl border"
                    style={{
                      backgroundColor: isSelected ? colors.primary : colors.bgSurface,
                      borderColor: isSelected ? colors.primary : withAlpha(colors.textMuted, 0.251),
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      className="text-xs font-medium"
                      style={{ color: isSelected ? colors.textButton : colors.textPrimary }}
                    >
                      {eq.name}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>
        )}

        {/* Training Style */}
        <View className="mb-10">
          <SectionLabel>Training Style</SectionLabel>
          <View className="flex-row flex-wrap gap-2">
            {TRAINING_STYLE_OPTIONS.map(style => {
              const isSelected = selectedStyles.includes(style.code)
              return (
                <TouchableOpacity
                  key={style.code}
                  onPress={() => toggleStyle(style.code)}
                  className="px-3 py-2 rounded-xl border"
                  style={{
                    backgroundColor: isSelected ? colors.primary : colors.bgSurface,
                    borderColor: isSelected ? colors.primary : withAlpha(colors.textMuted, 0.251),
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    className="text-xs font-medium"
                    style={{ color: isSelected ? colors.textButton : colors.textPrimary }}
                  >
                    {style.label}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>

        {/* Generate Button */}
        <Button
          label="Generate Workout"
          variant="primary"
          icon={<Sparkles size={BUTTON.md.icon} color={generateContentColor} />}
          loading={generateDraft.isPending}
          disabled={generateDraft.isPending}
          onPress={handleGenerate}
        />
      </ScrollView>
    </SafeAreaView>
  )
}
