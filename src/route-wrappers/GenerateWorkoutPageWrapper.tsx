import { GenerateWorkoutPage } from '../components/GenerateWorkoutPage';
import { AuthenticatedLayout, useCurrentNavPage } from './AuthenticatedLayout';

// Generate workout page wrapper
export default function GenerateWorkoutPageWrapper() {
  const currentPage = useCurrentNavPage();

  return (
    <AuthenticatedLayout currentPage={currentPage}>
      <GenerateWorkoutPage />
    </AuthenticatedLayout>
  );
}
