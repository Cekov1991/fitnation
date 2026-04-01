import { useLocation } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { InstallAppBanner } from '../components/InstallAppBanner';
import { useInstallPrompt } from '../hooks/useInstallPrompt';

// Space reserved when the install banner is visible (top-4 + banner height)
const INSTALL_BANNER_OFFSET = 100;

// Common layout wrapper for authenticated pages
export function AuthenticatedLayout({ children, currentPage }: { children: React.ReactNode; currentPage: 'dashboard' | 'plans' | 'progress' | 'exercises' | 'profile' }) {
  const { canInstall, isIOS } = useInstallPrompt();
  const showInstallBar = canInstall || isIOS;

  return (
    <div
      className="h-screen w-full overflow-y-auto"
    >
      <InstallAppBanner />

      <div style={{ paddingTop: showInstallBar ? INSTALL_BANNER_OFFSET : 0 }}>
        {children}
      </div>

      <BottomNav currentPage={currentPage} />
    </div>
  );
}

// Helper hook to get current nav page from URL
export function useCurrentNavPage(): 'dashboard' | 'plans' | 'progress' | 'exercises' | 'profile' {
  const location = useLocation();
  const path = location.pathname;
  if (path === '/' || path === '/dashboard') return 'dashboard';
  if (path.startsWith('/exercises')) return 'exercises';
  if (path.startsWith('/plans') || path.startsWith('/workouts') ||
      path.startsWith('/session')) return 'plans';
  if (path.startsWith('/profile')) return 'profile';
  if (path.startsWith('/progress')) return 'progress';
  return 'dashboard';
}
