import React from 'react';
import { motion } from 'framer-motion';
import { Home, ClipboardList, BarChart3, User } from 'lucide-react';
const tabs = [{
  id: 'dashboard',
  label: 'Dashboard',
  icon: Home
}, {
  id: 'plans',
  label: 'Plans',
  icon: ClipboardList
}, {
  id: 'progress',
  label: 'Progress',
  icon: BarChart3
}, {
  id: 'profile',
  label: 'Profile',
  icon: User
}];
interface BottomNavProps {
  currentPage?: string;
  onPageChange?: (page: 'dashboard' | 'plans' | 'progress' | 'profile') => void;
}
export function BottomNav({
  currentPage = 'dashboard',
  onPageChange
}: BottomNavProps) {
  return <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pt-2">
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
          return <button key={tab.id} onClick={() => onPageChange?.(tab.id as 'dashboard' | 'plans' | 'progress' | 'profile')} className="relative flex flex-col items-center justify-center w-full py-3 group">
                {isActive && <motion.div layoutId="nav-indicator" className="absolute inset-0 bg-white/5 rounded-xl" transition={{
              type: 'spring',
              bounce: 0.2,
              duration: 0.6
            }} />}

                <span 
                  className="relative z-10 transition-colors duration-300"
                  style={{ color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)' }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.color = 'var(--color-text-secondary)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.color = 'var(--color-text-muted)';
                  }}
                >
                  <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                </span>

                <span 
                  className="relative z-10 text-[10px] font-medium mt-1 transition-colors duration-300"
                  style={{ color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}
                >
                  {tab.label}
                </span>
              </button>;
        })}
        </div>
      </div>
    </div>;
}