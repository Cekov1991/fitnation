import { useEffect, useMemo, useState, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { User, Mail, Target, Calendar, Ruler, Weight, Dumbbell, LogOut, ChevronDown, Download, Trash2, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { useProfile, useUpdateProfile, useDeleteAccount } from '@fit-nation/shared';
import { useInstallPrompt } from '../hooks/useInstallPrompt';
import { profileSchema, ProfileFormData } from '@fit-nation/shared';
import { LoadingButton } from './ui';
import { ProfilePageSkeleton } from './ProfilePageSkeleton';

// Duration options: label -> backend value (always the higher amount)
const DURATION_OPTIONS = [
  { label: '20-30 min', value: 30 },
  { label: '30-45 min', value: 45 },
  { label: '45-60 min', value: 60 },
  { label: '60-90 min', value: 90 },
  { label: '90+ min', value: 120 },
];

interface ProfilePageProps {
  onLogout: () => void;
}

export function ProfilePage({ onLogout }: ProfilePageProps) {
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const deleteAccount = useDeleteAccount();
  const { isIOSSafari, setShowIOSOverlay } = useInstallPrompt();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deletePasswordVisible, setDeletePasswordVisible] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const deletePasswordRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema) as any,
    mode: 'onBlur',
    defaultValues: {
      name: '',
      email: '',
      fitness_goal: 'general_fitness',
      gender: 'other',
      training_experience: 'beginner',
      age: null,
      height: null,
      weight: null,
      training_days_per_week: null,
      workout_duration_minutes: null,
    },
  });

  const formData = watch();

  // Initialize form when profile loads
  useEffect(() => {
    if (profile) {
      reset({
        name: profile.name || '',
        email: profile.email || '',
        fitness_goal: profile.profile?.fitness_goal || 'general_fitness',
        age: profile.profile?.age || null,
        gender: profile.profile?.gender || 'other',
        height: profile.profile?.height || null,
        weight: profile.profile?.weight ? Math.round(profile.profile.weight) : null,
        training_experience: profile.profile?.training_experience || 'beginner',
        training_days_per_week: profile.profile?.training_days_per_week || null,
        workout_duration_minutes: profile.profile?.workout_duration_minutes || null,
      });
    }
  }, [profile, reset]);

  const goalOptions = useMemo(() => [
    { value: 'fat_loss', label: 'Fat Loss' },
    { value: 'muscle_gain', label: 'Muscle Gain' },
    { value: 'strength', label: 'Strength' },
    { value: 'general_fitness', label: 'General Fitness' },
  ], []);

  if (isLoading) {
    return (
      <div>
        <div>
          <div
            className="min-h-screen w-full pb-32"
            style={{ backgroundColor: 'var(--color-bg-base)', color: 'var(--color-text-primary)' }}
          >
            <main className="relative z-10 max-w-md mx-auto px-4 py-8">
              <ProfilePageSkeleton />
            </main>
          </div>
        </div>
      </div>
    );
  }

  const openDeleteModal = () => {
    setDeletePassword('');
    setDeletePasswordVisible(false);
    setDeleteError(null);
    setDeleteModalOpen(true);
    setTimeout(() => deletePasswordRef.current?.focus(), 50);
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      setDeleteError('Please enter your password.');
      return;
    }
    setDeleteError(null);
    try {
      await deleteAccount.mutateAsync(deletePassword);
      onLogout();
    } catch (err: any) {
      const msg =
        err?.errors?.password?.[0] ||
        err?.message ||
        'Incorrect password. Please try again.';
      setDeleteError(msg);
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    await updateProfile.mutateAsync({
      name: data.name,
      email: data.email,
      fitness_goal: data.fitness_goal,
      age: data.age ?? undefined,
      gender: data.gender,
      height: data.height ?? undefined,
      weight: data.weight ? Math.round(data.weight) : undefined,
      training_experience: data.training_experience,
      training_days_per_week: data.training_days_per_week ?? undefined,
      workout_duration_minutes: data.workout_duration_minutes ?? undefined,
    });
  };

  return (
    <div>
      <div>
        <div 
          className="min-h-screen w-full pb-32"
          style={{ backgroundColor: 'var(--color-bg-base)', color: 'var(--color-text-primary)' }}
        >

          <main className="relative z-10 max-w-md mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-8">
              <h1 
                className="text-3xl font-bold bg-clip-text text-transparent"
                style={{ backgroundImage: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))' }}
              >
                Profile
              </h1>
            </div>

            <form onSubmit={handleSubmit(onSubmit)}>
              {/* Account Information */}
              <div className="mb-8">
                <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                  Account Information
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs mb-2 block" style={{ color: 'var(--color-text-secondary)' }}>
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--color-text-muted)' }} />
                      <input 
                        type="text" 
                        {...register('name')}
                        className="w-full pl-12 pr-4 py-4 border rounded-xl focus:outline-none focus:ring-2 transition-all"
                        style={{ 
                          backgroundColor: 'var(--color-bg-surface)',
                          borderColor: errors.name ? '#f87171' : 'var(--color-border)',
                          color: 'var(--color-text-primary)'
                        }} 
                        onFocus={(e) => {
                          if (!errors.name) {
                            e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--color-primary) 50%, transparent)';
                          }
                        }}
                        onBlur={(e) => {
                          if (!errors.name) {
                            e.currentTarget.style.borderColor = 'var(--color-border)';
                          }
                        }}
                      />
                    </div>
                    {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name.message}</p>}
                  </div>
                  <div>
                    <label className="text-xs mb-2 block" style={{ color: 'var(--color-text-secondary)' }}>
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--color-text-muted)' }} />
                      <input 
                        type="email" 
                        {...register('email')}
                        className="w-full pl-12 pr-4 py-4 border rounded-xl focus:outline-none focus:ring-2 transition-all"
                        style={{ 
                          backgroundColor: 'var(--color-bg-surface)',
                          borderColor: errors.email ? '#f87171' : 'var(--color-border)',
                          color: 'var(--color-text-primary)'
                        }} 
                        onFocus={(e) => {
                          if (!errors.email) {
                            e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--color-primary) 50%, transparent)';
                          }
                        }}
                        onBlur={(e) => {
                          if (!errors.email) {
                            e.currentTarget.style.borderColor = 'var(--color-border)';
                          }
                        }}
                      />
                    </div>
                    {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email.message}</p>}
                  </div>
                </div>
              </div>

              {/* Personal Information - Grid Layout */}
              <div className="mb-8">
                <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                  Personal Information
                </h2>
                <div className="space-y-4">
                  {/* Age and Gender - Side by Side */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs mb-2 block" style={{ color: 'var(--color-text-secondary)' }}>
                        Age
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--color-text-muted)' }} />
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
                      <label className="text-xs mb-2 block" style={{ color: 'var(--color-text-secondary)' }}>
                        Gender
                      </label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 z-10" style={{ color: 'var(--color-text-muted)' }} />
                        <select 
                          {...register('gender')}
                          className="w-full pl-12 pr-10 py-4 border rounded-xl appearance-none focus:outline-none focus:ring-2 transition-all cursor-pointer"
                          style={{ 
                            backgroundColor: 'var(--color-bg-surface)',
                            borderColor: 'var(--color-border)',
                            color: 'var(--color-text-primary)'
                          }}
                          onFocus={(e) => {
                            e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--color-primary) 50%, transparent)';
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.borderColor = 'var(--color-border)';
                          }}
                        >
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Prefer not to say</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none" style={{ color: 'var(--color-text-muted)' }} />
                      </div>
                    </div>
                  </div>

                  {/* Height and Weight - Side by Side */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs mb-2 block" style={{ color: 'var(--color-text-secondary)' }}>
                        Height (cm)
                      </label>
                      <div className="relative">
                        <Ruler className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--color-text-muted)' }} />
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
                      <label className="text-xs mb-2 block" style={{ color: 'var(--color-text-secondary)' }}>
                        Weight (kg)
                      </label>
                      <div className="relative">
                        <Weight className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--color-text-muted)' }} />
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

              {/* Fitness Profile */}
              <div className="mb-8">
                <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>Fitness Profile</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs mb-2 block" style={{ color: 'var(--color-text-secondary)' }}>
                      Physical Goal
                    </label>
                    <div className="relative">
                      <Target className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 z-10" style={{ color: 'var(--color-text-muted)' }} />
                      <select 
                        {...register('fitness_goal')}
                        className="w-full pl-12 pr-12 py-4 border rounded-xl appearance-none focus:outline-none focus:ring-2 transition-all cursor-pointer"
                        style={{ 
                          backgroundColor: 'var(--color-bg-surface)',
                          borderColor: 'var(--color-border)',
                          color: 'var(--color-text-primary)'
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--color-primary) 50%, transparent)';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = 'var(--color-border)';
                        }}
                      >
                        {goalOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none" style={{ color: 'var(--color-text-muted)' }} />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs mb-2 block" style={{ color: 'var(--color-text-secondary)' }}>
                      Experience Level
                    </label>
                    <div className="relative">
                      <Dumbbell className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 z-10" style={{ color: 'var(--color-text-muted)' }} />
                      <select 
                        {...register('training_experience')}
                        className="w-full pl-12 pr-12 py-4 border rounded-xl appearance-none focus:outline-none focus:ring-2 transition-all cursor-pointer"
                        style={{ 
                          backgroundColor: 'var(--color-bg-surface)',
                          borderColor: 'var(--color-border)',
                          color: 'var(--color-text-primary)'
                        }}
                        onFocus={(e) => {
                          e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--color-primary) 50%, transparent)';
                        }}
                        onBlur={(e) => {
                          e.currentTarget.style.borderColor = 'var(--color-border)';
                        }}
                      >
                        <option value="beginner">Beginner (0-1 years)</option>
                        <option value="intermediate">Intermediate (1-3 years)</option>
                        <option value="advanced">Advanced (3+ years)</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none" style={{ color: 'var(--color-text-muted)' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Training Schedule */}
              <div className="mb-8">
                <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                  Training Schedule
                </h2>
                <div className="space-y-6">
                  {/* Training Days Per Week - Visual Picker */}
                  <div>
                    <label className="text-xs mb-3 block" style={{ color: 'var(--color-text-secondary)' }}>
                      Training Days Per Week
                    </label>
                    <Controller
                      name="training_days_per_week"
                      control={control}
                      render={({ field }) => (
                        <div className="grid grid-cols-7 gap-2">
                          {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                            <button
                              key={day}
                              type="button"
                              onClick={() => field.onChange(day)}
                              className="aspect-square rounded-xl flex items-center justify-center text-lg font-semibold transition-all"
                              style={{
                                backgroundColor: field.value === day 
                                  ? 'var(--color-primary)' 
                                  : 'var(--color-bg-surface)',
                                color: field.value === day 
                                  ? 'white' 
                                  : 'var(--color-text-secondary)',
                                border: `2px solid ${field.value === day 
                                  ? 'var(--color-primary)' 
                                  : 'var(--color-border)'}`,
                                transform: field.value === day ? 'scale(1.05)' : 'scale(1)',
                              }}
                            >
                              {day}
                            </button>
                          ))}
                        </div>
                      )}
                    />
                    <p 
                      className="text-xs mt-2"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      Select how many days you can commit to training.
                    </p>
                  </div>

                  {/* Workout Duration */}
                  <div>
                    <label className="text-xs mb-2 block" style={{ color: 'var(--color-text-secondary)' }}>
                      Workout Duration
                    </label>
                    <Controller
                      name="workout_duration_minutes"
                      control={control}
                      render={({ field }) => (
                        <div className="flex gap-2 flex-wrap">
                          {DURATION_OPTIONS.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => field.onChange(option.value)}
                              className="px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all"
                              style={{
                                backgroundColor: field.value === option.value
                                  ? 'color-mix(in srgb, var(--color-primary) 20%, transparent)'
                                  : 'var(--color-border-subtle)',
                                color: field.value === option.value
                                  ? 'var(--color-primary)'
                                  : 'var(--color-text-secondary)',
                              }}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      )}
                    />
                    {errors.workout_duration_minutes && <p className="text-xs text-red-400 mt-1">{errors.workout_duration_minutes.message}</p>}
                  </div>
                </div>
              </div>

              {/* Save Changes Button */}
              <LoadingButton
                type="submit"
                isLoading={isSubmitting}
                loadingText="SAVING..."
                disabled={isLoading}
                className="w-full py-4 rounded-2xl font-bold text-lg shadow-lg transition-shadow mb-4 btn-primary"
              >
                SAVE CHANGES
              </LoadingButton>
            </form>

            {isIOSSafari && (
              <button
                type="button"
                onClick={() => setShowIOSOverlay(true)}
                className="w-full py-4 mb-4 rounded-2xl font-bold text-lg border-2 transition-all flex items-center justify-center gap-2"
                style={{
                  borderColor: 'color-mix(in srgb, var(--color-primary) 40%, transparent)',
                  backgroundColor: 'var(--color-bg-surface)',
                  color: 'var(--color-text-primary)',
                }}
              >
                <Download className="w-5 h-5" />
                <span
                  className="bg-clip-text text-transparent"
                  style={{
                    backgroundImage: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))',
                  }}
                >
                  INSTALL APP
                </span>
              </button>
            )}

            {/* Log Out Button */}
            <button 
              onClick={onLogout} 
              className="w-full py-4 bg-transparent border-2 border-red-500/30 rounded-2xl font-bold text-lg text-red-400 hover:bg-red-500/10 hover:border-red-500/50 transition-all mb-4 flex items-center justify-center gap-2"
            >
              <LogOut className="w-5 h-5" />
              LOG OUT
            </button>

            {/* Delete Account Button */}
            <button
              onClick={openDeleteModal}
              className="w-full py-3 bg-transparent border border-red-500/20 rounded-2xl font-semibold text-sm text-red-500/70 hover:bg-red-500/5 hover:border-red-500/40 hover:text-red-400 transition-all mb-8 flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              DELETE ACCOUNT
            </button>
          </main>
        </div>
      </div>

      {/* Delete Account Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <div
            className="w-full max-w-md rounded-3xl p-8 border shadow-2xl"
            style={{ backgroundColor: 'var(--color-bg-surface)', borderColor: 'var(--color-border)' }}
          >
            {/* Icon + heading */}
            <div className="flex flex-col items-center mb-6">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: 'rgba(239,68,68,0.12)' }}>
                <AlertTriangle className="w-7 h-7 text-red-400" />
              </div>
              <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                Delete Account
              </h2>
              <p className="text-sm text-center" style={{ color: 'var(--color-text-secondary)' }}>
                This will permanently delete your account and all training data. This action <strong style={{ color: 'var(--color-text-primary)' }}>cannot be undone</strong>.
              </p>
            </div>

            {/* Password input */}
            <div className="mb-4">
              <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--color-text-secondary)' }}>
                Confirm your password
              </label>
              <div className="relative">
                <input
                  ref={deletePasswordRef}
                  type={deletePasswordVisible ? 'text' : 'password'}
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleDeleteAccount()}
                  placeholder="Enter your password"
                  className="w-full pl-4 pr-12 py-4 border rounded-xl focus:outline-none transition-all"
                  style={{
                    backgroundColor: 'var(--color-bg-elevated)',
                    borderColor: deleteError ? '#f87171' : 'var(--color-border)',
                    color: 'var(--color-text-primary)',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setDeletePasswordVisible(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {deletePasswordVisible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {deleteError && (
                <p className="text-xs text-red-400 mt-1">{deleteError}</p>
              )}
            </div>

            {/* Actions */}
            <button
              onClick={handleDeleteAccount}
              disabled={deleteAccount.isPending}
              className="w-full py-4 rounded-xl font-bold text-white mb-3 transition-opacity disabled:opacity-60"
              style={{ backgroundColor: '#ef4444' }}
            >
              {deleteAccount.isPending ? 'Deleting...' : 'Delete My Account'}
            </button>
            <button
              onClick={() => setDeleteModalOpen(false)}
              disabled={deleteAccount.isPending}
              className="w-full py-3 text-sm font-medium transition-colors"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
