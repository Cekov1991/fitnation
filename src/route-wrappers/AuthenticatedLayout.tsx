import { useLocation } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';

// Common layout wrapper for authenticated pages
export function AuthenticatedLayout({ children, currentPage }: { children: React.ReactNode; currentPage: 'dashboard' | 'plans' | 'progress' | 'profile' }) {
  return (
    <div 
      className="h-screen w-full overflow-y-auto"
    >
      {children}
      <BottomNav currentPage={currentPage} />
    </div>
  );
}

// Helper hook to get current nav page from URL
export function useCurrentNavPage(): 'dashboard' | 'plans' | 'progress' | 'profile' {
  const location = useLocation();
  const path = location.pathname;
  if (path === '/' || path === '/dashboard') return 'dashboard';
  if (path.startsWith('/plans') || path.startsWith('/workouts') || 
      path.startsWith('/exercises') || path.startsWith('/session')) return 'plans';
  if (path.startsWith('/profile')) return 'profile';
  if (path.startsWith('/progress')) return 'progress';
  return 'dashboard';
}
