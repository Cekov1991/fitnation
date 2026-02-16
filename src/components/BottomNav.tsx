import { motion } from 'framer-motion';
import { useHistory, useLocation } from 'react-router-dom';
import { Home, ClipboardList, BarChart3, User } from 'lucide-react';
import { useReducedMotion } from '../hooks/useReducedMotion';

const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
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
  const history = useHistory();
  const location = useLocation();
  const shouldReduceMotion = useReducedMotion();

  const handleNavigation = (tab: typeof tabs[0]) => {
    // Check if we're already on this exact path (not just the same tab category)
    if (location.pathname === tab.path) return;

    history.push(tab.path);
    
    // Also call legacy onPageChange for backward compatibility during migration
    // This will be removed once all pages are migrated
    onPageChange?.(tab.id as 'dashboard' | 'plans' | 'progress' | 'profile');
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 px-1 pb-4 pt-2" style={{ zIndex: 9999 }}>
      <div 
        className="max-w-md mx-auto   border rounded-2xl shadow-2xl shadow-black/50"
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
                    layoutId={shouldReduceMotion || isIOS ? undefined : "nav-indicator"} 
                    className="absolute inset-0 bg-white/5 rounded-xl" 
                    transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.3, ease: 'easeOut' }} 
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
