import { useState } from 'react';
import { Mail, ArrowRight, AlertCircle } from 'lucide-react';

export default function LoginPage({ onLogin }) {
  const [email, setEmail]     = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const allowedRaw = import.meta.env.VITE_ALLOWED_EMAILS || '';
  const allowedSet = allowedRaw
    ? new Set(allowedRaw.split(',').map(e => e.trim().toLowerCase()).filter(Boolean))
    : null; // null = no restriction, any email works

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    const trimmed = email.trim().toLowerCase();

    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (allowedSet && !allowedSet.has(trimmed)) {
      setError('This email is not on the subscriber list. Please check your email or contact support.');
      return;
    }

    setLoading(true);
    // Small delay for UX feel, then sign in
    setTimeout(() => {
      onLogin(trimmed);
      setLoading(false);
    }, 400);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-bg px-4">
      <div className="w-full max-w-[400px]">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-10 justify-center">
          <div className="w-10 h-10 rounded-sm flex items-center justify-center text-lg font-bold bg-brand-text text-white shrink-0">
            C
          </div>
          <div className="text-left">
            <span className="block text-sm font-semibold text-brand-text tracking-tight">Creator Inbox OS</span>
            <span className="block text-[11px] text-brand-text-muted mt-0.5">by Collegare Studio</span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-brand-surface rounded-lg shadow-md border border-brand-border p-8">
          <h1 className="text-xl font-semibold text-brand-text mb-1">Subscriber login</h1>
          <p className="text-sm text-brand-text-sec mb-7">
            Enter the email address linked to your subscription.
          </p>

          <form onSubmit={handleSubmit} noValidate>
            <label className="block text-xs font-medium text-brand-text-sec mb-1.5" htmlFor="login-email">
              Email address
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted pointer-events-none" />
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                placeholder="you@example.com"
                className="
                  w-full pl-9 pr-4 py-2.5 rounded-sm text-sm
                  bg-brand-bg border border-brand-border
                  text-brand-text placeholder:text-brand-text-muted
                  focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary
                  transition-colors
                "
                disabled={loading}
              />
            </div>

            {error && (
              <div className="mt-3 flex items-start gap-2 text-xs text-brand-danger">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="
                mt-5 w-full flex items-center justify-center gap-2
                bg-brand-text text-white text-sm font-medium
                py-2.5 rounded-sm
                hover:opacity-90 active:opacity-80
                transition-opacity disabled:opacity-60
              "
            >
              {loading ? 'Signing in…' : (
                <>Continue <ArrowRight size={15} /></>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-brand-text-muted mt-6">
          Need access? Contact <span className="text-brand-text-sec">hello@collegarestudio.com</span>
        </p>
      </div>
    </div>
  );
}
