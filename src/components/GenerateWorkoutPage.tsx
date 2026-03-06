import { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { 
  useGenerateDraftSession,
  useProfile 
} from '../hooks/useApi';
import { LoadingButton } from './ui';

// Preset target region mappings
const PRESETS = {
  push: { name: 'Push', targetRegions: ['UPPER_PUSH'] },
  pull: { name: 'Pull', targetRegions: ['UPPER_PULL'] },
  legs: { name: 'Legs', targetRegions: ['LOWER'] },
  upper: { name: 'Upper Body', targetRegions: ['UPPER_PUSH', 'UPPER_PULL'] },
  lower: { name: 'Lower Body', targetRegions: ['LOWER', 'CORE'] },
  fullBody: { name: 'Full Body', targetRegions: [] }, // Empty means all regions
};

// Duration options: label -> backend value (always the higher amount)
const DURATION_OPTIONS = [
  { label: '20-30 min', value: 30 },
  { label: '30-45 min', value: 45 },
  { label: '45-60 min', value: 60 },
  { label: '60-90 min', value: 90 },
  { label: '90+ min', value: 120 },
];

export function GenerateWorkoutPage() {
  const history = useHistory();
  const { data: profile } = useProfile();
  const generateDraft = useGenerateDraftSession();

  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);

  // Sync duration from profile when it loads - map to closest option
  useEffect(() => {
    if (profile?.profile?.workout_duration_minutes) {
      const profileDuration = profile.profile.workout_duration_minutes;
      // Find the closest duration option (use the one that's >= profile duration, or the highest)
      const closestOption = DURATION_OPTIONS.find(opt => opt.value >= profileDuration) 
        || DURATION_OPTIONS[DURATION_OPTIONS.length - 1];
      setSelectedDuration(closestOption.value);
    } else {
      // Default to 45 min if no profile duration
      setSelectedDuration(45);
    }
  }, [profile?.profile?.workout_duration_minutes]);

  const handlePresetClick = (presetKey: string) => {
    if (selectedPreset === presetKey) {
      // Deselect
      setSelectedPreset(null);
    } else {
      // Select preset
      setSelectedPreset(presetKey);
    }
  };

  const handleGenerate = async () => {
    try {
      const preset = selectedPreset ? PRESETS[selectedPreset as keyof typeof PRESETS] : null;
      const generationParams = {
        target_regions: preset && preset.targetRegions.length > 0 ? preset.targetRegions : undefined,
        duration_minutes: selectedDuration || undefined,
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
      <main className="relative z-10 max-w-md mx-auto px-4 py-8">
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
              {!selectedPreset && (
                <p className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>
                  Select a workout type or leave empty for full body workout
                </p>
              )}
            </div>

            {/* Duration */}
            <div>
              <h2 className="text-sm font-bold mb-3 uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
                Duration
              </h2>
              <div className="flex flex-wrap gap-2">
                {DURATION_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSelectedDuration(option.value)}
                    className="px-4 py-2 rounded-full text-sm font-medium transition-all"
                    style={{
                      backgroundColor: selectedDuration === option.value
                        ? 'var(--color-primary)'
                        : 'var(--color-bg-surface)',
                      color: selectedDuration === option.value
                        ? 'white'
                        : 'var(--color-text-primary)',
                      border: `1px solid ${selectedDuration === option.value ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    }}
                  >
                    {option.label}
                  </button>
                ))}
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
