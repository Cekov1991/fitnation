import { useLocation } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { InstallAppBanner } from '../components/InstallAppBanner';
import { IOSInstallOverlay } from '../components/IOSInstallOverlay';
import { useInstallPrompt } from '../hooks/useInstallPrompt';
import { useScrollRestoration } from '../hooks/useScrollRestoration';

// Space reserved when the install banner is visible (top-4 + banner height)
const INSTALL_BANNER_OFFSET = 100;

// Common layout wrapper for authenticated pages
export function AuthenticatedLayout({
  children,
  currentPage,
}: {
  children: React.ReactNode;
  /** When omitted, derived from the current URL via useCurrentNavPage(). */
  currentPage?: BottomNavPage;
}) {
  const derivedPage = useCurrentNavPage();
  const activePage = currentPage ?? derivedPage;
  const { canInstall, isIOS } = useInstallPrompt();
  const showInstallBar = canInstall || isIOS;
  const location = useLocation();
  const scrollRef = useScrollRestoration(location.pathname);

  return (
    <div
      ref={scrollRef}
      className="h-screen w-full overflow-y-auto"
    >
      <InstallAppBanner />
      <IOSInstallOverlay />

      <div style={{ paddingTop: showInstallBar ? INSTALL_BANNER_OFFSET : 0 }}>
        {children}
      </div>

      <BottomNav currentPage={activePage} />
    </div>
  );
}

export type BottomNavPage = 'dashboard' | 'plans' | 'progress' | 'exercises' | 'profile';

/** Passed via `history.push('/sessions/:id', state)` so the bottom tab matches the screen the user came from */
export type SessionDetailLocationState = {
  navPage?: BottomNavPage;
};

const NAV_PAGES: BottomNavPage[] = ['dashboard', 'plans', 'progress', 'exercises', 'profile'];

function isBottomNavPage(v: unknown): v is BottomNavPage {
  return typeof v === 'string' && (NAV_PAGES as readonly string[]).includes(v);
}

// Helper hook to get current nav page from URL
export function useCurrentNavPage(): BottomNavPage {
  const location = useLocation<SessionDetailLocationState>();
  const path = location.pathname;
  if (path === '/' || path === '/dashboard') return 'dashboard';
  if (path.startsWith('/exercises')) return 'exercises';
  if (path.startsWith('/sessions/')) {
    const nav = location.state?.navPage;
    if (isBottomNavPage(nav)) return nav;
    return 'progress';
  }
  if (path.startsWith('/plans') || path.startsWith('/workouts') ||
      path.startsWith('/session/')) return 'plans';
  if (path.startsWith('/profile')) return 'profile';
  if (path.startsWith('/progress')) return 'progress';
  return 'dashboard';
}
