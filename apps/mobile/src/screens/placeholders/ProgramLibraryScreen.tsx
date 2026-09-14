import { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useProgramLibrary, useCloneProgram, useUpdateProgram, useDeleteProgram, startLibraryProgram, withAlpha } from '@fit-nation/shared'
import type { LibraryProgramResource } from '@fit-nation/shared'
import { useTheme } from '../../context/ThemeContext'
import { SCREEN } from '../../constants/layout'
import { SkeletonBox } from '../../components/ui/SkeletonBox'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { ScreenHeader } from '../../components/ui/ScreenHeader'
import { Button } from '../../components/ui/Button'
import { ErrorState } from '../../components/ui/ErrorState'
import { EmptyState } from '../../components/ui/EmptyState'
import { Calendar, Info, Dumbbell } from 'lucide-react-native'
import { Image } from 'expo-image'
import { showToast } from '../../lib/toast'
import type { AppScreenProps } from '../../navigation/types'

type Props = AppScreenProps<'ProgramLibrary'>

export function ProgramLibraryScreen({ navigation }: Props) {
  const { colors } = useTheme()
  const { data: libraryPrograms = [], isLoading, isError, refetch } = useProgramLibrary()
  const cloneProgram = useCloneProgram()
  const updateProgram = useUpdateProgram()
  const deleteProgram = useDeleteProgram()
  const [confirmProgram, setConfirmProgram] = useState<LibraryProgramResource | null>(null)
  const [isCloning, setIsCloning] = useState(false)

  async function handleStartProgram() {
    if (!confirmProgram) return
    setIsCloning(true)
    // Clone then activate as one named action (0026): a clone left inactive by a
    // failed activate is removed again, and a clone with no id is not "done".
    const outcome = await startLibraryProgram(
      {
        cloneProgram: async id => ((await cloneProgram.mutateAsync(id)) as any)?.data,
        activateProgram: id => updateProgram.mutateAsync({ programId: id, data: { is_active: true } }),
        deleteProgram: id => deleteProgram.mutateAsync(id),
      },
      { programId: confirmProgram.id }
    )
    setIsCloning(false)
    if (outcome.ok) {
      setConfirmProgram(null)
      navigation.goBack()
      return
    }
    showToast(
      outcome.failed === 'clone'
        ? "Couldn't add that program."
        : outcome.compensated
          ? "Couldn't activate the program, so it was not added."
          : 'The program was added but not activated — activate it from your programs.',
      'error'
    )
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1" style={{ backgroundColor: colors.bgBase }}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: SCREEN.paddingX, paddingBottom: SCREEN.paddingBottom }}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader title="Program Library" onBack={() => navigation.goBack()} />

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
          <ErrorState message="Failed to load programs" onRetry={() => refetch()} />
        ) : libraryPrograms.length === 0 ? (
          <EmptyState
            variant="card"
            title="No programs in the library"
            description="Your gym hasn't published any programs yet."
          />
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
                        backgroundColor: colors.imageScrim,
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
                      style={{ color: program.cover_image ? colors.textOnImage : colors.textPrimary }}
                    >
                      {program.name}
                    </Text>
                    <Text
                      className="text-sm leading-relaxed"
                      style={{ color: program.cover_image ? withAlpha(colors.textOnImage, 0.9) : colors.textSecondary }}
                    >
                      {program.description || 'No description.'}
                    </Text>
                  </View>

                  {/* Tags */}
                  <View className="flex-row gap-2 mb-4 flex-wrap">
                    <View
                      className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full"
                      style={{ backgroundColor: withAlpha(colors.primary, 0.2) }}
                    >
                      <Calendar size={14} color={colors.textButton} />
                      <Text className="text-xs font-bold" style={{ color: colors.textButton }}>
                        {program.duration_weeks} WEEKS
                      </Text>
                    </View>
                    {program.workout_templates && (
                      <View
                        className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full"
                        style={{ backgroundColor: withAlpha(colors.primary, 0.2) }}
                      >
                        <Dumbbell size={14} color={colors.textButton} />
                        <Text className="text-xs font-bold" style={{ color: colors.textButton }}>
                          {program.workout_templates.length} WORKOUTS
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* CTA */}
                  <Button label="View Program" onPress={() => setConfirmProgram(program)} />
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
