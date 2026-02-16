import { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { ArrowLeft, Sparkles, Clock } from 'lucide-react';
import { 
  useMuscleGroups, 
  useEquipmentTypes, 
  useGenerateDraftSession,
  useProfile 
} from '../hooks/useApi';
import { LoadingButton } from './ui';
import type { MuscleGroupResource, EquipmentTypeResource } from '../types/api';

// Preset muscle group mappings
const PRESETS = {
  push: { name: 'Push', muscles: ['Chest', 'Triceps', 'Front Delts', 'Side Delts'] },
  pull: { name: 'Pull', muscles: ['Lats', 'Upper Back', 'Biceps', 'Rear Delts'] },
  legs: { name: 'Legs', muscles: ['Quadriceps', 'Hamstrings', 'Glutes', 'Calves'] },
  upper: { name: 'Upper Body', muscles: ['Chest', 'Lats', 'Biceps', 'Triceps', 'Front Delts', 'Side Delts', 'Upper Back'] },
  lower: { name: 'Lower Body', muscles: ['Quadriceps', 'Hamstrings', 'Glutes', 'Calves'] },
  fullBody: { name: 'Full Body', muscles: [] }, // Empty means all
};

export function GenerateWorkoutPage() {
  const history = useHistory();
  const { data: profile } = useProfile();
  const { data: muscleGroups = [] } = useMuscleGroups();
  const { data: equipmentTypes = [] } = useEquipmentTypes();
  
  const generateDraft = useGenerateDraftSession();

  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [selectedMuscles, setSelectedMuscles] = useState<string[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [duration, setDuration] = useState<number>(45);

  // Sync duration from profile when it loads
  useEffect(() => {
    if (profile?.profile?.workout_duration_minutes) {
      setDuration(profile.profile.workout_duration_minutes);
    }
  }, [profile?.profile?.workout_duration_minutes]);

  const handlePresetClick = (presetKey: string) => {
    const preset = PRESETS[presetKey as keyof typeof PRESETS];
    if (selectedPreset === presetKey) {
      // Deselect
      setSelectedPreset(null);
      setSelectedMuscles([]);
    } else {
      // Select preset
      setSelectedPreset(presetKey);
      setSelectedMuscles(preset.muscles);
    }
  };

  const handleMuscleToggle = (muscleName: string) => {
    setSelectedPreset(null); // Clear preset when manually selecting
    setSelectedMuscles(prev => 
      prev.includes(muscleName) 
        ? prev.filter(m => m !== muscleName)
        : [...prev, muscleName]
    );
  };

  const handleEquipmentToggle = (equipmentCode: string) => {
    setSelectedEquipment(prev => 
      prev.includes(equipmentCode) 
        ? prev.filter(e => e !== equipmentCode)
        : [...prev, equipmentCode]
    );
  };

  const handleGenerate = async () => {
    try {
      const generationParams = {
        focus_muscle_groups: selectedMuscles.length > 0 ? selectedMuscles : undefined,
        equipment_types: selectedEquipment.length > 0 ? selectedEquipment : undefined,
        duration_minutes: duration || undefined,
        difficulty: profile?.profile?.training_experience || undefined,
      };
      const response = await generateDraft.mutateAsync(generationParams);
      const sessionId = response.data.id;
      // Pass generation params via route state so preview page can use them for regenerate
      history.push(`/generate-workout/preview/${sessionId}`, { generationParams });
    } catch (error) {
      console.error('Failed to generate workout:', error);
    }
  };

  return (
    <div className="min-h-screen pb-32" style={{ backgroundColor: 'var(--color-bg-base)' }}>
      <main className="relative z-10 max-w-md mx-auto px-3 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => history.push('/dashboard')}
            className="p-2 rounded-xl transition-colors"
            style={{ backgroundColor: 'var(--color-bg-surface)' }}
          >
            <ArrowLeft size={20} style={{ color: 'var(--color-text-primary)' }} />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6" style={{ color: 'var(--color-primary)' }} />
              <h1 
                className="text-2xl font-bold"
                style={{ color: 'var(--color-text-primary)' }}
              >
                Smart Workout
              </h1>
            </div>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
              Powered by Fit Nation's Engine
            </p>
          </div>
        </div>

        {/* Configuration Section */}
        <div className="space-y-6">
            {/* Presets */}
            <div>
              <h2 className="text-sm font-bold mb-3 uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
                Quick Select
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(PRESETS).map(([key, preset]) => (
                  <button
                    key={key}
                    onClick={() => handlePresetClick(key)}
                    className="p-4 rounded-xl border-2 transition-all"
                    style={{
                      backgroundColor: selectedPreset === key 
                        ? 'color-mix(in srgb, var(--color-primary) 10%, transparent)'
                        : 'var(--color-bg-surface)',
                      borderColor: selectedPreset === key 
                        ? 'var(--color-primary)'
                        : 'var(--color-border)',
                      color: selectedPreset === key 
                        ? 'var(--color-primary)'
                        : 'var(--color-text-primary)',
                    }}
                  >
                    <div className="text-sm font-bold">{preset.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Muscle Groups */}
            <div>
              <h2 className="text-sm font-bold mb-3 uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
                Target Muscles
              </h2>
              <div className="flex flex-wrap gap-2">
                {muscleGroups.map((muscle: MuscleGroupResource) => (
                  <button
                    key={muscle.id}
                    onClick={() => handleMuscleToggle(muscle.name)}
                    className="px-4 py-2 rounded-full text-sm font-medium transition-all"
                    style={{
                      backgroundColor: selectedMuscles.includes(muscle.name)
                        ? 'var(--color-primary)'
                        : 'var(--color-bg-surface)',
                      color: selectedMuscles.includes(muscle.name)
                        ? 'white'
                        : 'var(--color-text-primary)',
                      border: `1px solid ${selectedMuscles.includes(muscle.name) ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    }}
                  >
                    {muscle.name}
                  </button>
                ))}
              </div>
              {selectedMuscles.length === 0 && (
                <p className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>
                  Leave empty for full body workout
                </p>
              )}
            </div>

            {/* Equipment */}
            <div>
              <h2 className="text-sm font-bold mb-3 uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
                Equipment
              </h2>
              <div className="flex flex-wrap gap-2">
                {equipmentTypes.map((equipment: EquipmentTypeResource) => (
                  <button
                    key={equipment.id}
                    onClick={() => handleEquipmentToggle(equipment.code)}
                    className="px-4 py-2 rounded-full text-sm font-medium transition-all"
                    style={{
                      backgroundColor: selectedEquipment.includes(equipment.code)
                        ? 'var(--color-secondary)'
                        : 'var(--color-bg-surface)',
                      color: selectedEquipment.includes(equipment.code)
                        ? 'white'
                        : 'var(--color-text-primary)',
                      border: `1px solid ${selectedEquipment.includes(equipment.code) ? 'var(--color-secondary)' : 'var(--color-border)'}`,
                    }}
                  >
                    {equipment.name}
                  </button>
                ))}
              </div>
              {selectedEquipment.length === 0 && (
                <p className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>
                  Leave empty to include all equipment
                </p>
              )}
            </div>

            {/* Duration */}
            <div>
              <h2 className="text-sm font-bold mb-3 uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
                Duration
              </h2>
              <div 
                className="p-5 rounded-2xl border"
                style={{ 
                  backgroundColor: 'var(--color-bg-surface)',
                  borderColor: 'var(--color-border)',
                }}
              >
                {/* Header row */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: 'var(--color-bg-elevated)' }}
                    >
                      <Clock className="w-5 h-5" style={{ color: 'var(--color-text-primary)' }} />
                    </div>
                    <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                      Session Length
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
                      {duration || 45}
                    </span>
                    <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      min
                    </span>
                  </div>
                </div>

                {/* Slider */}
                <div className="relative pt-2">
                  <input
                    type="range"
                    min="15"
                    max="120"
                    step="5"
                    value={duration || 45}
                    onChange={(e) => setDuration(parseInt(e.target.value, 10))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between mt-2">
                    <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>15m</span>
                    <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>120m</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Generate Button */}
            <LoadingButton
              onClick={handleGenerate}
              isLoading={generateDraft.isPending}
              loadingText="GENERATING..."
              className="w-full py-4 rounded-2xl font-bold text-lg shadow-lg relative overflow-hidden group"
              style={{ background: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))', color: 'var(--color-text-button)' }}
            >
              <span className="flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5" />
                GENERATE WORKOUT
              </span>
            </LoadingButton>
          </div>
      </main>
    </div>
  );
}
