import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './hooks/useAuth';
import { BrandingProvider } from './hooks/useBranding';
import { ModalsProvider } from './contexts/ModalsContext';
import { AppRoutes } from './routes';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrandingProvider>
          <ModalsProvider>
            <AppRoutes />
          </ModalsProvider>
        </BrandingProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
