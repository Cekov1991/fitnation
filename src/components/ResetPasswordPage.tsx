import { useState, useMemo, useEffect } from 'react';
import { useForm, type FieldErrors, type UseFormRegister, type UseFormHandleSubmit } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useHistory, useLocation, useParams } from 'react-router-dom';
import { Dumbbell, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { authApi } from '../services/api';
import { resetPasswordSchema, ResetPasswordFormData } from '../schemas/passwordReset';
import { LoadingButton } from './ui';

function MissingLinkView({
  onRequestNewLink,
  onBackToLogin,
}: {
  onRequestNewLink: () => void;
  onBackToLogin: () => void;
}) {
  return (
    <div
      className="min-h-screen w-full flex items-center justify-center px-6"
      style={{ backgroundColor: 'var(--color-bg-base)', color: 'var(--color-text-primary)' }}
    >
      <div className="relative z-10 w-full max-w-md">
        <div
          className="border rounded-3xl p-8 shadow-2xl text-center"
          style={{
            backgroundColor: 'var(--color-bg-surface)',
            borderColor: 'var(--color-border)',
          }}
        >
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-amber-400" />
          <h2 className="text-xl font-bold mb-2">Missing reset link</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>
            This page needs a valid reset link (with token and email). If your link expired or
            didn’t open correctly, request a new one.
          </p>
          <button
            type="button"
            onClick={onRequestNewLink}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-bold text-lg text-white shadow-lg"
          >
            Request a new link
          </button>
          <button
            type="button"
            onClick={onBackToLogin}
            className="w-full mt-4 py-3 rounded-xl font-medium"
            style={{ color: 'var(--color-primary)' }}
          >
            Back to sign in
          </button>
        </div>
      </div>
    </div>
  );
}

function ResetSuccessView({ onGoToLogin }: { onGoToLogin: () => void }) {
  useEffect(() => {
    const t = setTimeout(() => onGoToLogin(), 2000);
    return () => clearTimeout(t);
  }, [onGoToLogin]);

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center px-6"
      style={{ backgroundColor: 'var(--color-bg-base)', color: 'var(--color-text-primary)' }}
    >
      <div className="relative z-10 w-full max-w-md">
        <div
          className="border rounded-3xl p-8 shadow-2xl text-center"
          style={{
            backgroundColor: 'var(--color-bg-surface)',
            borderColor: 'var(--color-border)',
          }}
        >
          <div
            className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--color-primary) 20%, transparent)',
            }}
          >
            <Lock className="w-8 h-8" style={{ color: 'var(--color-primary)' }} />
          </div>
          <h2 className="text-xl font-bold mb-2">Password reset</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>
            Your password has been reset. Redirecting you to sign in...
          </p>
          <button
            type="button"
            onClick={onGoToLogin}
            className="text-sm font-semibold"
            style={{ color: 'var(--color-primary)' }}
          >
            Go to sign in now
          </button>
        </div>
      </div>
    </div>
  );
}

interface ResetPasswordFormViewProps {
  error: string | null;
  isInvalidOrExpiredLink: boolean;
  onRequestNewLink: () => void;
  register: UseFormRegister<ResetPasswordFormData>;
  handleSubmit: UseFormHandleSubmit<ResetPasswordFormData>;
  errors: FieldErrors<ResetPasswordFormData>;
  isSubmitting: boolean;
  onSubmit: (data: ResetPasswordFormData) => void;
  showPassword: boolean;
  setShowPassword: (v: boolean) => void;
  showConfirmPassword: boolean;
  setShowConfirmPassword: (v: boolean) => void;
}

function ResetPasswordFormView({
  error,
  isInvalidOrExpiredLink,
  onRequestNewLink,
  register,
  handleSubmit,
  errors,
  isSubmitting,
  onSubmit,
  showPassword,
  setShowPassword,
  showConfirmPassword,
  setShowConfirmPassword,
}: ResetPasswordFormViewProps) {
  return (
    <div
      className="min-h-screen w-full flex items-center justify-center px-6"
      style={{ backgroundColor: 'var(--color-bg-base)', color: 'var(--color-text-primary)' }}
    >
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div
          className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full opacity-30"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-primary) 20%, transparent)',
          }}
        />
        <div
          className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-30"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-secondary) 20%, transparent)',
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-tr from-blue-500 to-purple-600 rounded-3xl shadow-2xl shadow-blue-500/30 mb-6 flex items-center justify-center">
            <Dumbbell className="text-white w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            New password
          </h1>
          <p className="text-sm text-center" style={{ color: 'var(--color-text-secondary)' }}>
            Enter your new password below.
          </p>
        </div>

        <div
          className="border rounded-3xl p-8 shadow-2xl"
          style={{
            backgroundColor: 'var(--color-bg-surface)',
            borderColor: 'var(--color-border)',
          }}
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                <AlertCircle className="text-red-400 w-5 h-5 flex-shrink-0" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {isInvalidOrExpiredLink && (
              <button
                type="button"
                onClick={onRequestNewLink}
                className="text-sm font-semibold w-full py-2 rounded-lg border"
                style={{
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-primary)',
                }}
              >
                Request a new link
              </button>
            )}

            <div>
              <label
                htmlFor="password"
                className="text-sm font-semibold mb-2 block"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                New password
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
                  style={{ color: 'var(--color-text-muted)' }}
                />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  placeholder="At least 8 characters"
                  className="w-full pl-12 pr-12 py-4 border rounded-xl focus:outline-none focus:ring-2 transition-all"
                  style={{
                    backgroundColor: 'var(--color-bg-elevated)',
                    borderColor: errors.password ? '#f87171' : 'var(--color-border)',
                    color: 'var(--color-text-primary)',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-400 mt-1">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="password_confirmation"
                className="text-sm font-semibold mb-2 block"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Confirm password
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
                  style={{ color: 'var(--color-text-muted)' }}
                />
                <input
                  id="password_confirmation"
                  type={showConfirmPassword ? 'text' : 'password'}
                  {...register('password_confirmation')}
                  placeholder="Confirm your password"
                  className="w-full pl-12 pr-12 py-4 border rounded-xl focus:outline-none focus:ring-2 transition-all"
                  style={{
                    backgroundColor: 'var(--color-bg-elevated)',
                    borderColor: errors.password_confirmation ? '#f87171' : 'var(--color-border)',
                    color: 'var(--color-text-primary)',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.password_confirmation && (
                <p className="text-xs text-red-400 mt-1">
                  {errors.password_confirmation.message}
                </p>
              )}
            </div>

            <LoadingButton
              type="submit"
              isLoading={isSubmitting}
              loadingText="Resetting..."
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-bold text-lg shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-shadow relative overflow-hidden group"
            >
              <span className="relative z-10">Reset password</span>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </LoadingButton>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={onRequestNewLink}
              className="text-sm font-semibold transition-colors"
              style={{ color: 'var(--color-primary)' }}
            >
              Request a new link
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ResetPasswordPage() {
  const history = useHistory();
  const location = useLocation<{ token?: string; email?: string }>();
  const params = useParams<{ token?: string }>();
  const search = useMemo(() => new URLSearchParams(location.search), [location.search]);

  const token = params.token ?? location.state?.token ?? search.get('token') ?? '';
  const email = location.state?.email ?? search.get('email') ?? '';

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isInvalidOrExpiredLink, setIsInvalidOrExpiredLink] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', password_confirmation: '' },
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    setError(null);
    setIsInvalidOrExpiredLink(false);
    try {
      await authApi.resetPassword({
        token,
        email: decodeURIComponent(email),
        password: data.password,
        password_confirmation: data.password_confirmation,
      });
      setSuccess(true);
    } catch (err: any) {
      const msg = err.message || 'Something went wrong.';
      const isInvalidToken =
        err.status === 422 &&
        (msg.toLowerCase().includes('token') || msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('expired'));
      if (isInvalidToken) {
        setError('This password reset link is invalid or has expired.');
        setIsInvalidOrExpiredLink(true);
      } else {
        if (err.errors?.password) {
          const first = Array.isArray(err.errors.password) ? err.errors.password[0] : err.errors.password;
          setError(first);
        } else if (err.errors?.password_confirmation) {
          const first = Array.isArray(err.errors.password_confirmation)
            ? err.errors.password_confirmation[0]
            : err.errors.password_confirmation;
          setError(first);
        } else {
          setError(msg);
        }
      }
    }
  };

  if (!token || !email) {
    return (
      <MissingLinkView
        onRequestNewLink={() => history.push('/forgot-password')}
        onBackToLogin={() => history.push('/login')}
      />
    );
  }

  if (success) {
    return <ResetSuccessView onGoToLogin={() => history.replace('/login')} />;
  }

  return (
    <ResetPasswordFormView
      error={error}
      isInvalidOrExpiredLink={isInvalidOrExpiredLink}
      onRequestNewLink={() => history.push('/forgot-password')}
      register={register}
      handleSubmit={handleSubmit}
      errors={errors}
      isSubmitting={isSubmitting}
      onSubmit={onSubmit}
      showPassword={showPassword}
      setShowPassword={setShowPassword}
      showConfirmPassword={showConfirmPassword}
      setShowConfirmPassword={setShowConfirmPassword}
    />
  );
}
