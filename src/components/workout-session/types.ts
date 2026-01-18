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
