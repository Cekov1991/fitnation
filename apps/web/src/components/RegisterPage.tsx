import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useHistory } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle, User, Loader2, ChevronDown } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { registerSchema, type RegisterFormData } from '@fit-nation/shared';
import { partnersApi } from '@fit-nation/shared';
import type { PartnerListResource } from '@fit-nation/shared';
import { LoadingButton } from './ui';

export function RegisterPage() {
  const { register: registerUser } = useAuth();
  const history = useHistory();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [partners, setPartners] = useState<PartnerListResource[]>([]);
  const [loadingPartners, setLoadingPartners] = useState(true);
  const [partnersError, setPartnersError] = useState<string | null>(null);
  const [selectedPartner, setSelectedPartner] = useState<PartnerListResource | null>(null);

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
      partner_id: 0,
    },
  });

  async function loadPartners() {
    setLoadingPartners(true);
    setPartnersError(null);
    try {
      const response = await partnersApi.getActivePartners();
      setPartners(response.data);
    } catch {
      setPartnersError('Could not load partners. Please try again.');
    } finally {
      setLoadingPartners(false);
    }
  }

  useEffect(() => {
    loadPartners();
  }, []);

  function handlePartnerChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = parseInt(e.target.value, 10);
    const partner = partners.find(p => p.id === id) ?? null;
    setSelectedPartner(partner);
    setValue('partner_id', id, { shouldValidate: true });
  }

  const onSubmit = async (data: RegisterFormData) => {
    setError(null);
    try {
      await registerUser(data);
      history.replace('/verify-email');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    }
  };

  if (loadingPartners) {
    return (
      <div
        className="min-h-screen w-full flex items-center justify-center px-6"
        style={{ backgroundColor: 'var(--color-bg-base)', color: 'var(--color-text-primary)' }}
      >
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--color-primary)' }} />
          <p style={{ color: 'var(--color-text-secondary)' }}>Loading partners...</p>
        </div>
      </div>
    );
  }

  if (partnersError) {
    return (
      <div
        className="min-h-screen w-full flex items-center justify-center px-6"
        style={{ backgroundColor: 'var(--color-bg-base)', color: 'var(--color-text-primary)' }}
      >
        <div className="w-full max-w-md">
          <div
            className="border rounded-3xl p-8 shadow-2xl"
            style={{ backgroundColor: 'var(--color-bg-surface)', borderColor: 'var(--color-border)' }}
          >
            <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl mb-6">
              <AlertCircle className="text-red-400 w-6 h-6 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-red-400 mb-1">Could not load partners</p>
                <p className="text-xs text-red-400">{partnersError}</p>
              </div>
            </div>
            <button
              onClick={loadPartners}
              className="w-full py-3 rounded-xl font-semibold transition-all hover:shadow-lg"
              style={{ backgroundImage: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))', color: 'var(--color-text-button)' }}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const logoUrl = selectedPartner?.visual_identity?.logo ?? null;

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
            <img
              src={logoUrl || '/logo.png'}
              alt={selectedPartner?.name || 'Fit Nation'}
              className="w-20 h-20 object-contain mb-6 rounded-2xl"
            />
            <h1
              className="text-3xl font-bold mb-2 bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))' }}
            >
              Create Your Account
            </h1>
            <p className="text-sm text-center" style={{ color: 'var(--color-text-secondary)' }}>
              {selectedPartner
                ? `Join ${selectedPartner.name} and start your fitness journey`
                : 'Select your gym to get started'}
            </p>
          </div>

          {/* Registration Form */}
          <div
            className="border rounded-3xl p-8 shadow-2xl"
            style={{ backgroundColor: 'var(--color-bg-surface)', borderColor: 'var(--color-border)' }}
          >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <AlertCircle className="text-red-400 w-5 h-5 flex-shrink-0" />
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              {/* Partner selector */}
              <div>
                <label
                  htmlFor="partner_id"
                  className="text-sm font-semibold mb-2 block"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Your Gym / Partner
                </label>
                <div className="relative">
                  <select
                    id="partner_id"
                    onChange={handlePartnerChange}
                    defaultValue=""
                    className="w-full pl-4 pr-10 py-4 border rounded-xl focus:outline-none focus:ring-2 transition-all appearance-none"
                    style={{
                      backgroundColor: 'var(--color-bg-elevated)',
                      borderColor: errors.partner_id ? '#f87171' : 'var(--color-border)',
                      color: selectedPartner ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                    }}
                  >
                    <option value="" disabled>Select a partner...</option>
                    {partners.map(p => (
                      <option key={p.id} value={p.id} style={{ color: 'var(--color-text-primary)' }}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                    style={{ color: 'var(--color-text-muted)' }}
                  />
                </div>
                {errors.partner_id && (
                  <p className="text-xs text-red-400 mt-1">{errors.partner_id.message}</p>
                )}
              </div>

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
                    onFocus={(e) => { if (!errors.name) e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--color-primary) 50%, transparent)'; }}
                    onBlur={(e) => { if (!errors.name) e.currentTarget.style.borderColor = 'var(--color-border)'; }}
                  />
                </div>
                {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name.message}</p>}
              </div>

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
                    autoComplete="email"
                    className="w-full pl-12 pr-4 py-4 border rounded-xl focus:outline-none focus:ring-2 transition-all"
                    style={{
                      backgroundColor: 'var(--color-bg-elevated)',
                      borderColor: errors.email ? '#f87171' : 'var(--color-border)',
                      color: 'var(--color-text-primary)'
                    }}
                    onFocus={(e) => { if (!errors.email) e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--color-primary) 50%, transparent)'; }}
                    onBlur={(e) => { if (!errors.email) e.currentTarget.style.borderColor = 'var(--color-border)'; }}
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
                    placeholder="At least 8 characters"
                    className="w-full pl-12 pr-12 py-4 border rounded-xl focus:outline-none focus:ring-2 transition-all"
                    style={{
                      backgroundColor: 'var(--color-bg-elevated)',
                      borderColor: errors.password ? '#f87171' : 'var(--color-border)',
                      color: 'var(--color-text-primary)'
                    }}
                    onFocus={(e) => { if (!errors.password) e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--color-primary) 50%, transparent)'; }}
                    onBlur={(e) => { if (!errors.password) e.currentTarget.style.borderColor = 'var(--color-border)'; }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
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
                    onFocus={(e) => { if (!errors.password_confirmation) e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--color-primary) 50%, transparent)'; }}
                    onBlur={(e) => { if (!errors.password_confirmation) e.currentTarget.style.borderColor = 'var(--color-border)'; }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password_confirmation && <p className="text-xs text-red-400 mt-1">{errors.password_confirmation.message}</p>}
              </div>

              {/* Register Button */}
              <LoadingButton
                type="submit"
                isLoading={isSubmitting}
                loadingText="Creating account..."
                className="w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-shadow relative overflow-hidden group"
                style={{ backgroundImage: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))' }}
              >
                <span className="relative z-10">Create Account</span>
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ backgroundImage: 'linear-gradient(to right, var(--color-primary), var(--color-secondary))', filter: 'brightness(1.15)' }}
                />
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
            By creating an account, you agree to our{' '}
            <a href="/terms" className="underline transition-opacity hover:opacity-80" style={{ color: 'var(--color-primary)' }}>Terms of Service</a>
            {' '}and{' '}
            <a href="/privacy" className="underline transition-opacity hover:opacity-80" style={{ color: 'var(--color-primary)' }}>Privacy Policy</a>
            {' · '}
            <a href="/support" className="underline transition-opacity hover:opacity-80" style={{ color: 'var(--color-primary)' }}>Support</a>
          </p>
        </div>
      </div>
    </div>
  );
}
