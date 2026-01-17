import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { IonPage, IonContent, IonInput } from '@ionic/react';
import { User, Mail, Target, Calendar, Ruler, Weight, Dumbbell, Clock, LogOut, ChevronDown } from 'lucide-react';
import { useProfile, useUpdateProfile } from '../hooks/useApi';
import type { FitnessGoal, Gender, TrainingExperience } from '../types/api';
interface ProfilePageProps {
  onLogout: () => void;
}
export function ProfilePage({
  onLogout
}: ProfilePageProps) {
  const {
    data: profile,
    isLoading
  } = useProfile();
  const updateProfile = useUpdateProfile();
  const [hasInitialized, setHasInitialized] = useState(false);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [physicalGoal, setPhysicalGoal] = useState<FitnessGoal>('general_fitness');
  const [age, setAge] = useState(0);
  const [sex, setSex] = useState<Gender>('other');
  const [height, setHeight] = useState(0);
  const [weight, setWeight] = useState(0);
  const [experienceLevel, setExperienceLevel] = useState<TrainingExperience>('beginner');
  const [trainingDays, setTrainingDays] = useState(0);
  const [workoutDuration, setWorkoutDuration] = useState(0);

  useEffect(() => {
    if (!profile || hasInitialized) return;
    setFullName(profile.name || '');
    setEmail(profile.email || '');
    setPhysicalGoal(profile.profile?.fitness_goal || 'general_fitness');
    setAge(profile.profile?.age || 0);
    setSex(profile.profile?.gender || 'other');
    setHeight(profile.profile?.height || 0);
    setWeight(profile.profile?.weight || 0);
    setExperienceLevel(profile.profile?.training_experience || 'beginner');
    setTrainingDays(profile.profile?.training_days_per_week || 0);
    setWorkoutDuration(profile.profile?.workout_duration_minutes || 0);
    setHasInitialized(true);
  }, [hasInitialized, profile]);

  const goalOptions = useMemo(() => [{
    value: 'fat_loss',
    label: 'Fat Loss'
  }, {
    value: 'muscle_gain',
    label: 'Muscle Gain'
  }, {
    value: 'strength',
    label: 'Strength'
  }, {
    value: 'general_fitness',
    label: 'General Fitness'
  }], []);

  const handleSaveChanges = async () => {
    await updateProfile.mutateAsync({
      name: fullName,
      email,
      fitness_goal: physicalGoal,
      age,
      gender: sex,
      height,
      weight,
      training_experience: experienceLevel,
      training_days_per_week: trainingDays,
      workout_duration_minutes: workoutDuration
    });
  };
  return <IonPage>
      <IonContent>
        <div className="min-h-screen w-full bg-[#0a0a0a] text-white pb-32">
        {/* Background Gradients */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div 
            className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full blur-[120px] opacity-30" 
            style={{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 20%, transparent)' }}
          />
          <div 
            className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full blur-[120px] opacity-30" 
            style={{ backgroundColor: 'color-mix(in srgb, var(--color-secondary) 20%, transparent)' }}
          />
        </div>

      <main className="relative z-10 max-w-md mx-auto px-6 pt-8">
        {/* Header */}
        <motion.div initial={{
        opacity: 0,
        y: -20
      }} animate={{
        opacity: 1,
        y: 0
      }} className="mb-8">
          <h1 
            className="text-3xl font-bold bg-clip-text text-transparent"
            style={{ backgroundImage: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))' }}
          >
            Profile
          </h1>
        </motion.div>

        {/* Account Information */}
        <motion.div initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 0.1
      }} className="mb-8">
          <h2 className="text-lg font-bold text-white mb-4">
            Account Information
          </h2>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-400 mb-2 block">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                <input 
                  type="text" 
                  value={fullName} 
                  onChange={e => setFullName(e.target.value)} 
                  className="w-full pl-12 pr-4 py-4 bg-gray-800/40 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 transition-all" 
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--color-primary) 50%, transparent)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  }}
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-2 block">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                <input 
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  className="w-full pl-12 pr-4 py-4 bg-gray-800/40 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 transition-all" 
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--color-primary) 50%, transparent)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  }}
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Fitness Profile */}
        <motion.div initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 0.2
      }} className="mb-8">
          <h2 className="text-lg font-bold text-white mb-4">Fitness Profile</h2>
          <div>
            <label className="text-xs text-gray-400 mb-2 block">
              Physical Goal
            </label>
            <div className="relative">
              <Target className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5 z-10" />
              <select 
                value={physicalGoal} 
                onChange={e => setPhysicalGoal(e.target.value as FitnessGoal)} 
                className="w-full pl-12 pr-12 py-4 bg-gray-800/40 border border-white/10 rounded-xl text-white appearance-none focus:outline-none focus:ring-2 transition-all cursor-pointer"
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--color-primary) 50%, transparent)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                }}
              >
                {goalOptions.map(option => <option key={option.value} value={option.value}>
                    {option.label}
                  </option>)}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5 pointer-events-none" />
            </div>
          </div>
        </motion.div>

        {/* Personal Information */}
        <motion.div initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 0.3
      }} className="mb-8">
          <h2 className="text-lg font-bold text-white mb-4">
            Personal Information
          </h2>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-400 mb-2 block">Age</label>
              <div 
                className="relative flex items-center w-full pl-12 pr-4 py-4 bg-gray-800/40 border border-white/10 rounded-xl text-white focus-within:ring-2 transition-all"
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--color-primary) 50%, transparent)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                }}
              >
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                <IonInput type="number" inputmode="numeric" pattern="[0-9]*" value={age.toString()} onIonInput={e => setAge(parseInt(e.detail.value!) || 0)} />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-2 block">Sex</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5 z-10" />
                <select 
                  value={sex} 
                  onChange={e => setSex(e.target.value as Gender)} 
                  className="w-full pl-12 pr-12 py-4 bg-gray-800/40 border border-white/10 rounded-xl text-white appearance-none focus:outline-none focus:ring-2 transition-all cursor-pointer"
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--color-primary) 50%, transparent)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  }}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Prefer not to say</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-2 block">
                Height (cm)
              </label>
              <div 
                className="relative flex items-center w-full pl-12 pr-4 py-4 bg-gray-800/40 border border-white/10 rounded-xl text-white focus-within:ring-2 transition-all"
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--color-primary) 50%, transparent)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                }}
              >
                <Ruler className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                <IonInput type="number" inputmode="numeric" pattern="[0-9]*" value={height.toString()} onIonInput={e => setHeight(parseInt(e.detail.value!) || 0)} />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-2 block">
                Weight (kg)
              </label>
              <div 
                className="relative flex items-center w-full pl-12 pr-4 py-4 bg-gray-800/40 border border-white/10 rounded-xl text-white focus-within:ring-2 transition-all"
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--color-primary) 50%, transparent)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                }}
              >
                <Weight className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                <IonInput type="number" inputmode="decimal" pattern="[0-9.]*" step="0.01" value={weight.toString()} onIonInput={e => setWeight(parseFloat(e.detail.value!) || 0)} />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Training Information */}
        <motion.div initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 0.4
      }} className="mb-8">
          <h2 className="text-lg font-bold text-white mb-4">
            Training Information
          </h2>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-400 mb-2 block">
                Experience Level
              </label>
              <div className="relative">
                <Dumbbell className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5 z-10" />
                <select 
                  value={experienceLevel} 
                  onChange={e => setExperienceLevel(e.target.value as TrainingExperience)} 
                  className="w-full pl-12 pr-12 py-4 bg-gray-800/40 border border-white/10 rounded-xl text-white appearance-none focus:outline-none focus:ring-2 transition-all cursor-pointer"
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--color-primary) 50%, transparent)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  }}
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-2 block">
                Training Days Per Week
              </label>
              <div 
                className="relative flex items-center w-full pl-12 pr-4 py-4 bg-gray-800/40 border border-white/10 rounded-xl text-white focus-within:ring-2 transition-all"
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--color-primary) 50%, transparent)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                }}
              >
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                <IonInput type="number" inputmode="numeric" pattern="[0-9]*" min="1" max="7" value={trainingDays.toString()} onIonInput={e => setTrainingDays(parseInt(e.detail.value!) || 1)} />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-2 block">
                Workout Duration (minutes)
              </label>
              <div 
                className="relative flex items-center w-full pl-12 pr-4 py-4 bg-gray-800/40 border border-white/10 rounded-xl text-white focus-within:ring-2 transition-all"
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--color-primary) 50%, transparent)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                }}
              >
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                <IonInput type="number" inputmode="numeric" pattern="[0-9]*" value={workoutDuration.toString()} onIonInput={e => setWorkoutDuration(parseInt(e.detail.value!) || 0)} />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Save Changes Button */}
        <motion.button initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 0.5
      }} whileHover={{
        scale: 1.02
      }} whileTap={{
        scale: 0.98
      }} 
        onClick={handleSaveChanges} 
        disabled={isLoading} 
        className="w-full py-4 rounded-2xl font-bold text-lg shadow-lg transition-shadow mb-4 disabled:opacity-60 disabled:cursor-not-allowed"
        style={{
          background: 'linear-gradient(to right, var(--color-primary), color-mix(in srgb, var(--color-primary) 80%, transparent))',
          boxShadow: '0 10px 25px color-mix(in srgb, var(--color-primary) 25%, transparent)'
        }}
        onMouseEnter={(e) => {
          if (!isLoading) {
            e.currentTarget.style.boxShadow = '0 10px 25px color-mix(in srgb, var(--color-primary) 40%, transparent)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = '0 10px 25px color-mix(in srgb, var(--color-primary) 25%, transparent)';
        }}
      >
          SAVE CHANGES
        </motion.button>

        {/* Log Out Button */}
        <motion.button initial={{
        opacity: 0,
        y: 20
      }} animate={{
        opacity: 1,
        y: 0
      }} transition={{
        delay: 0.6
      }} whileHover={{
        scale: 1.02
      }} whileTap={{
        scale: 0.98
      }} onClick={onLogout} className="w-full py-4 bg-transparent border-2 border-red-500/30 rounded-2xl font-bold text-lg text-red-400 hover:bg-red-500/10 hover:border-red-500/50 transition-all mb-8 flex items-center justify-center gap-2">
          <LogOut className="w-5 h-5" />
          LOG OUT
        </motion.button>
      </main>
    </div>
      </IonContent>
    </IonPage>;
}