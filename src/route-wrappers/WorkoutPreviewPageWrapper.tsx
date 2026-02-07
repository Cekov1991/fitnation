import { WorkoutPreviewPage } from '../components/WorkoutPreviewPage';
import { AuthenticatedLayout, useCurrentNavPage } from './AuthenticatedLayout';

// Workout preview page wrapper
export default function WorkoutPreviewPageWrapper() {
  const currentPage = useCurrentNavPage();

  return (
    <AuthenticatedLayout currentPage={currentPage}>
      <WorkoutPreviewPage />
    </AuthenticatedLayout>
  );
}
