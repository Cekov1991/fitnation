import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { ArrowLeft, Sparkles, Clock, RefreshCw, Check, X } from 'lucide-react';
import { useMuscleGroups, useEquipmentTypes, usePreviewWorkout, useConfirmWorkout, useProfile } from '../hooks/useApi';
import { LoadingButton } from './ui';
import { ExerciseImage } from './ExerciseImage';
import type { WorkoutPreviewResource, PreviewExercise, MuscleGroupResource, EquipmentTypeResource } from '../types/api';

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
  const previewWorkout = usePreviewWorkout();
  const confirmWorkout = useConfirmWorkout();

  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [selectedMuscles, setSelectedMuscles] = useState<string[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [duration, setDuration] = useState<number | null>(profile?.profile?.workout_duration_minutes || 45);
  const [previewData, setPreviewData] = useState<WorkoutPreviewResource | null>(null);

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
      const response = await previewWorkout.mutateAsync({
        focus_muscle_groups: selectedMuscles.length > 0 ? selectedMuscles : undefined,
        equipment_types: selectedEquipment.length > 0 ? selectedEquipment : undefined,
        duration_minutes: duration || undefined,
      });
      setPreviewData(response.data);
    } catch (error) {
      console.error('Failed to generate workout:', error);
    }
  };

  const handleConfirm = async () => {
    if (!previewData) return;

    try {
      const response = await confirmWorkout.mutateAsync({
        exercises: previewData.exercises.map((ex: PreviewExercise) => ({
          exercise_id: ex.exercise_id,
          order: ex.order,
          target_sets: ex.target_sets,
          target_reps: ex.target_reps,
          target_weight: ex.target_weight,
          rest_seconds: ex.rest_seconds,
        })),
        rationale: previewData.rationale,
      });
      
      const session = response.data?.session || response.data;
      if (session?.id) {
        history.push(`/session/${session.id}`);
      }
    } catch (error) {
      console.error('Failed to confirm workout:', error);
    }
  };

  const handleRegenerate = () => {
    handleGenerate();
  };

  return (
    <div className="min-h-screen pb-32" style={{ backgroundColor: 'var(--color-bg-base)' }}>
      <main className="relative z-10 max-w-md mx-auto px-6 pt-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => history.goBack()}
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

        {!previewData ? (
          /* Configuration Section */
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
              isLoading={previewWorkout.isPending}
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
        ) : (
          /* Preview Section */
          <div className="space-y-6">
            {/* Rationale */}
            {previewData.rationale && (
              <div 
                className="p-4 rounded-xl border"
                style={{ 
                  backgroundColor: 'color-mix(in srgb, var(--color-primary) 5%, transparent)',
                  borderColor: 'color-mix(in srgb, var(--color-primary) 20%, transparent)',
                }}
              >
                <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
                  {previewData.rationale}
                </p>
              </div>
            )}

            {/* Exercise List */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
                  Exercises ({previewData.exercises.length})
                </h2>
                <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  ~{previewData.estimated_duration_minutes} min
                </span>
              </div>
              <div className="space-y-3">
                {previewData.exercises.map((ex: PreviewExercise, idx: number) => (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl border"
                    style={{ 
                      backgroundColor: 'var(--color-bg-surface)',
                      borderColor: 'var(--color-border)',
                    }}
                  >
                    <div className="flex gap-4">
                      <ExerciseImage 
                        src={ex.exercise.image} 
                        alt={ex.exercise.name}
                        className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--color-text-primary)' }}>
                          {ex.exercise.name}
                        </h3>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {ex.exercise.muscle_groups?.slice(0, 3).map((mg, i) => (
                            <span 
                              key={i}
                              className="px-3 py-1 rounded-full text-xs font-medium"
                              style={{ 
                                backgroundColor: 'color-mix(in srgb, var(--color-primary) 15%, transparent)',
                                color: 'var(--color-primary)',
                              }}
                            >
                              {mg.name}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center gap-3 text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                          <span>{ex.target_sets} sets</span>
                          <span style={{ color: 'var(--color-text-muted)' }}>•</span>
                          <span>{ex.target_reps} reps</span>
                          {ex.target_weight > 0 && (
                            <>
                              <span style={{ color: 'var(--color-text-muted)' }}>•</span>
                              <span>{ex.target_weight} kg</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <LoadingButton
                onClick={handleConfirm}
                isLoading={confirmWorkout.isPending}
                loadingText="STARTING..."
                className="w-full py-4 rounded-2xl font-bold text-lg shadow-lg"
                style={{ background: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))', color: 'var(--color-text-button)' }}
              >
                <span className="flex items-center justify-center gap-2">
                  <Check className="w-5 h-5" />
                  START WORKOUT
                </span>
              </LoadingButton>

              <button
                onClick={handleRegenerate}
                disabled={previewWorkout.isPending}
                className="w-full py-4 rounded-2xl font-bold text-lg border-2 transition-all"
                style={{
                  borderColor: 'var(--color-border)',
                  backgroundColor: 'var(--color-bg-surface)',
                  color: 'var(--color-text-primary)',
                }}
              >
                <span className="flex items-center justify-center gap-2">
                  <RefreshCw className="w-5 h-5" />
                  REGENERATE
                </span>
              </button>

              <button
                onClick={() => setPreviewData(null)}
                className="w-full py-4 rounded-2xl font-bold text-lg border-2 transition-all"
                style={{
                  borderColor: 'color-mix(in srgb, var(--color-danger) 30%, transparent)',
                  backgroundColor: 'transparent',
                  color: 'var(--color-danger)',
                }}
              >
                <span className="flex items-center justify-center gap-2">
                  <X className="w-5 h-5" />
                  CANCEL
                </span>
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
