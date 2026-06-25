import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocation, useHistory } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import AppleSignin from 'react-apple-signin-auth';
import { useAuth } from '../hooks/useAuth';
import { useBranding } from '../hooks/useBranding';
import { loginSchema, LoginFormData } from '@fit-nation/shared';
import { getPartnerSlugFromSubdomain } from '../utils/subdomain';
import { partnersApi } from '@fit-nation/shared';
import { LoadingButton } from './ui';

interface LocationState {
  from?: { pathname: string };
}

interface LoginPageProps {
  onNavigateToRegister?: () => void;
}

export function LoginPage({ onNavigateToRegister }: LoginPageProps) {
  const { login, loginWithSocial } = useAuth();
  const { logo, partnerName, hasBranding } = useBranding();
  const history = useHistory();
  const location = useLocation<LocationState>();
  const navigateToRegister = onNavigateToRegister ?? (() => history.push('/register'));
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [socialLoading, setSocialLoading] = useState<'google' | 'apple' | null>(null);

  async function resolvePartnerId(): Promise<number> {
    const slug = getPartnerSlugFromSubdomain();
    if (!slug) return 1;
    try {
      const { data } = await partnersApi.getActivePartners();
      return data.find((p: any) => p.slug === slug)?.id ?? 1;
    } catch {
      return 1;
    }
  }

  async function handleSocialSuccess(provider: 'google' | 'apple', token: string, name?: string) {
    try {
      setSocialLoading(provider);
      setError(null);
      const partnerId = await resolvePartnerId();
      await loginWithSocial(provider, token, name, partnerId);
      const from = location.state?.from?.pathname || '/';
      history.replace(from);
    } catch (err: any) {
      setError(err.message || `${provider === 'google' ? 'Google' : 'Apple'} sign in failed.`);
    } finally {
      setSocialLoading(null);
    }
  }

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
              <img
                src={hasBranding && logo ? logo : '/logo.png'}
                alt={partnerName || 'Fit Nation'}
                className="w-20 h-20 object-contain mb-6 rounded-2xl"
              />
              <h1
                className="text-3xl font-bold mb-2 bg-clip-text text-transparent"
                style={{ backgroundImage: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))' }}
              >
                Welcome Back
              </h1>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Sign in to {partnerName || 'Fit Nation'}
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
                    onClick={() => history.push('/forgot-password')}
                    className="text-sm transition-colors"
                    style={{ color: 'var(--color-primary)' }}
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Login Button */}
                <LoadingButton
                  type="submit"
                  isLoading={isSubmitting}
                  loadingText="Signing in..."
                  className="w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-shadow relative overflow-hidden group"
                  style={{ backgroundImage: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))' }}
                >
                  <span className="relative z-10">Sign In</span>
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ backgroundImage: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))', filter: 'brightness(1.15)' }}
                  />
                </LoadingButton>
              </form>

              {/* Register Link */}
              <div className="mt-6 text-center">
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  Don't have an account?{' '}
                  <button
                    onClick={navigateToRegister}
                    className="font-semibold transition-colors"
                    style={{ color: 'var(--color-primary)' }}
                  >
                    Sign up
                  </button>
                </p>
              </div>

              {/* Social login */}
              <div className="mt-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 h-px" style={{ backgroundColor: 'var(--color-border)' }} />
                  <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>or continue with</span>
                  <div className="flex-1 h-px" style={{ backgroundColor: 'var(--color-border)' }} />
                </div>

                <div className="flex flex-col gap-3">
                  {/* Google — custom visual over invisible GoogleLogin iframe to keep id_token flow */}
                  <div
                    className="relative w-full rounded-xl overflow-hidden"
                    style={{ height: 48, backgroundColor: 'var(--color-bg-base)', cursor: socialLoading ? 'default' : 'pointer' }}
                  >
                    <div className="absolute inset-0 flex items-center justify-center gap-3 pointer-events-none z-10">
                      {socialLoading === 'google' ? (
                        <span className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--color-border)', borderTopColor: 'var(--color-text-primary)' }} />
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                      )}
                      <span className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>Google</span>
                    </div>
                    <div
                      className="absolute inset-0 z-20 overflow-hidden"
                      style={{ opacity: 0, pointerEvents: socialLoading !== null ? 'none' : 'auto' }}
                    >
                      <GoogleLogin
                        onSuccess={(credentialResponse) => {
                          if (credentialResponse.credential) {
                            handleSocialSuccess('google', credentialResponse.credential);
                          }
                        }}
                        onError={() => setError('Google sign in failed.')}
                        width="500"
                      />
                    </div>
                  </div>

                  <AppleSignin
                    authOptions={{
                      clientId: import.meta.env.VITE_APPLE_SERVICE_ID ?? '',
                      scope: 'email name',
                      redirectURI: import.meta.env.VITE_APPLE_REDIRECT_URI ?? window.location.origin,
                      usePopup: true,
                    }}
                    onSuccess={(response: any) => {
                      const token = response.authorization?.id_token;
                      if (!token) return;
                      const name = [
                        response.user?.name?.firstName,
                        response.user?.name?.lastName,
                      ].filter(Boolean).join(' ') || undefined;
                      handleSocialSuccess('apple', token, name);
                    }}
                    onError={(error: any) => setError(error?.error || 'Apple sign in failed.')}
                    render={(props: any) => (
                      <button
                        {...props}
                        disabled={socialLoading !== null}
                        className="w-full flex items-center justify-center gap-3 rounded-xl font-semibold text-sm transition-opacity hover:opacity-80"
                        style={{
                          height: 48,
                          backgroundColor: 'var(--color-bg-base)',
                          color: 'var(--color-text-primary)',
                          border: 'none',
                        }}
                      >
                        {socialLoading === 'apple' ? (
                          <span className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--color-border)', borderTopColor: 'var(--color-text-primary)' }} />
                        ) : (
                          <svg width="20" height="20" viewBox="1.5 1.5 21 21" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                          </svg>
                        )}
                        Apple
                      </button>
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <p className="text-center text-sm mt-8" style={{ color: 'var(--color-text-muted)' }}>
              By signing in, you agree to our{' '}
              <a href="/terms" className="underline transition-opacity hover:opacity-80" style={{ color: 'var(--color-primary)' }}>Terms of Service</a>
              {' '}and{' '}
              <a href="/privacy" className="underline transition-opacity hover:opacity-80" style={{ color: 'var(--color-primary)' }}>Privacy Policy</a>
              {' · '}
              <a href="/support" className="underline transition-opacity hover:opacity-80" style={{ color: 'var(--color-primary)' }}>Support</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
