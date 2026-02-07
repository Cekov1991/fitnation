import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocation, useHistory } from 'react-router-dom';
import { Dumbbell, Mail, Lock, Eye, EyeOff, AlertCircle, User, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { registerSchema, RegisterFormData } from '../schemas/register';
import { LoadingButton } from './ui';
import { authApi } from '../services/api';
import type { InvitationResource } from '../types/api';

export function RegisterPage() {
  const { register: registerUser } = useAuth();
  const history = useHistory();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invitation, setInvitation] = useState<InvitationResource | null>(null);
  const [validatingInvitation, setValidatingInvitation] = useState(true);
  const [invitationError, setInvitationError] = useState<string | null>(null);

  // Extract invitation token from URL
  const searchParams = new URLSearchParams(location.search);
  const invitationToken = searchParams.get('invitation');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      password_confirmation: '',
    },
  });

  // Validate invitation token on mount
  useEffect(() => {
    const validateToken = async () => {
      if (!invitationToken) {
        setInvitationError('No invitation token provided. Please use the invitation link from your email.');
        setValidatingInvitation(false);
        return;
      }

      try {
        const response = await authApi.validateInvitation(invitationToken);
        setInvitation(response.data);
        // Pre-fill email from invitation
        setValue('email', response.data.email);
        setValidatingInvitation(false);
      } catch (err: any) {
        const errorMessage = err.message || 'Invalid or expired invitation token';
        setInvitationError(errorMessage);
        setValidatingInvitation(false);
      }
    };

    validateToken();
  }, [invitationToken, setValue]);

  const onSubmit = async (data: RegisterFormData) => {
    if (!invitationToken) {
      setError('No invitation token found');
      return;
    }

    setError(null);
    try {
      await registerUser({
        name: data.name,
        email: data.email,
        password: data.password,
        password_confirmation: data.password_confirmation,
        invitation_token: invitationToken,
      });
      // Redirect to onboarding after successful registration
      history.replace('/onboarding');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    }
  };

  // Show loading state while validating invitation
  if (validatingInvitation) {
    return (
      <div
        className="min-h-screen w-full flex items-center justify-center px-6"
        style={{ backgroundColor: 'var(--color-bg-base)', color: 'var(--color-text-primary)' }}
      >
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--color-primary)' }} />
          <p style={{ color: 'var(--color-text-secondary)' }}>Validating invitation...</p>
        </div>
      </div>
    );
  }

  // Show error state if invitation is invalid
  if (invitationError || !invitation) {
    return (
      <div
        className="min-h-screen w-full flex items-center justify-center px-6"
        style={{ backgroundColor: 'var(--color-bg-base)', color: 'var(--color-text-primary)' }}
      >
        <div className="w-full max-w-md">
          <div className="border rounded-3xl p-8 shadow-2xl"
            style={{
              backgroundColor: 'var(--color-bg-surface)',
              borderColor: 'var(--color-border)'
            }}
          >
            <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl mb-6">
              <AlertCircle className="text-red-400 w-6 h-6 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-red-400 mb-1">Invalid Invitation</p>
                <p className="text-xs text-red-400">{invitationError}</p>
              </div>
            </div>
            <button
              onClick={() => history.push('/login')}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-semibold transition-all hover:shadow-lg"
              style={{ color: 'var(--color-text-button)' }}
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        className="min-h-screen w-full flex items-center justify-center px-6"
        style={{ backgroundColor: 'var(--color-bg-base)', color: 'var(--color-text-primary)' }}
      >
        {/* Background Gradients */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div
            className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full opacity-30"
            style={{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 20%, transparent)' }}
          />
          <div
            className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-30"
            style={{ backgroundColor: 'color-mix(in srgb, var(--color-secondary) 20%, transparent)' }}
          />
        </div>

        <div className="relative z-10 w-full max-w-md">
          {/* Logo and Header */}
          <div className="flex flex-col items-center mb-8">
            {/* Partner Logo if available */}
            {invitation.partner.visual_identity?.logo ? (
              <img
                src={invitation.partner.visual_identity.logo}
                alt={invitation.partner.name}
                className="w-20 h-20 object-contain mb-6 rounded-2xl"
              />
            ) : (
              <div className="w-20 h-20 bg-gradient-to-tr from-blue-500 to-purple-600 rounded-3xl shadow-2xl shadow-blue-500/30 mb-6 flex items-center justify-center">
                <Dumbbell className="text-white w-10 h-10" />
              </div>
            )}
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Create Your Account
            </h1>
            <p className="text-sm text-center" style={{ color: 'var(--color-text-secondary)' }}>
              Join {invitation.partner.name} and start your fitness journey
            </p>
          </div>

          {/* Registration Form */}
          <div
            className="border rounded-3xl p-8 shadow-2xl"
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

              {/* Name Field */}
              <div>
                <label
                  htmlFor="name"
                  className="text-sm font-semibold mb-2 block"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--color-text-muted)' }} />
                  <input
                    id="name"
                    type="text"
                    {...register('name')}
                    placeholder="John Doe"
                    className="w-full pl-12 pr-4 py-4 border rounded-xl focus:outline-none focus:ring-2 transition-all"
                    style={{
                      backgroundColor: 'var(--color-bg-elevated)',
                      borderColor: errors.name ? '#f87171' : 'var(--color-border)',
                      color: 'var(--color-text-primary)'
                    }}
                    onFocus={(e) => {
                      if (!errors.name) {
                        e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--color-primary) 50%, transparent)';
                      }
                    }}
                    onBlur={(e) => {
                      if (!errors.name) {
                        e.currentTarget.style.borderColor = 'var(--color-border)';
                      }
                    }}
                  />
                </div>
                {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name.message}</p>}
              </div>

              {/* Email Field (readonly) */}
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
                    readOnly
                    className="w-full pl-12 pr-4 py-4 border rounded-xl focus:outline-none transition-all cursor-not-allowed opacity-75"
                    style={{
                      backgroundColor: 'var(--color-bg-elevated)',
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-text-primary)'
                    }}
                  />
                </div>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                  This email is from your invitation
                </p>
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
                    placeholder="At least 8 characters"
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

              {/* Confirm Password Field */}
              <div>
                <label
                  htmlFor="password_confirmation"
                  className="text-sm font-semibold mb-2 block"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--color-text-muted)' }} />
                  <input
                    id="password_confirmation"
                    type={showConfirmPassword ? 'text' : 'password'}
                    {...register('password_confirmation')}
                    placeholder="Re-enter your password"
                    className="w-full pl-12 pr-12 py-4 border rounded-xl focus:outline-none focus:ring-2 transition-all"
                    style={{
                      backgroundColor: 'var(--color-bg-elevated)',
                      borderColor: errors.password_confirmation ? '#f87171' : 'var(--color-border)',
                      color: 'var(--color-text-primary)'
                    }}
                    onFocus={(e) => {
                      if (!errors.password_confirmation) {
                        e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--color-primary) 50%, transparent)';
                      }
                    }}
                    onBlur={(e) => {
                      if (!errors.password_confirmation) {
                        e.currentTarget.style.borderColor = 'var(--color-border)';
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {errors.password_confirmation && <p className="text-xs text-red-400 mt-1">{errors.password_confirmation.message}</p>}
              </div>

              {/* Register Button */}
              <LoadingButton
                type="submit"
                isLoading={isSubmitting}
                loadingText="Creating account..."
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-bold text-lg shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-shadow relative overflow-hidden group"
              >
                <span className="relative z-10">Create Account</span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </LoadingButton>
            </form>

            {/* Login Link */}
            <div className="mt-6 text-center">
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Already have an account?{' '}
                <button
                  onClick={() => history.push('/login')}
                  className="font-semibold transition-colors"
                  style={{ color: 'var(--color-primary)' }}
                >
                  Sign in
                </button>
              </p>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-sm mt-8" style={{ color: 'var(--color-text-muted)' }}>
            By creating an account, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
