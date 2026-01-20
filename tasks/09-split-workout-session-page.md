# Task: Split WorkoutSessionPage into Smaller Components

## Priority: 🟢 Later
## Estimated Time: 2-3 hours
## Type: Maintainability / Code Organization

---

## Problem

`WorkoutSessionPage.tsx` is **1344 lines** with:
- 3 inline modal/menu components
- Complex state management (15+ useState calls)
- Multiple responsibilities
- Hard to test and maintain

---

## Solution

Split into focused components:

```
src/components/workout-session/
├── index.ts                      # Re-exports
├── WorkoutSessionPage.tsx        # Main page (orchestrator)
├── WorkoutHeader.tsx             # Timer and exit/options buttons
├── ExerciseNavTabs.tsx           # Horizontal exercise tabs
├── CurrentExerciseCard.tsx       # Exercise details card
├── MaxWeightChart.tsx            # Performance chart
├── SetLogCard.tsx                # Log new set form
├── SetEditCard.tsx               # Edit existing set form
├── SetsList.tsx                  # List of sets for current exercise
├── WorkoutOptionsMenu.tsx        # Bottom sheet menu
├── ExerciseOptionsMenu.tsx       # Exercise-specific menu
├── SetOptionsMenu.tsx            # Set-specific menu
├── hooks/
│   ├── useWorkoutTimer.ts        # Timer logic
│   └── useSetManagement.ts       # Set CRUD logic
└── types.ts                      # Local types
```

---

## Step 1: Extract Types

Create `src/components/workout-session/types.ts`:

```typescript
export interface Set {
  id: string;
  setLogId?: number;
  reps: number;
  weight: number;
  completed: boolean;
}

export interface Exercise {
  id: string;
  exerciseId: number;
  sessionExerciseId: number;
  name: string;
  type: string;
  muscleGroup: string;
  sets: Set[];
  targetReps: string;
  targetSets: number;
  suggestedWeight: number;
  maxWeightLifted: number;
  imageUrl: string;
  history: { date: string; weight: number }[];
}

export interface ExerciseCompletionStatus {
  completed: number;
  total: number;
  isComplete: boolean;
}
```

---

## Step 2: Extract Timer Hook

Create `src/components/workout-session/hooks/useWorkoutTimer.ts`:

```typescript
import { useState, useEffect } from 'react';

export function useWorkoutTimer(performedAt: string | undefined) {
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (!performedAt) return;
    
    const calculateElapsedTime = () => {
      const performedAtTime = new Date(performedAt).getTime();
      const now = Date.now();
      return Math.floor((now - performedAtTime) / 1000);
    };
    
    setDuration(calculateElapsedTime());
    
    const interval = setInterval(() => {
      setDuration(calculateElapsedTime());
    }, 1000);
    
    return () => clearInterval(interval);
  }, [performedAt]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return { duration, formattedDuration: formatTime(duration) };
}
```

---

## Step 3: Extract Header Component

Create `src/components/workout-session/WorkoutHeader.tsx`:

```typescript
import React from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';

interface WorkoutHeaderProps {
  formattedDuration: string;
  onExit: () => void;
  onOpenOptions: () => void;
}

export function WorkoutHeader({ 
  formattedDuration, 
  onExit, 
  onOpenOptions 
}: WorkoutHeaderProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between p-6 pb-4"
    >
      <button 
        onClick={onExit} 
        className="text-sm font-semibold transition-colors text-hover-primary"
      >
        Exit
      </button>
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4" style={{ color: 'var(--color-text-muted)' }} />
        <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          {formattedDuration}
        </span>
      </div>
      <button 
        onClick={onOpenOptions} 
        className="text-sm font-semibold"
        style={{ color: 'var(--color-primary)' }}
      >
        Options
      </button>
    </motion.div>
  );
}
```

---

## Step 4: Extract Exercise Navigation Tabs

Create `src/components/workout-session/ExerciseNavTabs.tsx`:

```typescript
import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { ExerciseImage } from '../ExerciseImage';
import type { Exercise, ExerciseCompletionStatus } from './types';

interface ExerciseNavTabsProps {
  exercises: Exercise[];
  currentIndex: number;
  onSelectExercise: (index: number) => void;
  getCompletionStatus: (exercise: Exercise) => ExerciseCompletionStatus;
}

export function ExerciseNavTabs({
  exercises,
  currentIndex,
  onSelectExercise,
  getCompletionStatus,
}: ExerciseNavTabsProps) {
  if (exercises.length === 0) return null;

  return (
    <motion.div
    {...modalTransition}
      className="px-6 pb-4"
    >
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {exercises.map((exercise, index) => {
          const status = getCompletionStatus(exercise);
          const isActive = index === currentIndex;
          
          return (
            <motion.button
              key={exercise.id}
              onClick={() => onSelectExercise(index)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`flex-shrink-0 flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive 
                  ? 'shadow-lg' 
                  : status.isComplete 
                    ? 'bg-green-500/10 border border-green-500/20' 
                    : 'border bg-surface-hover'
              }`}
              style={isActive ? {
                background: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))',
              } : undefined}
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden">
                <ExerciseImage src={exercise.imageUrl} alt={exercise.name} className="w-full h-full" />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-bold" style={{ 
                  color: isActive ? 'white' : 'var(--color-text-secondary)' 
                }}>
                  {exercise.name.length > 20 ? `${exercise.name.substring(0, 20)}...` : exercise.name}
                </h3>
                <p className="text-xs" style={{ 
                  color: isActive ? 'rgba(255, 255, 255, 0.9)' : '#6b7280' 
                }}>
                  {status.completed}/{status.total} sets
                </p>
              </div>
              {status.isComplete && (
                <div className="flex-shrink-0 p-1 bg-green-500/20 rounded-full">
                  <Check className="text-green-400 w-4 h-4" />
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
```

---

## Step 5: Extract Menu Components

Create `src/components/workout-session/WorkoutOptionsMenu.tsx`:

```typescript
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Check } from 'lucide-react';

interface WorkoutOptionsMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onAddExercise: () => void;
  onFinishWorkout: () => void;
}

export function WorkoutOptionsMenu({
  isOpen,
  onClose,
  onAddExercise,
  onFinishWorkout,
}: WorkoutOptionsMenuProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60   z-40"
          />

          <motion.div
          {...modalTransition}
            className="fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto"
          >
            <div 
              className="rounded-t-3xl shadow-2xl p-6 pb-32"
              style={{ backgroundColor: 'var(--color-bg-modal)' }}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
                  Workout Options
                </h3>
                <button onClick={onClose} className="btn-icon">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2">
                <MenuButton
                  icon={<Plus className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />}
                  iconBg="color-mix(in srgb, var(--color-primary) 20%, transparent)"
                  title="Add Exercise"
                  subtitle="Add a new exercise to workout"
                  onClick={onAddExercise}
                />
                
                <MenuButton
                  icon={<Check className="text-green-400 w-5 h-5" />}
                  iconBg="rgb(34 197 94 / 0.2)"
                  title="Finish Workout"
                  subtitle="Complete and save workout"
                  onClick={onFinishWorkout}
                  variant="success"
                />
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Reusable menu button component
interface MenuButtonProps {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle: string;
  onClick: () => void;
  variant?: 'default' | 'success' | 'danger';
}

function MenuButton({ icon, iconBg, title, subtitle, onClick, variant = 'default' }: MenuButtonProps) {
  const styles = {
    default: 'card-hover border',
    success: 'bg-green-500/10 hover:bg-green-500/20 border border-green-500/20',
    danger: 'bg-red-500/10 hover:bg-red-500/20 border border-red-500/20',
  };
  
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`w-full flex items-center gap-4 p-4 rounded-xl transition-colors ${styles[variant]}`}
    >
      <div className="p-2 rounded-lg" style={{ backgroundColor: iconBg }}>
        {icon}
      </div>
      <div className="flex-1 text-left">
        <p className="text-sm font-bold" style={{ 
          color: variant === 'success' ? '#4ade80' : variant === 'danger' ? '#f87171' : 'var(--color-text-primary)' 
        }}>
          {title}
        </p>
        <p className="text-xs" style={{ 
          color: variant === 'success' ? 'rgb(74 222 128 / 0.7)' : variant === 'danger' ? 'rgb(248 113 113 / 0.7)' : 'var(--color-text-secondary)' 
        }}>
          {subtitle}
        </p>
      </div>
    </motion.button>
  );
}
```

---

## Step 6: Refactor Main Component

The main `WorkoutSessionPage.tsx` should now be a thin orchestrator:

```typescript
import React, { useState, useMemo } from 'react';
import { IonPage, IonContent } from '@ionic/react';
import { useSession, useCompleteSession, /* ... */ } from '../../hooks/useApi';
import { BackgroundGradients } from '../BackgroundGradients';
import { WorkoutHeader } from './WorkoutHeader';
import { ExerciseNavTabs } from './ExerciseNavTabs';
import { CurrentExerciseCard } from './CurrentExerciseCard';
import { SetLogCard } from './SetLogCard';
import { SetsList } from './SetsList';
import { WorkoutOptionsMenu } from './WorkoutOptionsMenu';
import { ExerciseOptionsMenu } from './ExerciseOptionsMenu';
import { SetOptionsMenu } from './SetOptionsMenu';
import { useWorkoutTimer } from './hooks/useWorkoutTimer';
import { mapSessionToExercises, getExerciseCompletionStatus } from './utils';
import type { Exercise } from './types';

interface WorkoutSessionPageProps {
  sessionId: number;
  workoutName: string;
  onBack: () => void;
  onFinish: () => void;
  onViewExerciseDetail: (exerciseName: string) => void;
}

export function WorkoutSessionPage({ sessionId, /* ... */ }: WorkoutSessionPageProps) {
  const { data: sessionData, isLoading } = useSession(sessionId);
  const completeSession = useCompleteSession();
  const { formattedDuration } = useWorkoutTimer(sessionData?.session?.performed_at);
  
  // State
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [showWorkoutOptions, setShowWorkoutOptions] = useState(false);
  const [showExerciseOptions, setShowExerciseOptions] = useState(false);
  const [showSetOptions, setShowSetOptions] = useState(false);
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);
  
  // Derived data
  const exercises = useMemo(() => mapSessionToExercises(sessionData), [sessionData]);
  const currentExercise = exercises[currentExerciseIndex];
  
  if (isLoading) return <LoadingState />;
  
  return (
    <IonPage>
      <IonContent>
        <div className="min-h-screen w-full pb-32" style={{ backgroundColor: 'var(--color-bg-base)' }}>
          <BackgroundGradients />
          
          <main className="relative z-10 max-w-md mx-auto">
            <WorkoutHeader
              formattedDuration={formattedDuration}
              onExit={onBack}
              onOpenOptions={() => setShowWorkoutOptions(true)}
            />
            
            <ExerciseNavTabs
              exercises={exercises}
              currentIndex={currentExerciseIndex}
              onSelectExercise={setCurrentExerciseIndex}
              getCompletionStatus={getExerciseCompletionStatus}
            />
            
            {exercises.length === 0 ? (
              <EmptyState onAddExercise={() => setShowWorkoutOptions(true)} />
            ) : (
              <ExerciseContent
                exercise={currentExercise}
                sessionId={sessionId}
                onOpenExerciseOptions={() => setShowExerciseOptions(true)}
                onOpenSetOptions={(setId) => {
                  setSelectedSetId(setId);
                  setShowSetOptions(true);
                }}
              />
            )}
          </main>
          
          {/* Menus */}
          <WorkoutOptionsMenu
            isOpen={showWorkoutOptions}
            onClose={() => setShowWorkoutOptions(false)}
            onAddExercise={handleAddExercise}
            onFinishWorkout={handleFinish}
          />
          
          <ExerciseOptionsMenu
            isOpen={showExerciseOptions}
            onClose={() => setShowExerciseOptions(false)}
            // ... other props
          />
          
          <SetOptionsMenu
            isOpen={showSetOptions}
            selectedSetId={selectedSetId}
            onClose={() => setShowSetOptions(false)}
            // ... other props
          />
        </div>
      </IonContent>
    </IonPage>
  );
}
```

---

## Final Structure

After refactoring:

| Component | Lines | Responsibility |
|-----------|-------|----------------|
| WorkoutSessionPage | ~150 | Orchestration, state management |
| WorkoutHeader | ~40 | Timer display, exit/options buttons |
| ExerciseNavTabs | ~70 | Horizontal exercise selector |
| CurrentExerciseCard | ~50 | Exercise image, name, muscle group |
| MaxWeightChart | ~60 | Performance history chart |
| SetLogCard | ~80 | Form for logging new sets |
| SetEditCard | ~80 | Form for editing existing sets |
| SetsList | ~60 | List of all sets |
| WorkoutOptionsMenu | ~80 | Workout-level actions menu |
| ExerciseOptionsMenu | ~100 | Exercise-level actions menu |
| SetOptionsMenu | ~80 | Set-level actions menu |

---

## Validation Steps

1. All workout session functionality still works:
   - Timer displays and updates
   - Can navigate between exercises
   - Can log sets
   - Can edit sets
   - Can add/remove exercises
   - Can finish workout
   
2. No visual regressions

3. Code is more maintainable and testable
