import React from 'react';
import { useLocation } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { BackgroundGradients } from './BackgroundGradients';

interface AppShellProps {
  children: React.ReactNode;
}

type NavPage = 'dashboard' | 'plans' | 'progress' | 'profile';

export function AppShell({ children }: AppShellProps) {
  const location = useLocation();
  
  // Determine current page for bottom nav highlighting
  const getCurrentPage = (): NavPage => {
    const path = location.pathname;
    
    if (path === '/') return 'dashboard';
    if (path.startsWith('/plans')) return 'plans';
    if (path.startsWith('/workouts')) return 'plans';
    if (path.startsWith('/exercises')) return 'plans';
    if (path.startsWith('/session')) return 'plans';
    if (path.startsWith('/profile')) return 'profile';
    if (path.startsWith('/progress')) return 'progress';
    
    return 'dashboard';
  };

  return (
    <div 
      className="min-h-screen w-full"
      style={{
        backgroundColor: 'var(--color-bg-base)',
        color: 'var(--color-text-primary)',
        '--selection-bg': 'color-mix(in srgb, var(--color-primary) 30%, transparent)'
      } as React.CSSProperties & { '--selection-bg': string }}
    >
      <BackgroundGradients />
      {children}
      <BottomNav currentPage={getCurrentPage()} />
    </div>
  );
}
