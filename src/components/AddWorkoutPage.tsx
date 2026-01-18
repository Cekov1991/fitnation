import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { IonPage, IonContent } from '@ionic/react';
import { ArrowLeft, Check, ChevronDown } from 'lucide-react';
import { usePlans } from '../hooks/useApi';
interface AddWorkoutPageProps {
  mode?: 'create' | 'edit';
  planName?: string;
  initialData?: {
    plan: string;
    name: string;
    description: string;
    daysOfWeek: string[];
  };
  onBack: () => void;
  onSubmit?: (data: {
    plan: string;
    name: string;
    description: string;
    daysOfWeek: string[];
  }) => void;
}
const daysOfWeek = [{
  short: 'M',
  full: 'Monday'
}, {
  short: 'T',
  full: 'Tuesday'
}, {
  short: 'W',
  full: 'Wednesday'
}, {
  short: 'T',
  full: 'Thursday'
}, {
  short: 'F',
  full: 'Friday'
}, {
  short: 'S',
  full: 'Saturday'
}, {
  short: 'S',
  full: 'Sunday'
}];
export function AddWorkoutPage({
  mode = 'create',
  planName,
  initialData,
  onBack,
  onSubmit
}: AddWorkoutPageProps) {
  const {
    data: plans = []
  } = usePlans();
  const availablePlans = useMemo(() => {
    return plans.map(plan => plan.name);
  }, [plans]);
  const activePlanName = useMemo(() => {
    return plans.find(plan => plan.is_active)?.name;
  }, [plans]);

  const [selectedPlan, setSelectedPlan] = useState(initialData?.plan || planName || activePlanName || availablePlans[0] || '');
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [selectedDays, setSelectedDays] = useState<string[]>(initialData?.daysOfWeek || []);
  const [isPlanDropdownOpen, setIsPlanDropdownOpen] = useState(false);

  useEffect(() => {
    if (!selectedPlan) {
      setSelectedPlan(planName || activePlanName || availablePlans[0] || '');
    }
  }, [activePlanName, availablePlans, planName, selectedPlan]);
  const toggleDay = (day: string) => {
    setSelectedDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.({
      plan: selectedPlan,
      name,
      description,
      daysOfWeek: selectedDays
    });
    onBack();
  };
  return <IonPage>
      <IonContent>
        <div 
          className="min-h-screen w-full pb-32"
          style={{ backgroundColor: 'var(--color-bg-base)', color: 'var(--color-text-primary)' }}
        >
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
      }} className="flex items-center gap-4 mb-8">
          <motion.button whileHover={{
          scale: 1.1,
          x: -2
        }} whileTap={{
          scale: 0.9
        }} 
          onClick={onBack} 
          className="p-2 rounded-full transition-colors"
          style={{ backgroundColor: 'var(--color-border-subtle)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-border)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-border-subtle)';
          }}
        >
            <ArrowLeft className="w-6 h-6" style={{ color: 'var(--color-text-secondary)' }} />
          </motion.button>
          <h1 
            className="text-3xl font-bold bg-clip-text text-transparent"
            style={{ backgroundImage: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))' }}
          >
            {mode === 'create' ? 'Create Workout' : 'Edit Workout'}
          </h1>
        </motion.div>

        <form onSubmit={handleSubmit}>
          {/* Plan Dropdown */}
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          delay: 0.1
        }} className="mb-6">
            <label className="block text-sm font-medium mb-3" style={{ color: 'var(--color-text-secondary)' }}>
              Plan *
            </label>
            <div className="relative">
              <button 
                type="button" 
                onClick={() => setIsPlanDropdownOpen(!isPlanDropdownOpen)} 
                className="w-full px-5 py-4 border rounded-2xl text-left focus:outline-none focus:ring-2 transition-all flex items-center justify-between"
                style={{ 
                  backgroundColor: 'var(--color-bg-elevated)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--color-primary) 50%, transparent)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                }}
              >
                <span>{selectedPlan}</span>
                <ChevronDown 
                  className={`w-5 h-5 transition-transform ${isPlanDropdownOpen ? 'rotate-180' : ''}`}
                  style={{ color: 'var(--color-text-secondary)' }}
                />
              </button>

              {isPlanDropdownOpen && <motion.div initial={{
              opacity: 0,
              y: -10
            }} animate={{
              opacity: 1,
              y: 0
            }} 
              className="absolute top-full left-0 right-0 mt-2 backdrop-blur-xl border rounded-2xl shadow-2xl overflow-hidden z-10"
              style={{ 
                backgroundColor: 'var(--color-bg-modal)',
                borderColor: 'var(--color-border)'
              }}
            >
                  {availablePlans.map(plan => <button key={plan} type="button" onClick={() => {
                setSelectedPlan(plan);
                setIsPlanDropdownOpen(false);
              }} 
                className="w-full px-5 py-3 text-left transition-colors"
                style={selectedPlan === plan ? {
                  backgroundColor: 'color-mix(in srgb, var(--color-primary) 10%, transparent)',
                  color: 'var(--color-primary)'
                } : {
                  color: 'var(--color-text-primary)'
                }}
                onMouseEnter={(e) => {
                  if (selectedPlan !== plan) {
                    e.currentTarget.style.backgroundColor = 'var(--color-border-subtle)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedPlan !== plan) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
                style={selectedPlan === plan ? {
                  backgroundColor: 'color-mix(in srgb, var(--color-primary) 10%, transparent)',
                  color: 'var(--color-primary)'
                } : {}}
              >
                      {plan}
                    </button>)}
                </motion.div>}
            </div>
          </motion.div>

          {/* Workout Name Input */}
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          delay: 0.2
        }} className="mb-6">
            <label htmlFor="workout-name" className="block text-sm font-medium mb-3" style={{ color: 'var(--color-text-secondary)' }}>
              Workout Name *
            </label>
            <input 
              id="workout-name" 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="e.g., Push Day" 
              required 
              className="w-full px-5 py-4 border rounded-2xl focus:outline-none focus:ring-2 transition-all"
              style={{ 
                backgroundColor: 'var(--color-bg-elevated)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)'
              }} 
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--color-primary) 50%, transparent)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              }}
            />
          </motion.div>

          {/* Description Textarea */}
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          delay: 0.3
        }} className="mb-6">
            <label htmlFor="description" className="block text-sm font-medium mb-3" style={{ color: 'var(--color-text-secondary)' }}>
              Description
            </label>
            <textarea 
              id="description" 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              placeholder="Optional description" 
              rows={4} 
              className="w-full px-5 py-4 border rounded-2xl focus:outline-none focus:ring-2 transition-all resize-none"
              style={{ 
                backgroundColor: 'var(--color-bg-elevated)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)'
              }} 
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--color-primary) 50%, transparent)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              }}
            />
          </motion.div>

          {/* Days of Week - Modern Checkboxes */}
          <motion.div initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          delay: 0.4
        }} className="mb-8">
            <label className="block text-sm font-medium mb-3" style={{ color: 'var(--color-text-secondary)' }}>
              Days of Week
            </label>
            <div className="grid grid-cols-7 gap-2">
              {daysOfWeek.map((day, index) => {
              const isSelected = selectedDays.includes(day.full);
              return <motion.button key={day.full} type="button" initial={{
                opacity: 0,
                scale: 0.8
              }} animate={{
                opacity: 1,
                scale: 1
              }} transition={{
                delay: 0.5 + index * 0.05
              }} whileHover={{
                scale: 1.1
              }} whileTap={{
                scale: 0.95
              }} 
                onClick={() => toggleDay(day.full)} 
                className={`relative aspect-square rounded-xl font-bold text-sm transition-all ${isSelected ? 'text-white shadow-lg' : 'border'}`}
                style={isSelected ? {
                  background: 'linear-gradient(to bottom right, var(--color-primary), color-mix(in srgb, var(--color-primary) 80%, transparent))',
                  boxShadow: '0 10px 25px color-mix(in srgb, var(--color-primary) 25%, transparent)'
                } : {
                  backgroundColor: 'var(--color-bg-elevated)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-secondary)'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = 'var(--color-bg-surface)';
                    e.currentTarget.style.borderColor = 'var(--color-border)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = 'var(--color-bg-elevated)';
                    e.currentTarget.style.borderColor = 'var(--color-border)';
                  }
                }}
              >
                    {isSelected && <motion.div initial={{
                  scale: 0,
                  opacity: 0
                }} animate={{
                  scale: 1,
                  opacity: 1
                }} exit={{
                  scale: 0,
                  opacity: 0
                }} className="absolute inset-0 flex items-center justify-center">
                        <Check className="w-4 h-4" strokeWidth={3} />
                      </motion.div>}
                    <span className={isSelected ? 'opacity-0' : ''}>
                      {day.short}
                    </span>
                  </motion.button>;
            })}
            </div>
            {selectedDays.length > 0 && <motion.p initial={{
            opacity: 0,
            y: -10
          }} animate={{
            opacity: 1,
            y: 0
          }} className="text-xs mt-3" style={{ color: 'var(--color-text-muted)' }}>
                Selected: {selectedDays.join(', ')}
              </motion.p>}
          </motion.div>

          {/* Submit Button */}
          <motion.button initial={{
          opacity: 0,
          y: 20
        }} animate={{
          opacity: 1,
          y: 0
        }} transition={{
          delay: 0.6
        }} type="submit" disabled={!name.trim()} whileHover={{
          scale: name.trim() ? 1.02 : 1
        }} whileTap={{
          scale: name.trim() ? 0.98 : 1
        }} 
          className={`w-full py-4 rounded-2xl font-bold text-lg shadow-lg transition-all relative overflow-hidden group ${name.trim() ? '' : 'cursor-not-allowed opacity-50'}`}
          style={!name.trim() ? {
            backgroundColor: 'var(--color-bg-elevated)'
          } : undefined}
          style={name.trim() ? {
            background: 'linear-gradient(to right, var(--color-primary), color-mix(in srgb, var(--color-primary) 80%, transparent))',
            boxShadow: '0 10px 25px color-mix(in srgb, var(--color-primary) 25%, transparent)'
          } : {}}
        >
            <span className="relative z-10 flex items-center justify-center gap-2">
              <Check size={20} />
              {mode === 'create' ? 'CREATE WORKOUT' : 'SAVE CHANGES'}
            </span>
            {name.trim() && (
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" 
                style={{ background: 'linear-gradient(to right, var(--color-secondary), var(--color-primary))' }}
              />
            )}
          </motion.button>
        </form>
      </main>
    </div>
      </IonContent>
    </IonPage>;
}