import React from 'react';

interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

export function LoadingButton({
  isLoading,
  loadingText,
  children,
  disabled,
  className = '',
  ...props
}: LoadingButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || isLoading}
      className={`${className} disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {isLoading ? (
        <div className="flex items-center justify-center gap-2">
          <div className="w-5 h-5 border-2 border-t-transparent border-current rounded-full animate-spin" />
          <span>{loadingText || 'Loading...'}</span>
        </div>
      ) : (
        children
      )}
    </button>
  );
}
