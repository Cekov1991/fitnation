import { View } from 'react-native'
import { TextField } from './fields'
import type { ProfileDraft, SectionErrors } from './profileSections'

interface AccountSectionProps {
  draft: ProfileDraft
  onChange: (patch: ProfileDraft) => void
  errors?: SectionErrors
}

/** "Your account" — name and sign-in email. Headline is the shell's. */
export function AccountSection({ draft, onChange, errors = {} }: AccountSectionProps) {
  return (
    <View>
      <TextField
        label="Full Name"
        value={draft.name ?? ''}
        onChangeText={(name) => onChange({ name })}
        placeholder="Your name"
        autoCapitalize="words"
        autoComplete="name"
        error={errors.name}
      />
      <TextField
        label="Email Address"
        value={draft.email ?? ''}
        onChangeText={(email) => onChange({ email: email.trim() })}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        error={errors.email}
      />
    </View>
  )
}
