import { StyleSheet, Text, View } from 'react-native'
import {
  FITNESS_GOAL_OPTIONS,
  SPLIT_FOCUS_OPTIONS,
  TRAINING_DAYS_OPTIONS,
  TRAINING_EXPERIENCE_OPTIONS,
  WORKOUT_DURATION_OPTIONS,
  labelFor,
} from '@fit-nation/shared'
import { useTheme } from '../../context/ThemeContext'
import { RADIUS } from '../../constants/layout'
import { SectionLabel } from '../ui/SectionLabel'
import { Chip, FieldHeader, FieldLabel, fieldStyles } from './fields'
import type { ProfileDraft } from './profileSections'

interface TrainingSectionProps {
  draft: ProfileDraft
  onChange: (patch: ProfileDraft) => void
  /** Show the "Your plan will be …" line once every field is set. On by default. */
  summary?: boolean
}

/** "How do you train?" — experience, days per week, session length, split focus. Headline is the shell's. */
export function TrainingSection({ draft, onChange, summary = true }: TrainingSectionProps) {
  const { colors } = useTheme()
  const {
    training_experience: experience,
    training_days_per_week: days,
    workout_duration_minutes: duration,
    split_focus: focus,
  } = draft
  const complete = !!(experience && days && duration)
  // Every draft is seeded with 'balanced', so this only falls back for a draft
  // built before the field existed — the server reads a missing focus the same way.
  const focusOption = SPLIT_FOCUS_OPTIONS.find((o) => o.value === focus) ?? SPLIT_FOCUS_OPTIONS[0]

  return (
    <View>
      <FieldLabel style={{ marginBottom: 8 }}>Experience</FieldLabel>
      <View style={[fieldStyles.chipRow, { marginBottom: 20 }]}>
        {TRAINING_EXPERIENCE_OPTIONS.map((level) => (
          <Chip
            key={level.value}
            label={level.label}
            selected={experience === level.value}
            onPress={() => onChange({ training_experience: level.value })}
            size="lg"
          />
        ))}
      </View>

      <FieldHeader label="Days per week" value={days ? labelFor(TRAINING_DAYS_OPTIONS, days) : null} />
      <View style={[fieldStyles.chipRow, { marginBottom: 20, gap: 6 }]}>
        {TRAINING_DAYS_OPTIONS.map(({ value }) => (
          <Chip key={value} label={String(value)} selected={days === value} onPress={() => onChange({ training_days_per_week: value })} size="sq" />
        ))}
      </View>

      <FieldHeader label="Session length" value={duration ? labelFor(WORKOUT_DURATION_OPTIONS, duration) : null} />
      <View style={[fieldStyles.chipRow, { gap: 6 }]}>
        {WORKOUT_DURATION_OPTIONS.map((option) => (
          <Chip
            key={option.value}
            // The row already says "min" on the right, so the chips drop it.
            label={option.label.replace(' min', '')}
            selected={duration === option.value}
            onPress={() => onChange({ workout_duration_minutes: option.value })}
            size="sm"
          />
        ))}
      </View>

      <FieldLabel style={{ marginTop: 20, marginBottom: 8 }}>Split Focus</FieldLabel>
      <View style={fieldStyles.chipRow}>
        {SPLIT_FOCUS_OPTIONS.map((option) => (
          <Chip
            key={option.value}
            label={option.label}
            selected={focusOption.value === option.value}
            onPress={() => onChange({ split_focus: option.value })}
            size="lg"
          />
        ))}
      </View>
      <Text style={[styles.focusHint, { color: colors.textSecondary }]}>{focusOption.description}</Text>

      {summary && complete && (
        <View style={[styles.summary, { backgroundColor: colors.bgSurface }]}>
          <SectionLabel tone="muted" style={{ marginBottom: 6 }}>Your plan will be</SectionLabel>
          <Text style={[styles.summaryText, { color: colors.textPrimary }]}>
            {labelFor(FITNESS_GOAL_OPTIONS, draft.fitness_goal)}
            {` · ${labelFor(TRAINING_DAYS_OPTIONS, days)} a week`}
            {` · ${labelFor(WORKOUT_DURATION_OPTIONS, duration)} sessions`}
            {` · ${labelFor(TRAINING_EXPERIENCE_OPTIONS, experience).toLowerCase()} loads`}
            {` · ${focusOption.label.toLowerCase()} split`}
          </Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  focusHint: { fontSize: 13, marginTop: 8 },
  summary: { marginTop: 24, padding: 16, borderRadius: RADIUS.row },
  summaryText: { fontSize: 16, fontWeight: '700', lineHeight: 23 },
})
