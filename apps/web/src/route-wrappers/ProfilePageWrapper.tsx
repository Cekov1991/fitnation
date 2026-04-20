import { ProfilePage } from '../components/ProfilePage';
import { useAuth } from '../hooks/useAuth';

// Profile page wrapper that handles logout
export default function ProfilePageWrapper() {
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    // After logout, AuthGuard will redirect to /login
  };

  return <ProfilePage onLogout={handleLogout} />;
}
