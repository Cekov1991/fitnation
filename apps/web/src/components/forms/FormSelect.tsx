import { UseFormRegisterReturn } from 'react-hook-form';
import { LucideIcon, ChevronDown } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface FormSelectProps {
  label: string;
  icon?: LucideIcon;
  error?: string;
  registration: UseFormRegisterReturn;
  options: Option[];
  className?: string;
}

export function FormSelect({
  label,
  icon: Icon,
  error,
  registration,
  options,
  className = '',
}: FormSelectProps) {
  return (
    <div className={className}>
      <label className="text-xs mb-2 block" style={{ color: 'var(--color-text-secondary)' }}>
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon 
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 z-10" 
            style={{ color: 'var(--color-text-muted)' }} 
          />
        )}
        <select
          {...registration}
          className={`w-full ${Icon ? 'pl-12' : 'pl-4'} pr-12 py-4 border rounded-xl appearance-none focus:outline-none focus:ring-2 transition-all cursor-pointer`}
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
        >
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown 
          className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none" 
          style={{ color: 'var(--color-text-muted)' }} 
        />
      </div>
      {error && (
        <p className="text-xs text-red-400 mt-1">{error}</p>
      )}
    </div>
  );
}
