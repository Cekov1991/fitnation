import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, BackHandler, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Easing } from 'react-native-reanimated'
import {
  BottomSheetBackdrop,
  BottomSheetFooter,
  BottomSheetModal,
  BottomSheetScrollView,
  useBottomSheetTimingConfigs,
} from '@gorhom/bottom-sheet'
import type { BottomSheetBackdropProps, BottomSheetFooterProps } from '@gorhom/bottom-sheet'
import { ChevronRight } from 'lucide-react-native'
import {
  DEFAULT_TRAINING_STYLES,
  FITNESS_GOAL_OPTIONS,
  TRAINING_DAYS_OPTIONS,
  TRAINING_EXPERIENCE_OPTIONS,
  TRAINING_STYLE_OPTIONS,
  WORKOUT_DURATION_OPTIONS,
  labelFor,
  useEquipmentTypes,
  withAlpha,
} from '@fit-nation/shared'
import type {
  FitnessGoal,
  ProgramResource,
  RegeneratePlanInput,
  TrainingExperience,
  UserProfileResource,
} from '@fit-nation/shared'
import { useTheme } from '../../context/ThemeContext'
import { OptionSheet } from './OptionSheet'

/** The four profile fields the server builds a plan from. All are required. */
export interface PlanProfileSettings {
  fitness_goal: FitnessGoal
  training_experience: TrainingExperience
  training_days_per_week: number
  workout_duration_minutes: number
}

export interface AdjustPlanInput {
  /** Saved to the profile before the plan is regenerated. */
  profile: PlanProfileSettings
  /** Sent with the regenerate request itself. */
  plan: RegeneratePlanInput
}

interface AdjustPlanSheetProps {
  visible: boolean
  onClose: () => void
  onConfirm: (input: AdjustPlanInput) => void
  /** Current values; preselected every time the sheet opens. */
  profile: UserProfileResource | null
  /** The plan a refresh replaces; named in the note above the button. */
  program: ProgramResource | null
  isLoading: boolean
  /** Shown above the buttons; a toast would be hidden under the sheet. */
  error?: string | null
}

type Picker = 'goal' | 'experience' | 'duration' | 'equipment' | 'style'

/**
 * Everything that shapes the personalised plan, in one full-height sheet that
 * slides up from the bottom and swipes down to close: the four profile
 * settings the plan is generated from, then equipment (several) and one training
 * style for this refresh. Each row opens a picker; days per week is picked inline.
 * Nothing is saved until "Refresh Plan"; closing discards the changes.
 */
export function AdjustPlanSheet({
  visible,
  onClose,
  onConfirm,
  profile,
  program,
  isLoading,
  error,
}: AdjustPlanSheetProps) {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const sheetRef = useRef<BottomSheetModal>(null)
  // The library unmounts the sheet itself on a swipe-down; a second dismiss()
  // on top of that leaves it half-dismissed and deaf to the next present().
  // So present/dismiss only on real transitions, tracked here.
  const isPresentedRef = useRef(false)
  const snapPoints = useMemo(() => ['100%'], [])
  // A page-sized sheet should glide, not snap: the library's default spring
  // lands in about a quarter of a second, which reads as abrupt at this size.
  const animationConfigs = useBottomSheetTimingConfigs({ duration: 420, easing: Easing.out(Easing.cubic) })
  const { data: equipmentTypes = [] } = useEquipmentTypes()

  const [goal, setGoal] = useState<FitnessGoal | null>(null)
  const [experience, setExperience] = useState<TrainingExperience | null>(null)
  const [days, setDays] = useState<number | null>(null)
  const [duration, setDuration] = useState<number | null>(null)
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([])
  const [selectedStyle, setSelectedStyle] = useState<string>(DEFAULT_TRAINING_STYLES[0])
  const [picker, setPicker] = useState<Picker | null>(null)
  // Measured so the rows can scroll clear of the footer that floats over them.
  const [footerHeight, setFooterHeight] = useState(0)

  useEffect(() => {
    if (visible && !isPresentedRef.current) {
      // Start from the profile as it is at the moment of opening.
      setGoal(profile?.fitness_goal ?? null)
      setExperience(profile?.training_experience ?? null)
      setDays(profile?.training_days_per_week ?? null)
      setDuration(profile?.workout_duration_minutes ?? null)
      setSelectedEquipment([])
      setSelectedStyle(DEFAULT_TRAINING_STYLES[0])
      setPicker(null)
      isPresentedRef.current = true
      sheetRef.current?.present()
    } else if (!visible && isPresentedRef.current) {
      sheetRef.current?.dismiss()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- profile is read only at open time
  }, [visible])

  const handleDismissed = useCallback(() => {
    isPresentedRef.current = false
    onClose()
  }, [onClose])

  // The Android back button closes the sheet (or the open picker first).
  useEffect(() => {
    if (!visible) return
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (picker) setPicker(null)
      else onClose()
      return true
    })
    return () => sub.remove()
  }, [visible, picker, onClose])

  const toggleIn = (list: string[], code: string) =>
    list.includes(code) ? list.filter((c) => c !== code) : [...list, code]

  const isComplete = goal != null && experience != null && days != null && duration != null
  const canConfirm = isComplete && !isLoading

  const handleConfirm = useCallback(() => {
    if (!isComplete) return
    onConfirm({
      profile: {
        fitness_goal: goal,
        training_experience: experience,
        training_days_per_week: days,
        workout_duration_minutes: duration,
      },
      plan: {
        equipment_types: selectedEquipment.length > 0 ? selectedEquipment : undefined,
        // One style per plan; the API field is a list, so it travels as a list of one.
        training_styles: [selectedStyle],
      },
    })
  }, [isComplete, goal, experience, days, duration, selectedEquipment, selectedStyle, onConfirm])

  // The grabber and the title form the handle, so a downward drag closes the
  // sheet only from up there. Dragging the settings themselves does nothing —
  // a page-sized sheet that closed from anywhere felt like it could slip away.
  const renderHandle = useCallback(
    () => (
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={[styles.grabber, { backgroundColor: colors.border }]} />
        <Text style={[styles.title, { color: colors.textPrimary }]}>Customize Your Plan</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Your plan is rebuilt from these settings.
        </Text>
      </View>
    ),
    [colors],
  )

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} pressBehavior="close" opacity={0.55} />
    ),
    [],
  )

  // ─── Row values ───
  const experienceOption = TRAINING_EXPERIENCE_OPTIONS.find((o) => o.value === experience)
  const equipmentNames = equipmentTypes.filter((eq) => selectedEquipment.includes(eq.code)).map((eq) => eq.name)
  const equipmentValue =
    equipmentNames.length === 0
      ? 'Any equipment'
      : equipmentNames.length <= 3
        ? equipmentNames.join(', ')
        : `${equipmentNames.slice(0, 2).join(', ')} +${equipmentNames.length - 2} more`
  const equipmentDetail =
    equipmentNames.length === 0
      ? 'Tap to limit the plan to what you have'
      : `+ ${equipmentTypes.length - equipmentNames.length} more available`
  const styleValue = TRAINING_STYLE_OPTIONS.find((s) => s.code === selectedStyle)?.label ?? 'Select'

  const workoutCount = program?.workout_templates?.length ?? 0
  const note = program
    ? `This will replace the ${workoutCount} workout${workoutCount === 1 ? '' : 's'} in ${program.name}.` +
      ((program.progress_percentage ?? 0) > 0 ? ' Your progress in it starts over.' : '')
    : 'A new plan is generated from these settings.'

  const hairline = { borderBottomColor: colors.border }

  const renderFooter = useCallback(
    (props: BottomSheetFooterProps) => (
      <BottomSheetFooter {...props} bottomInset={insets.bottom}>
        <View
          onLayout={(e) => setFooterHeight(e.nativeEvent.layout.height)}
          style={[styles.footer, { backgroundColor: colors.bgSurface, borderTopColor: colors.border }]}
        >
          {error ? (
            <Text style={[styles.note, { color: colors.error }]}>{error}</Text>
          ) : (
            <Text style={[styles.note, { color: colors.textSecondary }]}>{note}</Text>
          )}
          <TouchableOpacity
            onPress={handleConfirm}
            disabled={!canConfirm}
            activeOpacity={0.75}
            style={[styles.confirmButton, { backgroundColor: colors.primary, opacity: canConfirm ? 1 : 0.5 }]}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.textButton} />
            ) : (
              <Text style={[styles.confirmLabel, { color: colors.textButton }]}>Refresh Plan</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} disabled={isLoading} activeOpacity={0.6} style={styles.cancelButton}>
            <Text style={[styles.cancelLabel, { color: colors.textSecondary }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </BottomSheetFooter>
    ),
    [insets.bottom, colors, error, note, canConfirm, isLoading, handleConfirm, onClose],
  )

  const chipRest = withAlpha(colors.textPrimary, 0.06)

  return (
    <>
      <BottomSheetModal
        ref={sheetRef}
        snapPoints={snapPoints}
        enableDynamicSizing={false}
        animationConfigs={animationConfigs}
        enablePanDownToClose
        enableContentPanningGesture={false}
        topInset={insets.top}
        onDismiss={handleDismissed}
        backdropComponent={renderBackdrop}
        handleComponent={renderHandle}
        footerComponent={renderFooter}
        backgroundStyle={{ backgroundColor: colors.bgSurface, borderTopLeftRadius: 28, borderTopRightRadius: 28 }}
      >
        <View style={styles.sheet}>
          <BottomSheetScrollView
            style={styles.rows}
            contentContainerStyle={[styles.rowsContent, { paddingBottom: footerHeight + 16 }]}
          >
            <SettingRow
              label="Goal"
              value={labelFor(FITNESS_GOAL_OPTIONS, goal) || 'Select'}
              muted={goal == null}
              onPress={() => setPicker('goal')}
            />
            <SettingRow
              label="Experience"
              value={experienceOption?.label ?? 'Select'}
              detail={experienceOption?.detail}
              muted={experience == null}
              onPress={() => setPicker('experience')}
            />

            <View style={[styles.row, styles.daysRow, hairline]}>
              <View style={styles.daysHeader}>
                <Text style={[styles.rowLabel, { color: colors.textMuted, marginBottom: 0 }]}>Days per week</Text>
                <Text style={[styles.daysValue, { color: colors.primary }]}>{days ?? ''}</Text>
              </View>
              <View style={styles.daysChips}>
                {TRAINING_DAYS_OPTIONS.map((option) => {
                  const selected = days === option.value
                  return (
                    <TouchableOpacity
                      key={option.value}
                      onPress={() => setDays(option.value)}
                      activeOpacity={0.7}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: selected }}
                      accessibilityLabel={option.label}
                      style={[styles.dayChip, { backgroundColor: selected ? colors.primary : chipRest }]}
                    >
                      <Text style={[styles.dayChipText, { color: selected ? colors.textButton : colors.textSecondary }]}>
                        {option.value}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            </View>

            <SettingRow
              label="Workout duration"
              value={labelFor(WORKOUT_DURATION_OPTIONS, duration) || 'Select'}
              muted={duration == null}
              onPress={() => setPicker('duration')}
            />
            <SettingRow
              label="Equipment"
              value={equipmentValue}
              detail={equipmentDetail}
              onPress={() => setPicker('equipment')}
            />
            <SettingRow label="Training style" value={styleValue} onPress={() => setPicker('style')} />
          </BottomSheetScrollView>

        </View>
      </BottomSheetModal>

      <OptionSheet
        visible={picker === 'goal'}
        onClose={() => setPicker(null)}
        title="Goal"
        options={FITNESS_GOAL_OPTIONS.map((o) => ({ value: o.value, label: o.label, detail: o.description }))}
        selected={goal}
        onSelect={setGoal}
      />
      <OptionSheet
        visible={picker === 'experience'}
        onClose={() => setPicker(null)}
        title="Experience"
        options={TRAINING_EXPERIENCE_OPTIONS.map((o) => ({ value: o.value, label: o.label, detail: o.detail }))}
        selected={experience}
        onSelect={setExperience}
      />
      <OptionSheet
        visible={picker === 'duration'}
        onClose={() => setPicker(null)}
        title="Workout duration"
        options={WORKOUT_DURATION_OPTIONS}
        selected={duration}
        onSelect={setDuration}
      />
      <OptionSheet
        visible={picker === 'equipment'}
        onClose={() => setPicker(null)}
        title="Equipment"
        options={equipmentTypes.map((eq) => ({ value: eq.code, label: eq.name }))}
        selected={selectedEquipment}
        onSelect={(code) => setSelectedEquipment((prev) => toggleIn(prev, code))}
        multi
      />
      <OptionSheet
        visible={picker === 'style'}
        onClose={() => setPicker(null)}
        title="Training style"
        options={TRAINING_STYLE_OPTIONS.map((s) => ({ value: s.code, label: s.label }))}
        selected={selectedStyle}
        onSelect={setSelectedStyle}
      />
    </>
  )
}

interface SettingRowProps {
  label: string
  value: string
  detail?: string
  muted?: boolean
  onPress: () => void
}

/** One setting: small label, the current value, a chevron. Tapping opens its picker. */
function SettingRow({ label, value, detail, muted, onPress }: SettingRowProps) {
  const { colors } = useTheme()
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      style={[styles.row, { borderBottomColor: colors.border }]}
    >
      <View style={styles.rowText}>
        <Text style={[styles.rowLabel, { color: colors.textMuted }]}>{label}</Text>
        <Text style={[styles.rowValue, { color: muted ? colors.textMuted : colors.textPrimary }]}>{value}</Text>
        {!!detail && <Text style={[styles.rowDetail, { color: colors.textMuted }]}>{detail}</Text>}
      </View>
      <ChevronRight size={18} color={colors.textMuted} />
    </TouchableOpacity>
  )
}

// Sizes follow the app's scale (page title 24, headings 18, values 16,
// labels 12/11) rather than the mock's, which renders one step larger.
const styles = StyleSheet.create({
  sheet: { flex: 1 },
  header: { paddingHorizontal: 24, paddingTop: 10, paddingBottom: 18, borderBottomWidth: 1 },
  grabber: { alignSelf: 'center', width: 48, height: 5, borderRadius: 3, marginBottom: 14 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 4 },
  subtitle: { fontSize: 13 },
  rows: { flex: 1 },
  rowsContent: { paddingHorizontal: 24, paddingBottom: 16 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1 },
  rowText: { flex: 1, marginRight: 12 },
  rowLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 5 },
  rowValue: { fontSize: 16, fontWeight: '600' },
  rowDetail: { fontSize: 12, marginTop: 3 },
  daysRow: { flexDirection: 'column', alignItems: 'stretch' },
  daysHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  daysValue: { fontSize: 16, fontWeight: '700' },
  daysChips: { flexDirection: 'row', gap: 8, marginTop: 12 },
  dayChip: { flex: 1, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  dayChipText: { fontSize: 15, fontWeight: '600' },
  footer: { paddingHorizontal: 24, paddingTop: 14, paddingBottom: 12, borderTopWidth: 1 },
  note: { fontSize: 13, lineHeight: 18, marginBottom: 12 },
  confirmButton: { height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  confirmLabel: { fontSize: 16, fontWeight: '700' },
  cancelButton: { paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  cancelLabel: { fontSize: 15, fontWeight: '500' },
})
