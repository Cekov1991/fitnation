import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocation, useHistory } from 'react-router-dom';
import { Dumbbell, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { loginSchema, LoginFormData } from '../schemas/login';
import { LoadingButton } from './ui';

interface LocationState {
  from?: { pathname: string };
}

interface LoginPageProps {
  onNavigateToRegister?: () => void;
}

export function LoginPage({ onNavigateToRegister }: LoginPageProps) {
  const { login } = useAuth();
  const history = useHistory();
  const location = useLocation<LocationState>();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setError(null);
    try {
      await login(data.email, data.password);
      // Redirect to the page they tried to visit or home
      const from = location.state?.from?.pathname || '/';
      history.replace(from);
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    }
  };

  return (
    <div>
      <div>
        <div 
          className="min-h-screen w-full flex items-center justify-center px-6"
          style={{ backgroundColor: 'var(--color-bg-base)', color: 'var(--color-text-primary)' }}
        >
          {/* Background Gradients */}
          <div className="fixed inset-0 z-0 pointer-events-none">
            <div 
              className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full   opacity-30" 
              style={{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 20%, transparent)' }}
            />
            <div 
              className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full   opacity-30" 
              style={{ backgroundColor: 'color-mix(in srgb, var(--color-secondary) 20%, transparent)' }}
            />
          </div>

          <div className="relative z-10 w-full max-w-md">
            {/* Logo and Header */}
            <div className="flex flex-col items-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-tr from-blue-500 to-purple-600 rounded-3xl shadow-2xl shadow-blue-500/30 mb-6 flex items-center justify-center">
                <Dumbbell className="text-white w-10 h-10" />
              </div>
              <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Welcome Back
              </h1>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Sign in to continue your fitness journey
              </p>
            </div>

            {/* Login Form */}
            <div className="  border rounded-3xl p-8 shadow-2xl"
              style={{ 
                backgroundColor: 'var(--color-bg-surface)',
                borderColor: 'var(--color-border)'
              }}
            >
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Error Message */}
                {error && (
                  <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <AlertCircle className="text-red-400 w-5 h-5 flex-shrink-0" />
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                )}

                {/* Email Field */}
                <div>
                  <label
                    htmlFor="email"
                    className="text-sm font-semibold mb-2 block"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--color-text-muted)' }} />
                    <input
                      id="email"
                      type="email"
                      {...register('email')}
                      placeholder="you@example.com"
                      className="w-full pl-12 pr-4 py-4 border rounded-xl focus:outline-none focus:ring-2 transition-all"
                      style={{ 
                        backgroundColor: 'var(--color-bg-elevated)',
                        borderColor: errors.email ? '#f87171' : 'var(--color-border)',
                        color: 'var(--color-text-primary)'
                      }}
                      onFocus={(e) => {
                        if (!errors.email) {
                          e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--color-primary) 50%, transparent)';
                        }
                      }}
                      onBlur={(e) => {
                        if (!errors.email) {
                          e.currentTarget.style.borderColor = 'var(--color-border)';
                        }
                      }}
                    />
                  </div>
                  {errors.email && <p className="text-xs text-red-400 mt-1">{errors.email.message}</p>}
                </div>

                {/* Password Field */}
                <div>
                  <label
                    htmlFor="password"
                    className="text-sm font-semibold mb-2 block"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--color-text-muted)' }} />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      {...register('password')}
                      placeholder="Enter your password"
                      className="w-full pl-12 pr-12 py-4 border rounded-xl focus:outline-none focus:ring-2 transition-all"
                      style={{ 
                        backgroundColor: 'var(--color-bg-elevated)',
                        borderColor: errors.password ? '#f87171' : 'var(--color-border)',
                        color: 'var(--color-text-primary)'
                      }}
                      onFocus={(e) => {
                        if (!errors.password) {
                          e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--color-primary) 50%, transparent)';
                        }
                      }}
                      onBlur={(e) => {
                        if (!errors.password) {
                          e.currentTarget.style.borderColor = 'var(--color-border)';
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                      style={{ color: 'var(--color-text-muted)' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = 'var(--color-text-secondary)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'var(--color-text-muted)';
                      }}
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-red-400 mt-1">{errors.password.message}</p>}
                </div>

                {/* Forgot Password Link */}
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="text-sm transition-colors"
                    style={{ color: 'var(--color-primary)' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = '0.8';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = '1';
                    }}
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Login Button */}
                <LoadingButton
                  type="submit"
                  isLoading={isSubmitting}
                  loadingText="Signing in..."
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-bold text-lg shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-shadow relative overflow-hidden group"
                >
                  <span className="relative z-10">Sign In</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </LoadingButton>
              </form>

              {/* Register Link */}
              {onNavigateToRegister && (
                <div className="mt-6 text-center">
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    Don't have an account?{' '}
                    <button
                      onClick={onNavigateToRegister}
                      className="font-semibold transition-colors"
                      style={{ color: 'var(--color-primary)' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = 'color-mix(in srgb, var(--color-primary) 80%, transparent)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'var(--color-primary)';
                      }}
                    >
                      Sign up
                    </button>
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <p className="text-center text-sm mt-8" style={{ color: 'var(--color-text-muted)' }}>
              By signing in, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
