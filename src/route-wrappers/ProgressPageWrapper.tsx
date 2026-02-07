import { ProgressPage } from '../components/ProgressPage';
import { AuthenticatedLayout, useCurrentNavPage } from './AuthenticatedLayout';

// Progress page wrapper
export default function ProgressPageWrapper() {
  const currentPage = useCurrentNavPage();

  return (
    <AuthenticatedLayout currentPage={currentPage}>
      <ProgressPage />
    </AuthenticatedLayout>
  );
}
