import { Check } from 'lucide-react';

interface FinishWorkoutButtonProps {
  allExercisesCompleted: boolean;
  onFinish: () => void;
}

export function FinishWorkoutButton({
  allExercisesCompleted,
  onFinish,
}: FinishWorkoutButtonProps) {
  if (!allExercisesCompleted) {
    return null;
  }

  return (
    <div className="fixed bottom-5 left-0 right-0 px-6 max-w-md mx-auto z-20">
      <button
        onClick={onFinish}
        className="w-full py-4 bg-gradient-to-r from-green-600 to-green-500 rounded-2xl font-bold text-lg shadow-2xl shadow-green-500/30 relative overflow-hidden group active:opacity-90"
        style={{ WebkitTapHighlightColor: 'transparent' }}
      >
        <span className="relative z-10 flex items-center justify-center gap-2 text-white">
          <Check className="w-6 h-6" />
          FINISH WORKOUT
        </span>
        <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </button>
    </div>
  );
}
