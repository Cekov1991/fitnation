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
  primaryMuscleGroupIds: number[];
  sets: Set[];
  progressionMode: 'double_progression' | 'total_reps';
  minTargetReps: number;
  maxTargetReps: number;
  progressionStatus: 'no_history' | 'below_min' | 'working' | 'ready';
  totalRepsPrevious: number | null;
  totalRepsTarget: number | null;
  targetSets: number;
  suggestedWeight: number;
  maxWeightLifted: number;
  imageUrl: string;
  videoUrl: string | null;
  history: { date: string; weight: number }[];
  restSeconds: number | null;
  allowWeightLogging: boolean;
}

export interface ExerciseCompletionStatus {
  completed: number;
  total: number;
  isComplete: boolean;
}
