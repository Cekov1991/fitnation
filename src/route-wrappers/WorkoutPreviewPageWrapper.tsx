import { WorkoutPreviewPage } from '../components/WorkoutPreviewPage';

// Workout preview page wrapper (no BottomNav for full-screen experience)
export default function WorkoutPreviewPageWrapper() {
  return (
    <div className="h-screen w-full overflow-y-auto">
      <WorkoutPreviewPage />
    </div>
  );
}
