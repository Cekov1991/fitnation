import { motion } from 'framer-motion';
import { useIonRouter } from '@ionic/react';
import { Home, ClipboardList, BarChart3, User } from 'lucide-react';

const tabs = [{
  id: 'dashboard',
  label: 'Dashboard',
  icon: Home,
  path: '/'
}, {
  id: 'plans',
  label: 'Plans',
  icon: ClipboardList,
  path: '/plans'
}, {
  id: 'progress',
  label: 'Progress',
  icon: BarChart3,
  path: '/progress'
}, {
  id: 'profile',
  label: 'Profile',
  icon: User,
  path: '/profile'
}];

interface BottomNavProps {
  currentPage?: string;
  onPageChange?: (page: 'dashboard' | 'plans' | 'progress' | 'profile') => void;
}

export function BottomNav({
  currentPage = 'dashboard',
  onPageChange
}: BottomNavProps) {
  const router = useIonRouter();

  const handleNavigation = (tab: typeof tabs[0]) => {
    // Skip if already on this page
    if (tab.id === currentPage) return;

    // Use router navigation for profile (fully migrated)
    // For other pages, use router but App.tsx will handle the internal state
    const direction = getNavigationDirection(currentPage, tab.id);
    router.push(tab.path, direction, 'push');
    
    // Also call legacy onPageChange for backward compatibility during migration
    // This will be removed once all pages are migrated
    onPageChange?.(tab.id as 'dashboard' | 'plans' | 'progress' | 'profile');
  };

  // Determine animation direction based on tab order
  const getNavigationDirection = (from: string, to: string): 'forward' | 'back' | 'none' => {
    const fromIndex = tabs.findIndex(t => t.id === from);
    const toIndex = tabs.findIndex(t => t.id === to);
    if (toIndex > fromIndex) return 'forward';
    if (toIndex < fromIndex) return 'back';
    return 'none';
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 px-4 pb-4 pt-2" style={{ zIndex: 9999 }}>
      <div 
        className="max-w-md mx-auto backdrop-blur-xl border rounded-2xl shadow-2xl shadow-black/50"
        style={{ 
          backgroundColor: 'var(--color-bg-modal)',
          borderColor: 'var(--color-border)'
        }}
      >
        <div className="flex justify-around items-center p-2">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = currentPage === tab.id;
            return (
              <button 
                key={tab.id} 
                onClick={() => handleNavigation(tab)} 
                className="relative flex flex-col items-center justify-center w-full py-3 group"
              >
                {isActive && (
                  <motion.div 
                    layoutId="nav-indicator" 
                    className="absolute inset-0 bg-white/5 rounded-xl" 
                    transition={{
                      type: 'spring',
                      bounce: 0.2,
                      duration: 0.6
                    }} 
                  />
                )}

                <span 
                  className="relative z-10 transition-colors duration-300 group-hover:text-[var(--color-text-secondary)]"
                  style={{ color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)' }}
                >
                  <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                </span>

                <span 
                  className="relative z-10 text-[10px] font-medium mt-1 transition-colors duration-300"
                  style={{ color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
