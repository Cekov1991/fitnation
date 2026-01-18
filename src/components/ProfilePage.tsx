import { useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { IonPage, IonContent, IonInput } from '@ionic/react';
import { User, Mail, Target, Calendar, Ruler, Weight, Dumbbell, Clock, LogOut, ChevronDown } from 'lucide-react';
import { useProfile, useUpdateProfile } from '../hooks/useApi';
import { BackgroundGradients } from './BackgroundGradients';
import { profileSchema, ProfileFormData } from '../schemas/profile';

interface ProfilePageProps {
  onLogout: () => void;
}

export function ProfilePage({ onLogout }: ProfilePageProps) {
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
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
    <IonPage>
      <IonContent>
        <div 
          className="min-h-screen w-full pb-32"
          style={{ backgroundColor: 'var(--color-bg-base)', color: 'var(--color-text-primary)' }}
        >
          <BackgroundGradients />

          <main className="relative z-10 max-w-md mx-auto px-6 pt-8">
            {/* Header */}
            <motion.div 
              initial={{ opacity: 0, y: -20 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="mb-8"
            >
              <h1 
                className="text-3xl font-bold bg-clip-text text-transparent"
                style={{ backgroundImage: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))' }}
              >
                Profile
              </h1>
            </motion.div>

            <form onSubmit={handleSubmit(onSubmit)}>
              {/* Account Information */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: 0.1 }} 
                className="mb-8"
              >
                <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                  Account Information
                </h2>
                <div className="space-y-3">
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
              </motion.div>

              {/* Fitness Profile */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: 0.2 }} 
                className="mb-8"
              >
                <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>Fitness Profile</h2>
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
              </motion.div>

              {/* Personal Information */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: 0.3 }} 
                className="mb-8"
              >
                <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                  Personal Information
                </h2>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs mb-2 block" style={{ color: 'var(--color-text-secondary)' }}>Age</label>
                    <div 
                      className="relative flex items-center w-full pl-12 pr-4 py-4 border rounded-xl focus-within:ring-2 transition-all"
                      style={{ 
                        backgroundColor: 'var(--color-bg-surface)',
                        borderColor: errors.age ? '#f87171' : 'var(--color-border)',
                        color: 'var(--color-text-primary)'
                      }}
                    >
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--color-text-muted)' }} />
                      <Controller
                        name="age"
                        control={control}
                        render={({ field }) => (
                          <IonInput 
                            type="number" 
                            inputmode="numeric" 
                            pattern="[0-9]*" 
                            value={field.value?.toString() || ''} 
                            onIonInput={e => {
                              const val = e.detail.value;
                              field.onChange(val ? parseInt(val, 10) || null : null);
                            }} 
                          />
                        )}
                      />
                    </div>
                    {errors.age && <p className="text-xs text-red-400 mt-1">{errors.age.message}</p>}
                  </div>
                  <div>
                    <label className="text-xs mb-2 block" style={{ color: 'var(--color-text-secondary)' }}>Sex</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 z-10" style={{ color: 'var(--color-text-muted)' }} />
                      <select 
                        {...register('gender')}
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
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Prefer not to say</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none" style={{ color: 'var(--color-text-muted)' }} />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs mb-2 block" style={{ color: 'var(--color-text-secondary)' }}>
                      Height (cm)
                    </label>
                    <div 
                      className="relative flex items-center w-full pl-12 pr-4 py-4 border rounded-xl focus-within:ring-2 transition-all"
                      style={{ 
                        backgroundColor: 'var(--color-bg-surface)',
                        borderColor: errors.height ? '#f87171' : 'var(--color-border)',
                        color: 'var(--color-text-primary)'
                      }}
                    >
                      <Ruler className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--color-text-muted)' }} />
                      <Controller
                        name="height"
                        control={control}
                        render={({ field }) => (
                          <IonInput 
                            type="number" 
                            inputmode="numeric" 
                            pattern="[0-9]*" 
                            value={field.value?.toString() || ''} 
                            onIonInput={e => {
                              const val = e.detail.value;
                              field.onChange(val ? parseInt(val, 10) || null : null);
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
                    <div 
                      className="relative flex items-center w-full pl-12 pr-4 py-4 border rounded-xl focus-within:ring-2 transition-all"
                      style={{ 
                        backgroundColor: 'var(--color-bg-surface)',
                        borderColor: errors.weight ? '#f87171' : 'var(--color-border)',
                        color: 'var(--color-text-primary)'
                      }}
                    >
                      <Weight className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--color-text-muted)' }} />
                      <Controller
                        name="weight"
                        control={control}
                        render={({ field }) => (
                          <IonInput 
                            type="number" 
                            inputmode="numeric" 
                            pattern="[0-9]*" 
                            value={field.value !== null && field.value !== undefined ? Math.round(field.value).toString() : ''} 
                            onIonInput={e => {
                              const val = e.detail.value;
                              if (!val || val.trim() === '') {
                                field.onChange(null);
                              } else {
                                const num = parseInt(val, 10);
                                field.onChange(isNaN(num) ? null : num);
                              }
                            }} 
                          />
                        )}
                      />
                    </div>
                    {errors.weight && <p className="text-xs text-red-400 mt-1">{errors.weight.message}</p>}
                  </div>
                </div>
              </motion.div>

              {/* Training Information */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: 0.4 }} 
                className="mb-8"
              >
                <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--color-text-primary)' }}>
                  Training Information
                </h2>
                <div className="space-y-3">
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
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none" style={{ color: 'var(--color-text-muted)' }} />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs mb-2 block" style={{ color: 'var(--color-text-secondary)' }}>
                      Training Days Per Week
                    </label>
                    <div 
                      className="relative flex items-center w-full pl-12 pr-4 py-4 border rounded-xl focus-within:ring-2 transition-all"
                      style={{ 
                        backgroundColor: 'var(--color-bg-surface)',
                        borderColor: errors.training_days_per_week ? '#f87171' : 'var(--color-border)',
                        color: 'var(--color-text-primary)'
                      }}
                    >
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--color-text-muted)' }} />
                      <Controller
                        name="training_days_per_week"
                        control={control}
                        render={({ field }) => (
                          <IonInput 
                            type="number" 
                            inputmode="numeric" 
                            pattern="[0-9]*" 
                            min="1" 
                            max="7" 
                            value={field.value?.toString() || ''} 
                            onIonInput={e => {
                              const val = e.detail.value;
                              field.onChange(val ? parseInt(val, 10) || null : null);
                            }} 
                          />
                        )}
                      />
                    </div>
                    {errors.training_days_per_week && <p className="text-xs text-red-400 mt-1">{errors.training_days_per_week.message}</p>}
                  </div>
                  <div>
                    <label className="text-xs mb-2 block" style={{ color: 'var(--color-text-secondary)' }}>
                      Workout Duration (minutes)
                    </label>
                    <div 
                      className="relative flex items-center w-full pl-12 pr-4 py-4 border rounded-xl focus-within:ring-2 transition-all"
                      style={{ 
                        backgroundColor: 'var(--color-bg-surface)',
                        borderColor: errors.workout_duration_minutes ? '#f87171' : 'var(--color-border)',
                        color: 'var(--color-text-primary)'
                      }}
                    >
                      <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--color-text-muted)' }} />
                      <Controller
                        name="workout_duration_minutes"
                        control={control}
                        render={({ field }) => (
                          <IonInput 
                            type="number" 
                            inputmode="numeric" 
                            pattern="[0-9]*" 
                            value={field.value?.toString() || ''} 
                            onIonInput={e => {
                              const val = e.detail.value;
                              field.onChange(val ? parseInt(val, 10) || null : null);
                            }} 
                          />
                        )}
                      />
                    </div>
                    {errors.workout_duration_minutes && <p className="text-xs text-red-400 mt-1">{errors.workout_duration_minutes.message}</p>}
                  </div>
                </div>
              </motion.div>

              {/* Save Changes Button */}
              <motion.button 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: 0.5 }} 
                whileHover={{ scale: isDirty ? 1.02 : 1 }} 
                whileTap={{ scale: isDirty ? 0.98 : 1 }} 
                type="submit"
                disabled={isLoading || isSubmitting || !isDirty}
                className="w-full py-4 rounded-2xl font-bold text-lg shadow-lg transition-shadow mb-4 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  background: isDirty 
                    ? 'linear-gradient(to right, var(--color-primary), color-mix(in srgb, var(--color-primary) 80%, transparent))'
                    : 'var(--color-bg-elevated)',
                  boxShadow: isDirty ? '0 10px 25px color-mix(in srgb, var(--color-primary) 25%, transparent)' : 'none'
                }}
              >
                {isSubmitting ? 'SAVING...' : 'SAVE CHANGES'}
              </motion.button>
            </form>

            {/* Log Out Button */}
            <motion.button 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: 0.6 }} 
              whileHover={{ scale: 1.02 }} 
              whileTap={{ scale: 0.98 }} 
              onClick={onLogout} 
              className="w-full py-4 bg-transparent border-2 border-red-500/30 rounded-2xl font-bold text-lg text-red-400 hover:bg-red-500/10 hover:border-red-500/50 transition-all mb-8 flex items-center justify-center gap-2"
            >
              <LogOut className="w-5 h-5" />
              LOG OUT
            </motion.button>
          </main>
        </div>
      </IonContent>
    </IonPage>
  );
}
