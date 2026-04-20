import { IonInput } from '@ionic/react';
import { LucideIcon } from 'lucide-react';
import { Controller, Control, FieldPath, FieldValues } from 'react-hook-form';

interface FormNumberInputProps<T extends FieldValues> {
  label: string;
  icon?: LucideIcon;
  error?: string;
  name: FieldPath<T>;
  control: Control<T>;
  placeholder?: string;
  className?: string;
  inputMode?: 'numeric' | 'decimal';
  min?: number;
  max?: number;
}

export function FormNumberInput<T extends FieldValues>({
  label,
  icon: Icon,
  error,
  name,
  control,
  placeholder,
  className = '',
  inputMode = 'numeric',
  min,
  max,
}: FormNumberInputProps<T>) {
  return (
    <div className={className}>
      <label className="text-xs mb-2 block" style={{ color: 'var(--color-text-secondary)' }}>
        {label}
      </label>
      <div 
        className="relative flex items-center w-full pl-12 pr-4 py-4 border rounded-xl focus-within:ring-2 transition-all"
        style={{ 
          backgroundColor: 'var(--color-bg-surface)',
          borderColor: error ? '#f87171' : 'var(--color-border)',
          color: 'var(--color-text-primary)'
        }}
      >
        {Icon && (
          <Icon 
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" 
            style={{ color: 'var(--color-text-muted)' }} 
          />
        )}
        <Controller
          name={name}
          control={control}
          render={({ field }) => (
            <IonInput
              type="number"
              inputmode={inputMode}
              pattern={inputMode === 'decimal' ? '[0-9.]*' : '[0-9]*'}
              step={inputMode === 'decimal' ? '0.01' : undefined}
              min={min}
              max={max}
              placeholder={placeholder}
              value={field.value?.toString() || ''}
              onIonInput={(e) => {
                const value = e.detail.value;
                if (value === '' || value === null || value === undefined) {
                  field.onChange(null);
                } else {
                  const parsed = inputMode === 'decimal' 
                    ? parseFloat(value) 
                    : parseInt(value, 10);
                  field.onChange(isNaN(parsed) ? null : parsed);
                }
              }}
            />
          )}
        />
      </div>
      {error && (
        <p className="text-xs text-red-400 mt-1">{error}</p>
      )}
    </div>
  );
}
