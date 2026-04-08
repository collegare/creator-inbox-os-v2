import { createContext, useContext, useState, useEffect, useCallback } from 'react';

/* ============================================================
   THEME CONTEXT — Dark / Light mode
   ============================================================ */
const ThemeCtx = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('cio_theme') || 'light'; } catch { return 'light'; }
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('cio_theme', theme); } catch {}
  }, [theme]);

  const toggle = () => setTheme(t => (t === 'light' ? 'dark' : 'light'));

  return <ThemeCtx.Provider value={{ theme, toggle }}>{children}</ThemeCtx.Provider>;
}

export const useTheme = () => useContext(ThemeCtx);

/* ============================================================
   AUTH CONTEXT — Google OAuth for Gmail / Calendar
   ============================================================ */
const AuthCtx = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const d = localStorage.getItem('cio_user');
      return d ? JSON.parse(d) : null;
    } catch { return null; }
  });
  const [accessToken, setAccessToken] = useState(() => {
    try { return localStorage.getItem('cio_gtoken') || null; } catch { return null; }
  });

  const signIn = useCallback((credential, token) => {
    /* credential = decoded JWT from Google, token = access_token */
    const u = {
      email: credential.email,
      name: credential.name,
      picture: credential.picture,
    };
    setUser(u);
    setAccessToken(token);
    try {
      localStorage.setItem('cio_user', JSON.stringify(u));
      localStorage.setItem('cio_gtoken', token);
    } catch {}
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    setAccessToken(null);
    try {
      localStorage.removeItem('cio_user');
      localStorage.removeItem('cio_gtoken');
    } catch {}
  }, []);

  return (
    <AuthCtx.Provider value={{ user, accessToken, signIn, signOut }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);

/* ============================================================
   DATA CONTEXT — Opportunities, Templates, Team
   ============================================================ */
const DataCtx = createContext();

const STORAGE_KEYS = {
  opps: 'cio_opportunities',
  templates: 'cio_custom_templates',
  team: 'cio_team_members',
  emails: 'cio_imported_emails',
  calEvents: 'cio_calendar_events',
};

function load(key, fallback = []) {
  try {
    const d = localStorage.getItem(key);
    return d ? JSON.parse(d) : fallback;
  } catch { return fallback; }
}

function save(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
}

export function DataProvider({ children }) {
  /* --- Opportunities --- */
  const [opportunities, setOpportunities] = useState(() => load(STORAGE_KEYS.opps));
  useEffect(() => save(STORAGE_KEYS.opps, opportunities), [opportunities]);

  const addOpp = useCallback((opp) => {
    const now = new Date().toISOString();
    setOpportunities(prev => [...prev, { ...opp, id: uid(), createdAt: now, updatedAt: now }]);
  }, []);

  const updateOpp = useCallback((id, data) => {
    setOpportunities(prev => prev.map(o =>
      o.id === id ? { ...o, ...data, updatedAt: new Date().toISOString() } : o
    ));
  }, []);

  const deleteOpp = useCallback((id) => {
    setOpportunities(prev => prev.filter(o => o.id !== id));
  }, []);

  const reorderOpps = useCallback((updated) => {
    setOpportunities(updated);
  }, []);

  /* --- Custom Templates --- */
  const [customTemplates, setCustomTemplates] = useState(() => load(STORAGE_KEYS.templates));
  useEffect(() => save(STORAGE_KEYS.templates, customTemplates), [customTemplates]);

  const addTemplate = useCallback((t) => {
    setCustomTemplates(prev => [...prev, { ...t, id: uid(), createdAt: new Date().toISOString() }]);
  }, []);

  const updateTemplate = useCallback((id, data) => {
    setCustomTemplates(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
  }, []);

  const deleteTemplate = useCallback((id) => {
    setCustomTemplates(prev => prev.filter(t => t.id !== id));
  }, []);

  /* --- Team Members --- */
  const [team, setTeam] = useState(() => load(STORAGE_KEYS.team));
  useEffect(() => save(STORAGE_KEYS.team, team), [team]);

  const addTeamMember = useCallback((m) => {
    setTeam(prev => [...prev, { ...m, id: uid() }]);
  }, []);

  const removeTeamMember = useCallback((id) => {
    setTeam(prev => prev.filter(m => m.id !== id));
  }, []);

  /* --- Imported Emails --- */
  const [emails, setEmails] = useState(() => load(STORAGE_KEYS.emails));
  useEffect(() => save(STORAGE_KEYS.emails, emails), [emails]);

  const addEmails = useCallback((newEmails) => {
    setEmails(prev => {
      const ids = new Set(prev.map(e => e.id));
      const unique = newEmails.filter(e => !ids.has(e.id));
      return [...unique, ...prev];
    });
  }, []);

  /* --- Calendar Events --- */
  const [calendarEvents, setCalendarEvents] = useState(() => load(STORAGE_KEYS.calEvents));
  useEffect(() => save(STORAGE_KEYS.calEvents, calendarEvents), [calendarEvents]);

  const addCalEvent = useCallback((ev) => {
    setCalendarEvents(prev => [...prev, { ...ev, id: uid() }]);
  }, []);

  const updateCalEvent = useCallback((id, data) => {
    setCalendarEvents(prev => prev.map(e => e.id === id ? { ...e, ...data } : e));
  }, []);

  const deleteCalEvent = useCallback((id) => {
    setCalendarEvents(prev => prev.filter(e => e.id !== id));
  }, []);

  return (
    <DataCtx.Provider value={{
      opportunities, addOpp, updateOpp, deleteOpp, reorderOpps,
      customTemplates, addTemplate, updateTemplate, deleteTemplate,
      team, addTeamMember, removeTeamMember,
      emails, addEmails,
      calendarEvents, addCalEvent, updateCalEvent, deleteCalEvent,
    }}>
      {children}
    </DataCtx.Provider>
  );
}

export const useData = () => useContext(DataCtx);

/* --- Helpers --- */
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 11);
}
