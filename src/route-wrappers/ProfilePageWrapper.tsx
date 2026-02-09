import { ProfilePage } from '../components/ProfilePage';
import { useAuth } from '../hooks/useAuth';
import { AuthenticatedLayout, useCurrentNavPage } from './AuthenticatedLayout';

// Profile page wrapper that handles logout
export default function ProfilePageWrapper() {
  const { logout } = useAuth();
  const currentPage = useCurrentNavPage();
  
  const handleLogout = async () => {
    await logout();
    // After logout, AuthGuard will redirect to /login
  };

  return (
    <AuthenticatedLayout currentPage={currentPage}>
      <ProfilePage onLogout={handleLogout} />
    </AuthenticatedLayout>
  );
}
