import { Modal, View, Text, Pressable, ScrollView, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { X } from 'lucide-react-native'
import type { BestSetResource, SetLogResource, WeightUnit } from '@fit-nation/shared'
import { useTheme } from '../../context/ThemeContext'
import { RADIUS } from '../../constants/layout'
import { ProgressionBanner } from './ProgressionBanner'
import { BestSetCard } from './BestSetCard'
import { LastSessionCard } from './LastSessionCard'
import type { ProgressionCopy } from './progressionCopy'
import type { LastSessionTargets } from './lastSession'

/**
 * PROTOTYPE (variant D of the logging-screen prototype): every reference block
 * that used to sit in the exercise scroll — the progression story (with its
 * Use/Keep choice), the all-time best and the last-session table — behind the
 * ⓘ button on the set-log card, so the scroll holds only the sets.
 */
export const INFO_SHEET = { title: 18, meta: 13, maxHeightPct: 0.78 } as const

interface ExerciseInfoSheetProps {
  visible: boolean
  onClose: () => void
  exerciseName: string
  /** "3 sets · 8–12 reps · rest 90s" */
  metaLine: string
  banner: ProgressionCopy | null
  weightUnit: WeightUnit
  /** Present only while the banner's choice is still open. */
  onUseWeight?: (weight: number) => void
  onKeep?: () => void
  best: BestSetResource | null | undefined
  weighted: boolean
  previousSets: SetLogResource[]
  minReps: number
  maxReps: number
  progressionMode: LastSessionTargets['progressionMode']
  totalRepsTarget: number | null | undefined
}

export function ExerciseInfoSheet({
  visible,
  onClose,
  exerciseName,
  metaLine,
  banner,
  weightUnit,
  onUseWeight,
  onKeep,
  best,
  weighted,
  previousSets,
  minReps,
  maxReps,
  progressionMode,
  totalRepsTarget,
}: ExerciseInfoSheetProps) {
  const { colors } = useTheme()
  const { height } = useWindowDimensions()

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={[styles.backdrop, { backgroundColor: colors.scrim }]} onPress={onClose}>
        <SafeAreaView edges={['bottom']}>
          <Pressable onPress={() => {}} style={styles.container}>
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.bgSurface,
                  borderColor: colors.border,
                  maxHeight: Math.round(height * INFO_SHEET.maxHeightPct),
                },
              ]}
            >
              <View style={styles.headerRow}>
                <View style={styles.headerText}>
                  <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={2}>
                    {exerciseName}
                  </Text>
                  <Text style={[styles.meta, { color: colors.textSecondary }]}>{metaLine}</Text>
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={[styles.closeBtn, { backgroundColor: colors.bgElevated }]}
                >
                  <X size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={{ flexGrow: 0 }}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
              >
                {banner && (
                  <ProgressionBanner
                    copy={banner}
                    weightUnit={weightUnit}
                    onUseWeight={onUseWeight}
                    onKeep={onKeep}
                  />
                )}
                {best && <BestSetCard best={best} weighted={weighted} weightUnit={weightUnit} />}
                {previousSets.length > 0 && (
                  <LastSessionCard
                    sets={previousSets}
                    weighted={weighted}
                    weightUnit={weightUnit}
                    minReps={minReps}
                    maxReps={maxReps}
                    progressionMode={progressionMode}
                    totalRepsTarget={totalRepsTarget}
                  />
                )}
                {!banner && !best && previousSets.length === 0 && (
                  <Text style={[styles.meta, { color: colors.textSecondary }]}>
                    History will show up here after the first session with this exercise.
                  </Text>
                )}
              </ScrollView>
            </View>
          </Pressable>
        </SafeAreaView>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  container: {
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  card: {
    borderRadius: RADIUS.card,
    borderWidth: 1,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
  },
  headerText: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: INFO_SHEET.title,
    fontWeight: '700',
  },
  meta: {
    fontSize: INFO_SHEET.meta,
    marginTop: 2,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 12,
    gap: 10,
  },
})
