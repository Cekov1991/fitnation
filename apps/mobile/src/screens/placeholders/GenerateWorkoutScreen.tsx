import { useState, useEffect } from 'react'
import { View, Text, ScrollView, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { ArrowLeft, Sparkles } from 'lucide-react-native'
import { useGenerateDraftSession, useProfile } from '@fit-nation/shared'
import { useTheme } from '../../context/ThemeContext'
import type { AppScreenProps } from '../../navigation/types'

const PRESETS = [
  { key: 'push', name: 'Push', targetRegions: ['UPPER_PUSH'] },
  { key: 'pull', name: 'Pull', targetRegions: ['UPPER_PULL'] },
  { key: 'legs', name: 'Legs', targetRegions: ['LOWER'] },
  { key: 'upper', name: 'Upper Body', targetRegions: ['UPPER_PUSH', 'UPPER_PULL'] },
  { key: 'lower', name: 'Lower Body', targetRegions: ['LOWER', 'CORE'] },
  { key: 'fullBody', name: 'Full Body', targetRegions: [] },
]

const DURATION_OPTIONS = [
  { label: '20-30 min', value: 30 },
  { label: '30-45 min', value: 45 },
  { label: '45-60 min', value: 60 },
  { label: '60-90 min', value: 90 },
  { label: '90+ min', value: 120 },
]

type Props = AppScreenProps<'GenerateWorkout'>

export function GenerateWorkoutScreen({ navigation }: Props) {
  const { colors } = useTheme()
  const { data: profile } = useProfile()
  const generateDraft = useGenerateDraftSession()

  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null)

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

  const handleGenerate = async () => {
    try {
      const preset = selectedPreset ? PRESETS.find(p => p.key === selectedPreset) : null
      const response = await generateDraft.mutateAsync({
        target_regions: preset && preset.targetRegions.length > 0 ? preset.targetRegions : undefined,
        duration_minutes: selectedDuration ?? undefined,
        difficulty: profile?.profile?.training_experience ?? undefined,
      })
      const sessionId = response.data.id
      navigation.navigate('WorkoutPreview', {
        sessionId: sessionId.toString(),
        generationParams: {
          target_regions: preset && preset.targetRegions.length > 0 ? preset.targetRegions : undefined,
          duration_minutes: selectedDuration ?? undefined,
          difficulty: profile?.profile?.training_experience ?? undefined,
        },
      })
    } catch (error) {
      console.error('Failed to generate workout:', error)
    }
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.bgBase }}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="flex-row items-center gap-4 pt-6 mb-8">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="p-2 rounded-xl"
            style={{ backgroundColor: colors.bgSurface }}
            activeOpacity={0.7}
          >
            <ArrowLeft size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <View className="flex-1">
            <View className="flex-row items-center gap-2">
              <Sparkles size={24} color={colors.primary} />
              <Text className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
                Smart Workout
              </Text>
            </View>
            <Text className="text-sm mt-1" style={{ color: colors.textSecondary }}>
              Powered by Fit Nation's Engine
            </Text>
          </View>
        </View>

        {/* Quick Select / Presets */}
        <View className="mb-8">
          <Text className="text-xs font-bold mb-3 uppercase tracking-wider" style={{ color: colors.textSecondary }}>
            Quick Select
          </Text>
          <View className="flex-row flex-wrap gap-3">
            {PRESETS.map(preset => {
              const isSelected = selectedPreset === preset.key
              return (
                <TouchableOpacity
                  key={preset.key}
                  onPress={() => setSelectedPreset(isSelected ? null : preset.key)}
                  className="rounded-xl border-2"
                  style={{
                    paddingHorizontal: 20,
                    paddingVertical: 14,
                    flexBasis: '47%',
                    backgroundColor: isSelected ? `${colors.primary}15` : colors.bgSurface,
                    borderColor: isSelected ? colors.primary : `${colors.textMuted}40`,
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
        <View className="mb-10">
          <Text className="text-xs font-bold mb-3 uppercase tracking-wider" style={{ color: colors.textSecondary }}>
            Duration
          </Text>
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
                    borderColor: isSelected ? colors.primary : `${colors.textMuted}40`,
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    className="text-sm font-medium"
                    style={{ color: isSelected ? '#fff' : colors.textPrimary }}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>

        {/* Generate Button */}
        <TouchableOpacity
          onPress={handleGenerate}
          disabled={generateDraft.isPending}
          style={{ borderRadius: 16, overflow: 'hidden', opacity: generateDraft.isPending ? 0.7 : 1 }}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ paddingVertical: 18, alignItems: 'center', justifyContent: 'center' }}
          >
            <View className="flex-row items-center gap-2">
              <Sparkles size={20} color="#fff" />
              <Text style={{ color: '#fff', fontSize: 17, fontWeight: '700' }}>
                {generateDraft.isPending ? 'GENERATING...' : 'GENERATE WORKOUT'}
              </Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}
