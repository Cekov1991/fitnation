import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './hooks/useAuth';
import { BrandingProvider } from './hooks/useBranding';
import { ModalsProvider } from './contexts/ModalsContext';
import { InstallPromptProvider } from './contexts/InstallPromptContext';
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
      <InstallPromptProvider>
        <AuthProvider>
          <BrandingProvider>
            <ModalsProvider>
              <AppRoutes />
            </ModalsProvider>
          </BrandingProvider>
        </AuthProvider>
      </InstallPromptProvider>
    </QueryClientProvider>
  );
}
