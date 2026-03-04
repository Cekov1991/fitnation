import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useHistory } from 'react-router-dom';
import { Dumbbell, Mail, AlertCircle, ArrowLeft } from 'lucide-react';
import { authApi } from '../services/api';
import { forgotPasswordSchema, ForgotPasswordFormData } from '../schemas/passwordReset';
import { LoadingButton } from './ui';

const GENERIC_SUCCESS_MESSAGE =
  "If an account exists for this email, we've sent a password reset link.";

export function ForgotPasswordPage() {
  const history = useHistory();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setError(null);
    setSuccess(false);
    try {
      await authApi.forgotPassword(data.email);
      setSuccess(true);
    } catch (err: any) {
      // 422 with validation errors (email required / invalid format): show them
      if (err.status === 422 && err.errors?.email) {
        const first = Array.isArray(err.errors.email) ? err.errors.email[0] : err.errors.email;
        setError(first || err.message);
        return;
      }
      // Any other response (including 422 "user not found"): show generic success to avoid enumeration
      setSuccess(true);
    }
  };

  return (
    <div>
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
              Forgot password?
            </h1>
            <p className="text-sm text-center" style={{ color: 'var(--color-text-secondary)' }}>
              Enter your email and we&apos;ll send you a link to reset your password.
            </p>
          </div>

          <div
            className="border rounded-3xl p-8 shadow-2xl"
            style={{
              backgroundColor: 'var(--color-bg-surface)',
              borderColor: 'var(--color-border)',
            }}
          >
            {success ? (
              <div className="space-y-6">
                <div
                  className="flex items-center gap-3 p-4 rounded-xl border"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--color-primary) 10%, transparent)',
                    borderColor: 'color-mix(in srgb, var(--color-primary) 30%, transparent)',
                  }}
                >
                  <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
                    {GENERIC_SUCCESS_MESSAGE}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => history.push('/login')}
                  className="w-full py-4 rounded-xl font-bold text-lg border transition-colors flex items-center justify-center gap-2"
                  style={{
                    backgroundColor: 'var(--color-bg-elevated)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  <ArrowLeft className="w-5 h-5" />
                  Back to sign in
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {error && (
                  <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <AlertCircle className="text-red-400 w-5 h-5 flex-shrink-0" />
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="email"
                    className="text-sm font-semibold mb-2 block"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    Email address
                  </label>
                  <div className="relative">
                    <Mail
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
                      style={{ color: 'var(--color-text-muted)' }}
                    />
                    <input
                      id="email"
                      type="email"
                      {...register('email')}
                      placeholder="you@example.com"
                      className="w-full pl-12 pr-4 py-4 border rounded-xl focus:outline-none focus:ring-2 transition-all"
                      style={{
                        backgroundColor: 'var(--color-bg-elevated)',
                        borderColor: errors.email ? '#f87171' : 'var(--color-border)',
                        color: 'var(--color-text-primary)',
                      }}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-red-400 mt-1">{errors.email.message}</p>
                  )}
                </div>

                <LoadingButton
                  type="submit"
                  isLoading={isSubmitting}
                  loadingText="Sending..."
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-bold text-lg shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-shadow relative overflow-hidden group"
                >
                  <span className="relative z-10">Send reset link</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </LoadingButton>
              </form>
            )}

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => history.push('/login')}
                className="text-sm font-semibold transition-colors flex items-center gap-1 mx-auto"
                style={{ color: 'var(--color-primary)' }}
              >
                <ArrowLeft className="w-4 h-4" />
                Back to sign in
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
