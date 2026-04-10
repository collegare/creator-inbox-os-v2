import { useState } from 'react';
import { useTheme, useSubscriberAuth } from '../contexts';
import {
  Home, Columns3, Briefcase, Mail, MessageSquareText, Sparkles,
  CalendarDays, Search, ListChecks, Settings, Menu, X, Moon, Sun, LogOut,
} from 'lucide-react';

const ICON_MAP = { Home, Columns3, Briefcase, Mail, MessageSquareText, Sparkles, CalendarDays, Search, ListChecks, Settings };

export default function Layout({ tabs, activeTab, onTabChange, children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggle } = useTheme();
  const { subscriberEmail, subscriberLogout } = useSubscriberAuth();

  const handleNav = (id) => { onTabChange(id); setMobileOpen(false); };

  return (
    <div className="flex min-h-screen">
      {/* ---------- SIDEBAR ---------- */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 flex flex-col w-[260px] text-white
        transition-transform duration-300
        max-md:-translate-x-full ${mobileOpen ? 'max-md:translate-x-0' : ''}
      `} style={{ backgroundColor: '#2d2319' }}>
        {/* Brand */}
        <div className="flex items-center gap-3.5 px-6 pt-7 pb-5 border-b border-white/[0.08]">
          <div className="w-10 h-10 rounded-sm flex items-center justify-center text-lg font-bold bg-brand-primary text-white shrink-0">C</div>
          <div>
            <span className="block text-sm font-semibold tracking-tight">Creator Inbox OS</span>
            <span className="block text-[11px] opacity-50 mt-0.5">by Collegare Studio</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 flex flex-col gap-1 px-3 py-4">
          {tabs.map(t => {
            const Icon = ICON_MAP[t.icon] || Home;
            const active = t.id === activeTab;
            return (
              <button
                key={t.id}
                onClick={() => handleNav(t.id)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-sm text-sm w-full text-left transition-all duration-200
                  ${active
                    ? 'bg-brand-primary text-white font-medium'
                    : 'text-white/55 hover:text-white/90 hover:bg-white/[0.06]'}
                `}
              >
                <Icon size={20} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 pb-6 pt-4 border-t border-white/[0.08]">
          {subscriberEmail && (
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] text-white/50 truncate max-w-[160px]">{subscriberEmail}</span>
              <button
                onClick={subscriberLogout}
                title="Sign out"
                className="p-1.5 rounded hover:bg-white/10 transition-colors text-white/40 hover:text-white/80 shrink-0"
              >
                <LogOut size={15} />
              </button>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-[11px] opacity-35">v2.0 &middot; Collegare Studio</span>
            <button onClick={toggle} className="p-1.5 rounded hover:bg-white/10 transition-colors text-white/50 hover:text-white/80">
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* ---------- MOBILE HEADER ---------- */}
      <header className="fixed top-0 left-0 right-0 h-[60px] text-white z-30 px-4 flex items-center justify-between md:hidden" style={{ backgroundColor: '#2d2319' }}>
        <button onClick={() => setMobileOpen(true)} className="p-1 text-white">
          <Menu size={24} />
        </button>
        <span className="font-semibold text-[15px]">Creator Inbox OS</span>
        <button onClick={toggle} className="p-1 text-white/60">
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </header>

      {/* ---------- MAIN CONTENT ---------- */}
      <main className="flex-1 ml-0 md:ml-[260px] min-h-screen pt-[60px] md:pt-0">
        <div className="px-4 py-8 md:px-12 md:py-10 max-w-[1400px]">
          {children}
        </div>
      </main>
    </div>
  );
}
