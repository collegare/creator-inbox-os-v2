import { useState } from 'react';
import { Mail, ArrowRight, AlertCircle, Inbox, LayoutDashboard, Sparkles } from 'lucide-react';

const FEATURES = [
  {
    icon: Inbox,
    title: 'Inbox Management',
    desc: 'Manage every brand email and collab request in one place.',
  },
  {
    icon: LayoutDashboard,
    title: 'Pipeline & CRM',
    desc: 'Track deals from first contact to signed contract.',
  },
  {
    icon: Sparkles,
    title: 'AI Prompt Studio',
    desc: 'Draft replies, negotiate rates, and write pitches faster.',
  },
];

export default function LoginPage({ onLogin }) {
  const [email, setEmail]     = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const allowedRaw = import.meta.env.VITE_ALLOWED_EMAILS || '';
  const allowedSet = allowedRaw
    ? new Set(allowedRaw.split(',').map(e => e.trim().toLowerCase()).filter(Boolean))
    : null;

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
    setTimeout(() => {
      onLogin(trimmed);
      setLoading(false);
    }, 400);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">

      {/* ── LEFT PANEL ─────────────────────────────────────────── */}
      <div
        className="hidden md:flex flex-col w-[300px] lg:w-[340px] shrink-0 min-h-screen px-8 py-10"
        style={{ backgroundColor: '#1c1f2e' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 mb-12">
          <div className="w-9 h-9 rounded-sm flex items-center justify-center font-bold text-base bg-[#6b1309] text-white shrink-0">
            C
          </div>
          <div>
            <span className="block text-[13px] font-semibold text-white tracking-tight leading-tight">Creator Inbox OS</span>
            <span className="block text-[11px] text-white/40 mt-0.5">by Collegare Studio</span>
          </div>
        </div>

        {/* Headline */}
        <div className="mb-10">
          <h2 className="text-3xl font-bold text-white leading-snug">
            Your inbox,<br />
            <span style={{ color: '#d4705f' }}>finally organized.</span>
          </h2>
          <p className="mt-4 text-sm text-white/50 leading-relaxed">
            Manage your brand deals, reply faster, and grow your creator business — all from one OS.
          </p>
        </div>

        {/* Feature list */}
        <div className="flex flex-col gap-5">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-sm flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
                <Icon size={15} style={{ color: '#d4705f' }} />
              </div>
              <div>
                <p className="text-[13px] font-medium text-white/90 leading-tight">{title}</p>
                <p className="text-[12px] text-white/40 mt-0.5 leading-snug">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Spacer + footer */}
        <div className="mt-auto pt-10">
          <p className="text-[11px] text-white/25">v2.0 &middot; Collegare Studio</p>
        </div>
      </div>

      {/* ── RIGHT PANEL ────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center bg-brand-bg min-h-screen px-6 py-12">
        <div className="w-full max-w-[380px]">

          {/* Mobile logo (hidden on desktop) */}
          <div className="flex items-center gap-3 mb-10 md:hidden">
            <div className="w-9 h-9 rounded-sm flex items-center justify-center font-bold text-base bg-brand-text text-white shrink-0">C</div>
            <div>
              <span className="block text-[13px] font-semibold text-brand-text">Creator Inbox OS</span>
              <span className="block text-[11px] text-brand-text-muted mt-0.5">by Collegare Studio</span>
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-2xl font-bold text-brand-text mb-1">Welcome back</h1>
          <p className="text-sm text-brand-text-sec mb-8">
            Sign in with your email to access your Creator Inbox OS.
          </p>

          {/* Info notice */}
          <div className="mb-7 flex items-start gap-2.5 rounded-sm px-4 py-3 text-xs leading-relaxed text-brand-info" style={{ backgroundColor: 'var(--c-info-bg)' }}>
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <span>
              Access is available to active subscribers. If this is your first time, use the email linked to your purchase.
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate>
            <label className="block text-xs font-medium text-brand-text-sec mb-1.5" htmlFor="login-email">
              Email Address
            </label>
            <div className="relative mb-5">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted pointer-events-none" />
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                placeholder="you@example.com"
                className="
                  w-full pl-9 pr-4 py-2.5 rounded-sm text-sm
                  bg-brand-surface border border-brand-border
                  text-brand-text placeholder:text-brand-text-muted
                  focus:outline-none focus:ring-2 focus:ring-brand-primary/25 focus:border-brand-primary
                  transition-colors
                "
                disabled={loading}
              />
            </div>

            {error && (
              <div className="mb-4 flex items-start gap-2 text-xs text-brand-danger">
                <AlertCircle size={13} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="
                w-full flex items-center justify-center gap-2
                text-white text-sm font-medium
                py-2.5 rounded-sm
                hover:opacity-90 active:opacity-80
                transition-opacity disabled:opacity-60
              "
              style={{ backgroundColor: '#1c1f2e' }}
            >
              {loading ? 'Signing in…' : (
                <><ArrowRight size={15} /> Sign In</>
              )}
            </button>
          </form>

          {/* Footer links */}
          <p className="text-center text-xs text-brand-text-muted mt-8">
            Need access?{' '}
            <span className="text-brand-text-sec">Contact hello@collegarestudio.com</span>
          </p>
        </div>
      </div>
    </div>
  );
}
