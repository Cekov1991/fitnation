import { GenerateWorkoutPage } from '../components/GenerateWorkoutPage';

// Generate workout page wrapper (no BottomNav for full-screen experience)
export default function GenerateWorkoutPageWrapper() {
  return (
    <div className="h-screen w-full overflow-y-auto">
      <GenerateWorkoutPage />
    </div>
  );
}
