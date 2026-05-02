import { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useProgramLibrary, useCloneProgram, useUpdateProgram } from '@fit-nation/shared'
import type { LibraryProgramResource } from '@fit-nation/shared'
import { useTheme } from '../../context/ThemeContext'
import { SkeletonBox } from '../../components/ui/SkeletonBox'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { ArrowLeft, Calendar, Info, Dumbbell } from 'lucide-react-native'
import { Image } from 'expo-image'
import { showToast } from '../../lib/toast'
import type { AppScreenProps } from '../../navigation/types'

type Props = AppScreenProps<'ProgramLibrary'>

export function ProgramLibraryScreen({ navigation }: Props) {
  const { colors } = useTheme()
  const { data: libraryPrograms = [], isLoading, isError, refetch } = useProgramLibrary()
  const cloneProgram = useCloneProgram()
  const updateProgram = useUpdateProgram()
  const [confirmProgram, setConfirmProgram] = useState<LibraryProgramResource | null>(null)
  const [isCloning, setIsCloning] = useState(false)

  async function handleStartProgram() {
    if (!confirmProgram) return
    setIsCloning(true)
    try {
      const result = await cloneProgram.mutateAsync(confirmProgram.id)
      const clonedId = (result as any)?.data?.id
      if (clonedId != null) {
        await updateProgram.mutateAsync({ programId: clonedId, data: { is_active: true } })
        setConfirmProgram(null)
        navigation.goBack()
      }
    } catch (e: any) {
      showToast(e?.message || 'Failed to start program', 'error')
    } finally {
      setIsCloning(false)
    }
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1" style={{ backgroundColor: colors.bgBase }}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="flex-row items-center gap-4 pt-6 mb-6">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="p-2 rounded-full"
            style={{ backgroundColor: colors.bgElevated }}
          >
            <ArrowLeft size={22} color={colors.textSecondary} />
          </TouchableOpacity>
          <Text className="text-3xl font-bold" style={{ color: colors.primary }}>
            Program Library
          </Text>
        </View>

        {/* Info Banner */}
        <View
          className="flex-row gap-3 p-4 rounded-xl mb-6"
          style={{ backgroundColor: colors.bgElevated }}
        >
          <Info size={18} color={colors.primary} style={{ marginTop: 2, flexShrink: 0 }} />
          <Text className="flex-1 text-sm leading-relaxed" style={{ color: colors.textSecondary }}>
            Browse professionally designed programs from your gym. Start a program to add it to your
            collection and set it as your active program.
          </Text>
        </View>

        {isLoading ? (
          <>
            <SkeletonBox height={200} className="mb-4" />
            <SkeletonBox height={200} className="mb-4" />
          </>
        ) : isError ? (
          <View className="items-center py-12">
            <Text className="text-base mb-4" style={{ color: colors.textSecondary }}>
              Failed to load programs
            </Text>
            <TouchableOpacity
              onPress={() => refetch()}
              className="px-6 py-3 rounded-xl"
              style={{ backgroundColor: colors.primary }}
            >
              <Text className="font-semibold text-white">Retry</Text>
            </TouchableOpacity>
          </View>
        ) : libraryPrograms.length === 0 ? (
          <View
            className="rounded-2xl p-8 items-center"
            style={{ backgroundColor: colors.bgSurface }}
          >
            <Text className="text-sm text-center" style={{ color: colors.textMuted }}>
              No programs available in the library yet.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 16 }}>
            {(libraryPrograms as LibraryProgramResource[]).map((program) => (
              <TouchableOpacity
                key={program.id}
                onPress={() => setConfirmProgram(program)}
                className="rounded-2xl overflow-hidden"
                style={{ minHeight: 200 }}
                activeOpacity={0.85}
              >
                {/* Background image */}
                {program.cover_image ? (
                  <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
                    <Image
                      source={{ uri: program.cover_image }}
                      style={{ width: '100%', height: '100%' }}
                      contentFit="cover"
                    />
                    <View
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.45)',
                      }}
                    />
                  </View>
                ) : null}

                <View
                  className="p-6"
                  style={{
                    backgroundColor: program.cover_image ? 'transparent' : colors.bgSurface,
                    minHeight: 200,
                    justifyContent: 'space-between',
                  }}
                >
                  {/* Title & description */}
                  <View className="mb-4">
                    <Text
                      className="text-xl font-bold mb-2"
                      style={{ color: program.cover_image ? '#fff' : colors.textPrimary }}
                    >
                      {program.name}
                    </Text>
                    <Text
                      className="text-sm leading-relaxed"
                      style={{ color: program.cover_image ? 'rgba(255,255,255,0.9)' : colors.textSecondary }}
                    >
                      {program.description || 'No description available.'}
                    </Text>
                  </View>

                  {/* Tags */}
                  <View className="flex-row gap-2 mb-4 flex-wrap">
                    <View
                      className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full"
                      style={{ backgroundColor: `${colors.primary}33` }}
                    >
                      <Calendar size={14} color="#fff" />
                      <Text className="text-xs font-bold" style={{ color: '#fff' }}>
                        {program.duration_weeks} WEEKS
                      </Text>
                    </View>
                    {program.workout_templates && (
                      <View
                        className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full"
                        style={{ backgroundColor: `${colors.primary}33` }}
                      >
                        <Dumbbell size={14} color="#fff" />
                        <Text className="text-xs font-bold" style={{ color: '#fff' }}>
                          {program.workout_templates.length} WORKOUTS
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* CTA */}
                  <View
                    className="w-full py-3 rounded-xl items-center"
                    style={{ backgroundColor: colors.primary }}
                  >
                    <Text className="font-bold text-white">View program</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <ConfirmDialog
        visible={!!confirmProgram}
        onClose={() => !isCloning && setConfirmProgram(null)}
        title="Start Program"
        message={`Start "${confirmProgram?.name}"? This will add the program to your collection and set it as your active program.`}
        confirmLabel={isCloning ? 'Starting...' : 'Start'}
        onConfirm={handleStartProgram}
      />
    </SafeAreaView>
  )
}
