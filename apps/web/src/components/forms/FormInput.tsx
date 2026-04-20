import { UseFormRegisterReturn } from 'react-hook-form';
import { LucideIcon } from 'lucide-react';

interface FormInputProps {
  label: string;
  icon?: LucideIcon;
  error?: string;
  registration: UseFormRegisterReturn;
  type?: 'text' | 'email' | 'number' | 'password';
  placeholder?: string;
  className?: string;
}

export function FormInput({
  label,
  icon: Icon,
  error,
  registration,
  type = 'text',
  placeholder,
  className = '',
}: FormInputProps) {
  return (
    <div className={className}>
      <label className="text-xs mb-2 block" style={{ color: 'var(--color-text-secondary)' }}>
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon 
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" 
            style={{ color: 'var(--color-text-muted)' }} 
          />
        )}
        <input
          {...registration}
          type={type}
          placeholder={placeholder}
          className={`w-full ${Icon ? 'pl-12' : 'pl-4'} pr-4 py-4 border rounded-xl focus:outline-none focus:ring-2 transition-all`}
          style={{
            backgroundColor: 'var(--color-bg-surface)',
            borderColor: error ? '#f87171' : 'var(--color-border)',
            color: 'var(--color-text-primary)',
          }}
          onFocus={(e) => {
            if (!error) {
              e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--color-primary) 50%, transparent)';
            }
          }}
          onBlur={(e) => {
            if (!error) {
              e.currentTarget.style.borderColor = 'var(--color-border)';
            }
          }}
        />
      </div>
      {error && (
        <p className="text-xs text-red-400 mt-1">{error}</p>
      )}
    </div>
  );
}
