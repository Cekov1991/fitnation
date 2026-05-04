import { Controller } from 'react-hook-form'
import type { Control, FieldValues, Path } from 'react-hook-form'
import { Input } from './Input'

interface FormFieldProps<T extends FieldValues> {
  control: Control<T>
  name: Path<T>
  label: string
  placeholder?: string
  multiline?: boolean
  error?: string
}

export function FormField<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  multiline,
  error,
}: FormFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value } }) => (
        <Input
          label={label}
          value={value ?? ''}
          onChangeText={onChange}
          placeholder={placeholder}
          multiline={multiline}
          numberOfLines={multiline ? 4 : 1}
          textAlignVertical={multiline ? 'top' : undefined}
          error={error}
          style={multiline ? { minHeight: 100 } : undefined}
        />
      )}
    />
  )
}
