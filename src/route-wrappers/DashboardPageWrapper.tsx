import { DashboardPage } from '../components/DashboardPage';
import { AuthenticatedLayout, useCurrentNavPage } from './AuthenticatedLayout';

// Dashboard page wrapper
export default function DashboardPageWrapper() {
  const currentPage = useCurrentNavPage();

  return (
    <AuthenticatedLayout currentPage={currentPage}>
      <DashboardPage />
    </AuthenticatedLayout>
  );
}
