import { motion } from 'framer-motion';
import { User, Mail, Calendar, Ruler, Weight, ArrowRight, ArrowLeft, ChevronDown } from 'lucide-react';
import { UseFormRegister, FieldErrors, Control, Controller } from 'react-hook-form';
import { useAuth } from '../../hooks/useAuth';
import { useSlideTransition } from '../../utils/animations';
import { OnboardingFormData } from '../../schemas/onboarding';

interface PersonalInfoStepProps {
  register: UseFormRegister<OnboardingFormData>;
  errors: FieldErrors<OnboardingFormData>;
  control: Control<OnboardingFormData>;
  onNext: () => void;
  onBack: () => void;
  isValid: boolean;
}

export function PersonalInfoStep({
  errors,
  control,
  onNext,
  onBack,
  isValid,
}: PersonalInfoStepProps) {
  const { user } = useAuth();
  const slideProps = useSlideTransition('up');

  return (
    <div className="flex flex-col h-full">
      <motion.div {...slideProps} className="mb-6">
        <h2 
          className="text-2xl font-bold mb-2"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Personal Details
        </h2>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Tell us a bit about yourself so we can tailor your experience.
        </p>
      </motion.div>

      <div className="flex-1 overflow-y-auto -mx-4 px-4 pb-4">
        <div className="space-y-5">
          {/* Read-only Name */}
          <div>
            <label 
              className="text-xs mb-2 block"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Full Name
            </label>
            <div className="relative">
              <User 
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" 
                style={{ color: 'var(--color-text-muted)' }} 
              />
              <input
                type="text"
                value={user?.name || ''}
                readOnly
                className="w-full pl-12 pr-4 py-4 border rounded-xl focus:outline-none transition-all cursor-not-allowed opacity-75"
                style={{
                  backgroundColor: 'var(--color-bg-surface)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)'
                }}
              />
            </div>
          </div>

          {/* Read-only Email */}
          <div>
            <label 
              className="text-xs mb-2 block"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Email Address
            </label>
            <div className="relative">
              <Mail 
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" 
                style={{ color: 'var(--color-text-muted)' }} 
              />
              <input
                type="email"
                value={user?.email || ''}
                readOnly
                className="w-full pl-12 pr-4 py-4 border rounded-xl focus:outline-none transition-all cursor-not-allowed opacity-75"
                style={{
                  backgroundColor: 'var(--color-bg-surface)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)'
                }}
              />
            </div>
          </div>

          {/* Age and Gender */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label 
                className="text-xs mb-2 block"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Age
              </label>
              <div className="relative">
                <Calendar 
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" 
                  style={{ color: 'var(--color-text-muted)' }} 
                />
                <Controller
                  name="age"
                  control={control}
                  render={({ field }) => (
                    <input
                      type="number"
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                      placeholder="25"
                      className="w-full pl-12 pr-4 py-4 border rounded-xl focus:outline-none focus:ring-2 transition-all"
                      style={{
                        backgroundColor: 'var(--color-bg-surface)',
                        borderColor: errors.age ? '#f87171' : 'var(--color-border)',
                        color: 'var(--color-text-primary)'
                      }}
                      onFocus={(e) => {
                        if (!errors.age) {
                          e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--color-primary) 50%, transparent)';
                        }
                      }}
                      onBlur={(e) => {
                        if (!errors.age) {
                          e.currentTarget.style.borderColor = 'var(--color-border)';
                        }
                      }}
                    />
                  )}
                />
              </div>
              {errors.age && <p className="text-xs text-red-400 mt-1">{errors.age.message}</p>}
            </div>

            <div>
              <label 
                className="text-xs mb-2 block"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Gender
              </label>
              <div className="relative">
                <User 
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 z-10" 
                  style={{ color: 'var(--color-text-muted)' }} 
                />
                <Controller
                  name="gender"
                  control={control}
                  render={({ field }) => (
                    <select
                      value={field.value}
                      onChange={field.onChange}
                      className="w-full pl-12 pr-10 py-4 border rounded-xl appearance-none focus:outline-none focus:ring-2 transition-all cursor-pointer"
                      style={{
                        backgroundColor: 'var(--color-bg-surface)',
                        borderColor: errors.gender ? '#f87171' : 'var(--color-border)',
                        color: 'var(--color-text-primary)',
                      }}
                      onFocus={(e) => {
                        if (!errors.gender) {
                          e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--color-primary) 50%, transparent)';
                        }
                      }}
                      onBlur={(e) => {
                        if (!errors.gender) {
                          e.currentTarget.style.borderColor = 'var(--color-border)';
                        }
                      }}
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Prefer not to say</option>
                    </select>
                  )}
                />
                <ChevronDown 
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none" 
                  style={{ color: 'var(--color-text-muted)' }} 
                />
              </div>
              {errors.gender && <p className="text-xs text-red-400 mt-1">{errors.gender.message}</p>}
            </div>
          </div>

          {/* Height and Weight */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label 
                className="text-xs mb-2 block"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Height (cm)
              </label>
              <div className="relative">
                <Ruler 
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" 
                  style={{ color: 'var(--color-text-muted)' }} 
                />
                <Controller
                  name="height"
                  control={control}
                  render={({ field }) => (
                    <input
                      type="number"
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                      placeholder="175"
                      className="w-full pl-12 pr-4 py-4 border rounded-xl focus:outline-none focus:ring-2 transition-all"
                      style={{
                        backgroundColor: 'var(--color-bg-surface)',
                        borderColor: errors.height ? '#f87171' : 'var(--color-border)',
                        color: 'var(--color-text-primary)'
                      }}
                      onFocus={(e) => {
                        if (!errors.height) {
                          e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--color-primary) 50%, transparent)';
                        }
                      }}
                      onBlur={(e) => {
                        if (!errors.height) {
                          e.currentTarget.style.borderColor = 'var(--color-border)';
                        }
                      }}
                    />
                  )}
                />
              </div>
              {errors.height && <p className="text-xs text-red-400 mt-1">{errors.height.message}</p>}
            </div>

            <div>
              <label 
                className="text-xs mb-2 block"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Weight (kg)
              </label>
              <div className="relative">
                <Weight 
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" 
                  style={{ color: 'var(--color-text-muted)' }} 
                />
                <Controller
                  name="weight"
                  control={control}
                  render={({ field }) => (
                    <input
                      type="number"
                      value={field.value || ''}
                      onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                      placeholder="70"
                      className="w-full pl-12 pr-4 py-4 border rounded-xl focus:outline-none focus:ring-2 transition-all"
                      style={{
                        backgroundColor: 'var(--color-bg-surface)',
                        borderColor: errors.weight ? '#f87171' : 'var(--color-border)',
                        color: 'var(--color-text-primary)'
                      }}
                      onFocus={(e) => {
                        if (!errors.weight) {
                          e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--color-primary) 50%, transparent)';
                        }
                      }}
                      onBlur={(e) => {
                        if (!errors.weight) {
                          e.currentTarget.style.borderColor = 'var(--color-border)';
                        }
                      }}
                    />
                  )}
                />
              </div>
              {errors.weight && <p className="text-xs text-red-400 mt-1">{errors.weight.message}</p>}
            </div>
          </div>
        </div>
      </div>

      <div className="pt-4 mt-auto flex gap-3">
        <button
          onClick={onBack}
          className="w-1/3 py-4 border-2 rounded-xl font-semibold transition-all"
          style={{
            borderColor: 'var(--color-border)',
            color: 'var(--color-text-primary)',
            backgroundColor: 'transparent',
          }}
        >
          <ArrowLeft className="w-5 h-5 mx-auto" />
        </button>
        <button
          onClick={onNext}
          disabled={!isValid}
          className="w-2/3 py-4 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: `linear-gradient(to right, var(--color-primary), var(--color-secondary))`,
            color: 'white',
          }}
        >
          <span className="flex items-center justify-center">
            Continue
            <ArrowRight className="ml-2 w-5 h-5" />
          </span>
        </button>
      </div>
    </div>
  );
}
