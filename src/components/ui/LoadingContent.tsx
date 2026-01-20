import { ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface LoadingContentProps {
  /** Query loading state (initial load) */
  isLoading?: boolean;
  /** Query error state */
  isError?: boolean;
  /** Error object or message */
  error?: Error | string | null;
  /** Content to display when data is ready */
  children: ReactNode;
  /** Custom loading skeleton/spinner */
  loadingFallback?: ReactNode;
  /** Custom error component */
  errorFallback?: ReactNode;
  /** Retry function (typically query refetch) */
  onRetry?: () => void;
  /** Show compact loading indicator (inline) */
  compact?: boolean;
}

export function LoadingContent({
  isLoading,
  isError,
  error,
  children,
  loadingFallback,
  errorFallback,
  onRetry,
  compact = false,
}: LoadingContentProps) {
  // Loading state
  if (isLoading) {
    if (loadingFallback) return <>{loadingFallback}</>;

    if (compact) {
      return (
        <div className="flex items-center justify-center gap-2 py-4">
          <div 
            className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }}
          />
          <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Loading...
          </span>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div 
          className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin mb-4"
          style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }}
        />
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Loading...
        </p>
      </div>
    );
  }

  // Error state
  if (isError) {
    if (errorFallback) return <>{errorFallback}</>;

    const errorMessage = error instanceof Error ? error.message : error || 'Something went wrong';

    return (
      <div 
        className="flex flex-col items-center justify-center py-8 px-4 rounded-2xl border"
        style={{ 
          backgroundColor: 'color-mix(in srgb, #ef4444 10%, transparent)',
          borderColor: 'color-mix(in srgb, #ef4444 30%, transparent)'
        }}
      >
        <AlertCircle className="w-10 h-10 text-red-400 mb-3" />
        <p className="text-sm text-red-400 text-center mb-4">{errorMessage}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            style={{ 
              backgroundColor: 'color-mix(in srgb, #ef4444 20%, transparent)',
              color: '#f87171'
            }}
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        )}
      </div>
    );
  }

  // Success state - render children
  return <>{children}</>;
}
