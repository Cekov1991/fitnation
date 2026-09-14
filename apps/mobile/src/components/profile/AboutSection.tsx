import { useState } from 'react'
import { View } from 'react-native'
import { heightUnitLabel, weightUnitLabel, parseDecimalText, sanitizeDecimalText } from '@fit-nation/shared'
import type { UnitSystem } from '@fit-nation/shared'
import { Chip, FieldError, FieldLabel, NumberField, UnitSwitch, fieldStyles } from './fields'
import type { ProfileDraft, SectionErrors } from './profileSections'

const GENDERS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
] as const

interface AboutSectionProps {
  draft: ProfileDraft
  onChange: (patch: ProfileDraft) => void
  errors?: SectionErrors
}

/**
 * "A bit about you" — units, age, height, weight, gender. Headline is the shell's.
 *
 * Height and weight are typed in the unit shown and sent with `unit_system` in
 * the same request; the API converts. Weight is held as raw text so a
 * half-pound ("154.5") survives typing. Units come first in the layout because
 * they decide what the numbers mean.
 */
export function AboutSection({ draft, onChange, errors = {} }: AboutSectionProps) {
  const unitSystem: UnitSystem = draft.unit_system ?? 'metric'
  const [weightText, setWeightText] = useState(() => (draft.weight != null ? String(draft.weight) : ''))

  // A shell that re-seeds the draft (the profile page after a unit change)
  // hands back a new weight; mirror it unless the person is mid-keystroke on
  // the same value.
  const draftWeight = draft.weight != null ? String(draft.weight) : ''
  const [seenWeight, setSeenWeight] = useState(draftWeight)
  if (draftWeight !== seenWeight) {
    setSeenWeight(draftWeight)
    if (parseDecimalText(weightText) !== draft.weight) setWeightText(draftWeight)
  }

  function handleWeightChange(raw: string) {
    const text = sanitizeDecimalText(raw)
    setWeightText(text)
    onChange({ weight: parseDecimalText(text) ?? undefined })
  }

  return (
    <View>
      <UnitSwitch value={unitSystem} onChange={(unit_system) => onChange({ unit_system })} />

      <View style={fieldStyles.numberRow}>
        <NumberField
          label="Age"
          value={draft.age?.toString() ?? ''}
          onChangeText={(v) => onChange({ age: parseInt(v) || undefined })}
          placeholder="25"
          keyboardType="numeric"
          error={errors.age}
        />
        <NumberField
          label="Height"
          suffix={heightUnitLabel(unitSystem)}
          value={draft.height?.toString() ?? ''}
          onChangeText={(v) => onChange({ height: parseInt(v) || undefined })}
          placeholder={unitSystem === 'imperial' ? '69' : '175'}
          keyboardType="numeric"
          error={errors.height}
        />
        <NumberField
          label="Weight"
          suffix={weightUnitLabel(unitSystem)}
          value={weightText}
          onChangeText={handleWeightChange}
          placeholder={unitSystem === 'imperial' ? '154' : '70'}
          keyboardType="decimal-pad"
          error={errors.weight}
        />
      </View>

      <FieldLabel style={{ marginBottom: 8 }}>Gender</FieldLabel>
      <View style={fieldStyles.chipRow}>
        {GENDERS.map((g) => (
          <Chip key={g.value} label={g.label} selected={draft.gender === g.value} onPress={() => onChange({ gender: g.value })} size="lg" />
        ))}
      </View>
      <FieldError message={errors.gender} />
    </View>
  )
}
