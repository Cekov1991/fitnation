import React from 'react';
import { Route, Switch, Redirect, useLocation } from 'react-router-dom';
import { IonApp } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { App } from './App';
import { LoginPage } from './components/LoginPage';
import { ProfilePage } from './components/ProfilePage';
import { AuthGuard } from './components/AuthGuard';
import { BottomNav } from './components/BottomNav';
import { BackgroundGradients } from './components/BackgroundGradients';
import { useAuth } from './hooks/useAuth';

/**
 * Phase 2: Individual page routes
 * 
 * Using Switch instead of IonRouterOutlet to avoid z-index stacking context issues
 * with fixed elements like BottomNav and modals.
 * 
 * Once all pages are migrated, we can switch back to IonRouterOutlet for
 * native page transitions.
 */

// Profile page wrapper that handles logout
function ProfilePageWrapper() {
  const { logout } = useAuth();
  const location = useLocation();
  
  const getCurrentPage = (): 'dashboard' | 'plans' | 'progress' | 'profile' => {
    const path = location.pathname;
    if (path === '/' || path === '/dashboard') return 'dashboard';
    if (path.startsWith('/plans') || path.startsWith('/workouts') || 
        path.startsWith('/exercises') || path.startsWith('/session')) return 'plans';
    if (path.startsWith('/profile')) return 'profile';
    if (path.startsWith('/progress')) return 'progress';
    return 'dashboard';
  };
  
  const handleLogout = async () => {
    await logout();
    // After logout, AuthGuard will redirect to /login
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
      <ProfilePage onLogout={handleLogout} />
      <BottomNav currentPage={getCurrentPage()} />
    </div>
  );
}

export function AppRoutes() {
  return (
    <IonApp>
      <IonReactRouter>
        <Switch>
          {/* Login route - public */}
          <Route exact path="/login">
            <LoginPage />
          </Route>

          {/* Profile page - migrated to router */}
          <Route exact path="/profile">
            <AuthGuard>
              <ProfilePageWrapper />
            </AuthGuard>
          </Route>

          {/* Main app routes - still using legacy navigation */}
          {/* This handles /, /plans, and all other authenticated routes */}
          <Route path="/">
            <AuthGuard>
              <App />
            </AuthGuard>
          </Route>
        </Switch>
      </IonReactRouter>
    </IonApp>
  );
}
