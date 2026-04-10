import { useState, useCallback, useMemo } from 'react';
import { useAuth, useData } from '../contexts';
import { useGmail } from '../hooks';
import { PageHeader, EmptyState, Modal, useToast } from './Common';
import { Mail, RefreshCw, Plus, Inbox as InboxIcon, LogIn, ChevronRight, Search, X, Tag, ChevronDown, ChevronUp, User, Reply, Clock, AtSign } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import { OPP_TYPES, PIPELINE_STAGES, fmtDate } from '../utils';

/** Decode HTML entities in Gmail snippets */
function decodeHtmlEntities(str) {
  if (!str) return '';
  const ta = document.createElement('textarea');
  ta.innerHTML = str;
  return ta.value;
}

/** Format a raw email date string into a friendly readable format */
function formatEmailDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
    const isYesterday = d.toDateString() === yesterday.toDateString();
    const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    if (isToday) return `Today at ${time}`;
    if (isYesterday) return `Yesterday at ${time}`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ` at ${time}`;
  } catch { return dateStr; }
}

/** Extract display name from "Name <email>" format */
function extractDisplayName(fromStr) {
  if (!fromStr) return 'Unknown';
  return fromStr.replace(/<.+>/, '').replace(/"/g, '').trim() || 'Unknown';
}

/** Get initials from a name (up to 2 characters) */
function getInitials(name) {
  if (!name) return '?';
  const parts = name.replace(/"/g, '').trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return (parts[0]?.[0] || '?').toUpperCase();
}

/* ============================================================
   Helper: extract raw email address from a "Name <email>" string
   ============================================================ */
function extractEmail(fromStr) {
  if (!fromStr) return '';
  const match = fromStr.match(/<(.+?)>/);
  return match ? match[1].toLowerCase().trim() : fromStr.toLowerCase().trim();
}

/* ============================================================
   Helper: extract brand/company name from sender string
   Prefers email domain (e.g. sarah@glossier.com → "Glossier")
   Falls back to display name for personal email providers
   ============================================================ */
const PERSONAL_DOMAINS = new Set([
  'gmail', 'yahoo', 'hotmail', 'outlook', 'icloud', 'aol',
  'protonmail', 'me', 'live', 'msn', 'ymail',
]);

function extractCompanyName(fromStr) {
  const emailAddr = extractEmail(fromStr);
  const domain = emailAddr.split('@')[1] || '';
  const domainBase = domain.split('.')[0].toLowerCase();
  if (domainBase && !PERSONAL_DOMAINS.has(domainBase)) {
    return domainBase.charAt(0).toUpperCase() + domainBase.slice(1);
  }
  // Fall back to display name (first word only as brand name is a guess)
  const name = extractDisplayName(fromStr);
  return name !== 'Unknown' ? name : '';
}

/* ============================================================
   Helper: parse an email body into thread segments
   Detects "On <date> <person> wrote:" patterns and "> " quote markers
   ============================================================ */
function parseThread(body) {
  if (!body) return [];

  // Split on "On ... wrote:" header lines
  const headerRe = /^(On\s.+?wrote:\s*)$/m;
  const parts = body.split(headerRe);

  const segments = [];
  let i = 0;

  while (i < parts.length) {
    const chunk = parts[i];

    // Check if this chunk is a "On ... wrote:" header
    if (headerRe.test(chunk.trim())) {
      // The next chunk is the quoted content
      const quotedBody = i + 1 < parts.length ? parts[i + 1] : '';
      // Extract sender from header
      const senderMatch = chunk.match(/On\s.+?\s(.+?)\s*wrote:/);
      const dateMatch = chunk.match(/On\s(.+?)\s(?:at\s.+?\s)?[\w.]+@/i) || chunk.match(/On\s(.+?),?\s/);
      segments.push({
        type: 'quoted',
        sender: senderMatch ? senderMatch[1].replace(/<.*?>/, '').trim() : 'Previous sender',
        date: dateMatch ? dateMatch[1].trim() : '',
        header: chunk.trim(),
        body: cleanQuotedText(quotedBody),
      });
      i += 2;
    } else {
      // This is the main (most recent) message or a standalone block
      const cleaned = chunk.trim();
      if (cleaned) {
        segments.push({
          type: segments.length === 0 ? 'main' : 'quoted',
          sender: '',
          date: '',
          header: '',
          body: cleaned,
        });
      }
      i += 1;
    }
  }

  // If parsing produced nothing useful, return the whole body as one segment
  if (segments.length === 0) {
    return [{ type: 'main', sender: '', date: '', header: '', body: body.trim() }];
  }

  return segments;
}

/** Remove leading "> " markers from quoted text lines */
function cleanQuotedText(text) {
  if (!text) return '';
  return text
    .split('\n')
    .map(line => line.replace(/^>\s?/gm, ''))
    .join('\n')
    .trim();
}

/* ============================================================
   ThreadView â renders parsed email thread as styled blocks
   ============================================================ */
function ThreadView({ body, senderName, senderDate }) {
  const segments = useMemo(() => parseThread(body), [body]);
  const [expandedQuotes, setExpandedQuotes] = useState({});

  const toggleQuote = (idx) => {
    setExpandedQuotes(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  if (segments.length <= 1 && segments[0]?.type === 'main') {
    // Simple email with no thread â render cleanly
    return (
      <div className="text-sm whitespace-pre-wrap font-sans" style={{ color: 'var(--c-text-sec)', lineHeight: '1.8', letterSpacing: '0.01em' }}>
        {segments[0]?.body || body}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {segments.map((seg, idx) => {
        if (seg.type === 'main') {
          return (
            <div key={idx} className="pb-3">
              {/* Main message header */}
              {senderName && (
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                    style={{ backgroundColor: '#6b1309' }}>
                    {(senderName || '?')[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-brand-text">{senderName}</p>
                    {senderDate && <p className="text-[11px] text-brand-text-muted">{senderDate}</p>}
                  </div>
                </div>
              )}
              <div className="text-sm whitespace-pre-wrap font-sans" style={{ color: 'var(--c-text-sec)', lineHeight: '1.8', letterSpacing: '0.01em' }}>
                {seg.body}
              </div>
            </div>
          );
        }

        // Quoted reply segment
        const isExpanded = expandedQuotes[idx];
        const previewLines = seg.body.split('\n').slice(0, 2).join(' ').slice(0, 120);

        return (
          <div key={idx} className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--c-border-light)' }}>
            {/* Quoted header â clickable to expand/collapse */}
            <button
              onClick={() => toggleQuote(idx)}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left hover:bg-brand-surface-alt transition-colors"
              style={{ backgroundColor: 'var(--c-surface-alt)' }}
            >
              <Reply size={13} style={{ color: 'var(--c-text-muted)' }} className="shrink-0 rotate-180" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold" style={{ color: 'var(--c-text-sec)' }}>
                    {seg.sender || 'Previous message'}
                  </span>
                  {seg.date && (
                    <span className="text-[10px]" style={{ color: 'var(--c-text-muted)' }}>{seg.date}</span>
                  )}
                </div>
                {!isExpanded && (
                  <p className="text-[11px] truncate mt-0.5" style={{ color: 'var(--c-text-muted)' }}>{previewLines}...</p>
                )}
              </div>
              {isExpanded
                ? <ChevronUp size={14} style={{ color: 'var(--c-text-muted)' }} className="shrink-0" />
                : <ChevronDown size={14} style={{ color: 'var(--c-text-muted)' }} className="shrink-0" />
              }
            </button>

            {/* Quoted body â collapsible */}
            {isExpanded && (
              <div className="px-5 py-4 text-sm whitespace-pre-wrap font-sans" style={{ color: 'var(--c-text-muted)', lineHeight: '1.75', borderTop: '1px solid var(--c-border-light)' }}>
                {seg.body}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ============================================================
   FullThreadView â renders all messages in a Gmail thread
   Each message is shown newest-first with sender avatar, date, body
   ============================================================ */
function FullThreadView({ messages }) {
  const [collapsedMsgs, setCollapsedMsgs] = useState({});

  // Show messages newest first (most recent on top)
  const sorted = useMemo(() => {
    return [...messages].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [messages]);

  const toggleMsg = (idx) => {
    setCollapsedMsgs(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <Reply size={13} style={{ color: 'var(--c-text-muted)' }} />
        <span className="text-xs font-medium" style={{ color: 'var(--c-text-muted)' }}>
          {messages.length} messages in this thread
        </span>
      </div>
      {sorted.map((msg, idx) => {
        const isFirst = idx === 0; // most recent message
        const isCollapsed = !isFirst && collapsedMsgs[idx] !== true; // older messages collapsed by default
        const senderName = extractDisplayName(msg.from);
        const initials = getInitials(senderName);
        const senderEmail = extractEmail(msg.from);

        return (
          <div key={msg.id || idx} className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--c-border-light)' }}>
            {/* Message header â clickable for older messages */}
            <button
              onClick={() => !isFirst && toggleMsg(idx)}
              className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors ${!isFirst ? 'hover:bg-brand-surface-alt cursor-pointer' : 'cursor-default'}`}
              style={{ backgroundColor: isFirst ? 'transparent' : 'var(--c-surface-alt)' }}
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0 mt-0.5"
                style={{ backgroundColor: '#6b1309' }}>
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold" style={{ color: 'var(--c-text)' }}>
                    {senderName}
                  </span>
                  {isFirst && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                      style={{ backgroundColor: 'var(--c-surface-alt)', color: 'var(--c-text-muted)' }}>
                      Latest
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  {senderEmail && (
                    <span className="text-[11px] text-brand-text-muted">{senderEmail}</span>
                  )}
                  <span className="text-[11px] text-brand-text-muted">Â· {formatEmailDate(msg.date)}</span>
                </div>
                {!isFirst && isCollapsed && msg.body && (
                  <p className="text-[11px] truncate mt-1" style={{ color: 'var(--c-text-muted)' }}>
                    {msg.body.substring(0, 140)}...
                  </p>
                )}
              </div>
              {!isFirst && (
                isCollapsed
                  ? <ChevronDown size={14} style={{ color: 'var(--c-text-muted)' }} className="shrink-0 mt-1" />
                  : <ChevronUp size={14} style={{ color: 'var(--c-text-muted)' }} className="shrink-0 mt-1" />
              )}
            </button>

            {/* Message body â always shown for newest, toggled for older */}
            {(isFirst || !isCollapsed) && (
              <div className="px-5 py-4 text-sm whitespace-pre-wrap font-sans"
                style={{ color: 'var(--c-text-sec)', lineHeight: '1.8', letterSpacing: '0.01em', borderTop: '1px solid var(--c-border-light)' }}>
                {msg.body || '(No content)'}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ============================================================
   Stage badge colors â reused for labels
   ============================================================ */
const STAGE_COLORS = {
  'new':          { bg: '#fff4e5', text: '#b35c00', border: '#ffd699' },
  'review':       { bg: '#e8f4fd', text: '#0b6fcc', border: '#b3d9f7' },
  'replied':      { bg: '#e6f7ee', text: '#0a7c42', border: '#a3e4c1' },
  'negotiating':  { bg: '#f3e8ff', text: '#6b21a8', border: '#d4b5f5' },
  'in-progress':  { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' },
  'filming':      { bg: '#fce7f3', text: '#9d174d', border: '#f9a8d4' },
  'editing':      { bg: '#ede9fe', text: '#5b21b6', border: '#c4b5fd' },
  'in-review':    { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' },
  'revisions':    { bg: '#fff7ed', text: '#c2410c', border: '#fdba74' },
  'shipment':     { bg: '#f0fdf4', text: '#166534', border: '#86efac' },
  'delivered':    { bg: '#ecfdf5', text: '#065f46', border: '#6ee7b7' },
  'follow-up':    { bg: '#fff1f0', text: '#b91c1c', border: '#fca5a5' },
  'closed-won':   { bg: '#dcfce7', text: '#15803d', border: '#86efac' },
  'closed-lost':  { bg: '#f1f1f1', text: '#6b7280', border: '#d1d5db' },
  'archived':     { bg: '#f5f5f4', text: '#78716c', border: '#d6d3d1' },
};

export default function Inbox() {
  const { user, accessToken, signIn, signOut } = useAuth();
  const { addEmails, emails, addOpp, opportunities } = useData();
  const { fetchMessages, fetchFullMessage, fetchThread, loading, error } = useGmail();
  const toast = useToast();

  const [selectedEmail, setSelectedEmail] = useState(null);
  const [fullBody, setFullBody] = useState('');
  const [threadMessages, setThreadMessages] = useState([]);
  const [importOpen, setImportOpen] = useState(false);
  const [importForm, setImportForm] = useState({ brand: '', contact: '', type: 'unclear' });
  const [searchQuery, setSearchQuery] = useState('');

  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  /* ---------- Build email-to-opportunity lookup ---------- */
  const emailOppMap = useMemo(() => {
    const map = {};
    opportunities.forEach(opp => {
      if (opp.email) {
        const key = opp.email.toLowerCase().trim();
        // If multiple opps share the same email, use the most recently updated one
        if (!map[key] || new Date(opp.updatedAt) > new Date(map[key].updatedAt)) {
          map[key] = opp;
        }
      }
    });
    return map;
  }, [opportunities]);

  /* ---------- Get label for an email ---------- */
  const getEmailLabel = useCallback((emailItem) => {
    const senderEmail = extractEmail(emailItem.from);
    const opp = emailOppMap[senderEmail];
    if (!opp) return null;
    const stage = PIPELINE_STAGES.find(s => s.id === opp.status);
    if (!stage) return null;
    return {
      stageId: stage.id,
      stageLabel: stage.label,
      brandName: opp.brand,
      colors: STAGE_COLORS[stage.id] || STAGE_COLORS['new'],
    };
  }, [emailOppMap]);

  /* ---------- Filter emails by search query ---------- */
  const filteredEmails = useMemo(() => {
    if (!searchQuery.trim()) return emails;
    const q = searchQuery.toLowerCase();
    return emails.filter(em =>
      (em.from || '').toLowerCase().includes(q) ||
      (em.subject || '').toLowerCase().includes(q) ||
      (em.snippet || '').toLowerCase().includes(q)
    );
  }, [emails, searchQuery]);

  /* ---------- Google Login ---------- */
  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const profile = await res.json();
        signIn(profile, tokenResponse.access_token);
        toast?.('Connected to Gmail');
      } catch {
        toast?.('Failed to connect', 'error');
      }
    },
    onError: () => toast?.('Login failed', 'error'),
    scope: 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/calendar',
  });

  /* ---------- Fetch Emails (50, no category filter) ---------- */
  const handleFetch = useCallback(async () => {
    const msgs = await fetchMessages('in:inbox', 50);
    if (msgs.length) {
      addEmails(msgs);
      toast?.(`Synced ${msgs.length} emails`);
    } else if (!error) {
      toast?.('No new emails found');
    }
  }, [fetchMessages, addEmails, toast, error]);

  /* ---------- Force refresh: clear stored emails and re-sync ---------- */
  const handleForceRefresh = useCallback(async () => {
    // Clear stored emails first
    try { localStorage.removeItem('cio_imported_emails'); } catch {}
    addEmails([]); // reset state (will be overwritten)
    // Now fetch fresh
    const msgs = await fetchMessages('in:inbox', 50);
    if (msgs.length) {
      // Replace all emails with fresh data
      try { localStorage.setItem('cio_imported_emails', JSON.stringify(msgs)); } catch {}
      addEmails(msgs);
      toast?.(`Refreshed â ${msgs.length} emails loaded`);
    } else if (!error) {
      toast?.('No emails found in inbox');
    }
  }, [fetchMessages, addEmails, toast, error]);

  /* ---------- View Full Email (fetch entire thread) ---------- */
  const handleSelectEmail = useCallback(async (email) => {
    setSelectedEmail(email);
    setFullBody('');
    setThreadMessages([]);

    // Fetch the full thread for this email
    if (email.threadId) {
      const msgs = await fetchThread(email.threadId);
      if (msgs.length > 0) {
        setThreadMessages(msgs);
        // Also set fullBody to the selected message's body for fallback
        const thisMsg = msgs.find(m => m.id === email.id);
        if (thisMsg) setFullBody(thisMsg.body);
        return;
      }
    }

    // Fallback: fetch just the single message
    const full = await fetchFullMessage(email.id);
    if (full) setFullBody(full.body);
  }, [fetchThread, fetchFullMessage]);

  /* ---------- Import as Opportunity ---------- */
  const handleImport = () => {
    if (!selectedEmail || !importForm.brand) return;
    addOpp({
      brand: importForm.brand,
      contact: importForm.contact,
      email: extractEmail(selectedEmail.from),
      type: importForm.type,
      priority: 'medium',
      status: 'new',
      deliverables: '',
      rate: '',
      lastContactDate: selectedEmail.date ? new Date(selectedEmail.date).toISOString().split('T')[0] : '',
      followUpDate: '',
      notes: `Imported from email: ${selectedEmail.subject}`,
    });
    toast?.('Imported as opportunity');
    setImportOpen(false);
    setImportForm({ brand: '', contact: '', type: 'unclear' });
  };

  /* ---------- Not connected state ---------- */
  if (!GOOGLE_CLIENT_ID) {
    return (
      <div className="animate-fadeIn">
        <PageHeader title="Inbox" subtitle="Connect Gmail to auto-import brand emails." />
        <div className="card p-12 text-center">
          <Mail size={48} className="mx-auto text-brand-text-muted opacity-40 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Gmail Integration</h3>
          <p className="text-sm text-brand-text-sec mb-6 max-w-md mx-auto leading-relaxed">
            To connect your Gmail, add your Google OAuth Client ID to the <code className="bg-brand-surface-alt px-1.5 py-0.5 rounded text-xs">.env</code> file. See the setup guide for instructions on creating credentials in Google Cloud Console.
          </p>
          <div className="card inline-block p-4 text-left text-xs bg-brand-surface-alt">
            <code>VITE_GOOGLE_CLIENT_ID=your-id.apps.googleusercontent.com</code>
          </div>
        </div>
      </div>
    );
  }

  if (!accessToken) {
    return (
      <div className="animate-fadeIn">
        <PageHeader title="Inbox" subtitle="Connect Gmail to auto-import brand emails." />
        <div className="card p-12 text-center">
          <Mail size={48} className="mx-auto text-brand-primary opacity-60 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Connect Your Gmail</h3>
          <p className="text-sm text-brand-text-sec mb-6 max-w-md mx-auto leading-relaxed">
            Sign in with Google to import emails from brands, PR agencies, and collaboration inquiries directly into your dashboard.
          </p>
          <button onClick={() => login()} className="btn btn-primary text-base px-8 py-3">
            <LogIn size={18} /> Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <PageHeader title="Inbox" subtitle={`Connected as ${user?.email || 'unknown'}`}>
        <div className="flex gap-2">
          <button onClick={handleFetch} disabled={loading} className="btn btn-secondary btn-sm">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Syncing...' : 'Sync Emails'}
          </button>
          <button onClick={handleForceRefresh} disabled={loading} className="btn btn-ghost btn-sm" title="Clear cached emails and re-sync from Gmail">
            Refresh All
          </button>
          <button onClick={signOut} className="btn btn-ghost btn-sm">Disconnect</button>
        </div>
      </PageHeader>

      {error && <div className="mb-4 p-3 rounded-sm bg-brand-danger-bg text-brand-danger text-sm">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4" style={{ minHeight: '60vh' }}>
        {/* Email list */}
        <div className="lg:col-span-2 card flex flex-col overflow-hidden">
          {/* Header + Search */}
          <div className="px-5 py-4 border-b border-brand-border-l">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-brand-text">
                {filteredEmails.length}{searchQuery ? ` of ${emails.length}` : ''} Emails
              </span>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-brand-text-muted hover:text-brand-text flex items-center gap-1"
                >
                  <X size={12} /> Clear
                </button>
              )}
            </div>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by sender, subject..."
                className="input pl-9 py-2 text-sm"
              />
            </div>
          </div>

          {/* Email list items */}
          <div className="flex-1 overflow-y-auto">
            {filteredEmails.length > 0 ? filteredEmails.map(em => {
              const label = getEmailLabel(em);
              return (
                <button
                  key={em.id}
                  onClick={() => handleSelectEmail(em)}
                  className={`w-full text-left px-5 py-3.5 border-b border-brand-border-l hover:bg-brand-surface-alt transition-colors flex items-start gap-3 ${selectedEmail?.id === em.id ? 'bg-brand-primary-l' : ''}`}
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-semibold shrink-0 mt-0.5"
                    style={{ backgroundColor: '#6b1309' }}>
                    {getInitials(extractDisplayName(em.from))}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate flex-1">{extractDisplayName(em.from)}</p>
                      {label && (
                        <span
                          className="shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                          style={{
                            backgroundColor: label.colors.bg,
                            color: label.colors.text,
                            border: `1px solid ${label.colors.border}`,
                          }}
                        >
                          <Tag size={9} />
                          {label.stageLabel}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-brand-text-sec truncate mt-0.5">{em.subject}</p>
                    <p className="text-[11px] text-brand-text-muted mt-1 line-clamp-1">{decodeHtmlEntities(em.snippet)}</p>
                  </div>
                  <ChevronRight size={14} className="text-brand-text-muted mt-1 shrink-0" />
                </button>
              );
            }) : (
              <div className="flex flex-col items-center justify-center py-16 text-brand-text-muted">
                <InboxIcon size={36} className="opacity-40 mb-3" />
                <p className="text-sm">
                  {searchQuery ? 'No emails match your search' : 'Click "Sync Emails" to import'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Email detail */}
        <div className="lg:col-span-3 card flex flex-col overflow-hidden">
          {selectedEmail ? (
            <>
              {/* Email header â sender info + actions */}
              <div className="px-6 py-5 border-b border-brand-border-l" style={{ background: 'var(--c-surface-alt)' }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    {/* Sender avatar */}
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0 mt-0.5"
                      style={{ backgroundColor: '#6b1309' }}>
                      {getInitials(extractDisplayName(selectedEmail.from))}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-semibold leading-snug" style={{ color: 'var(--c-text)' }}>
                        {selectedEmail.subject || '(No subject)'}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className="text-sm font-medium" style={{ color: 'var(--c-text-sec)' }}>
                          {extractDisplayName(selectedEmail.from)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <AtSign size={11} className="text-brand-text-muted shrink-0" />
                        <span className="text-xs text-brand-text-muted truncate">
                          {extractEmail(selectedEmail.from) || ''}
                        </span>
                      </div>
                      <div className="flex items-center flex-wrap gap-2 mt-2">
                        <div className="flex items-center gap-1">
                          <Clock size={11} className="text-brand-text-muted" />
                          <span className="text-xs text-brand-text-muted">{formatEmailDate(selectedEmail.date)}</span>
                        </div>
                        {(() => {
                          const label = getEmailLabel(selectedEmail);
                          if (!label) return null;
                          return (
                            <span
                              className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                              style={{
                                backgroundColor: label.colors.bg,
                                color: label.colors.text,
                                border: `1px solid ${label.colors.border}`,
                              }}
                            >
                              <Tag size={9} />
                              {label.brandName} â {label.stageLabel}
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => { setImportForm({ brand: extractCompanyName(selectedEmail.from), contact: extractDisplayName(selectedEmail.from), type: 'unclear' }); setImportOpen(true); }} className="btn btn-primary btn-sm shrink-0">
                    <Plus size={14} /> Import as Opp
                  </button>
                </div>
              </div>

              {/* Email body / thread */}
              <div className="flex-1 overflow-y-auto px-7 py-6">
                {threadMessages.length > 1 ? (
                  <FullThreadView messages={threadMessages} />
                ) : fullBody ? (
                  <ThreadView
                    body={fullBody}
                    senderName={extractDisplayName(selectedEmail.from)}
                    senderDate={formatEmailDate(selectedEmail.date)}
                  />
                ) : (
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--c-text-sec)', lineHeight: '1.75' }}>
                    {decodeHtmlEntities(selectedEmail.snippet)}
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-brand-text-muted gap-3">
              <Mail size={40} className="opacity-20" />
              <p className="text-sm">Select an email to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* ---- Import Modal ---- */}
      <Modal open={importOpen} onClose={() => setImportOpen(false)} title="Import as Opportunity" size="sm">
        <p className="text-xs text-brand-text-muted mb-4">Fields are pre-filled from the sender — edit as needed before importing.</p>
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-xs font-medium text-brand-text-sec mb-1.5">Brand / Company *</label>
            <input className="input" value={importForm.brand} onChange={e => setImportForm(f => ({ ...f, brand: e.target.value }))} placeholder="e.g. Glossier" />
          </div>
          <div>
            <label className="block text-xs font-medium text-brand-text-sec mb-1.5">Contact Name</label>
            <input className="input" value={importForm.contact} onChange={e => setImportForm(f => ({ ...f, contact: e.target.value }))} placeholder="e.g. Sarah Kim" />
          </div>
          <div>
            <label className="block text-xs font-medium text-brand-text-sec mb-1.5">Type</label>
            <select className="select" value={importForm.type} onChange={e => setImportForm(f => ({ ...f, type: e.target.value }))}>
              {OPP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <button className="btn btn-ghost" onClick={() => setImportOpen(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleImport} disabled={!importForm.brand}>Import</button>
        </div>
      </Modal>
    </div>
  );
}
