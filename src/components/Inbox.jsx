import { useState, useCallback, useMemo } from 'react';
import { useAuth, useData } from '../contexts';
import { useGmail } from '../hooks';
import { PageHeader, EmptyState, Modal, useToast } from './Common';
import { Mail, RefreshCw, Plus, Inbox as InboxIcon, LogIn, ChevronRight, Search, X, Tag, ChevronDown, ChevronUp, User, Reply } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import { OPP_TYPES, PIPELINE_STAGES } from '../utils';

/* ============================================================
   Helper: extract raw email address from a "Name <email>" string
   ============================================================ */
function extractEmail(fromStr) {
  if (!fromStr) return '';
  const match = fromStr.match(/<(.+?)>/);
  return match ? match[1].toLowerCase().trim() : fromStr.toLowerCase().trim();
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
   ThreadView — renders parsed email thread as styled blocks
   ============================================================ */
function ThreadView({ body, senderName, senderDate }) {
  const segments = useMemo(() => parseThread(body), [body]);
  const [expandedQuotes, setExpandedQuotes] = useState({});

  const toggleQuote = (idx) => {
    setExpandedQuotes(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  if (segments.length <= 1 && segments[0]?.type === 'main') {
    // Simple email with no thread — render cleanly
    return (
      <div className="text-sm text-brand-text-sec leading-relaxed whitespace-pre-wrap font-sans">
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
              <div className="text-sm text-brand-text-sec leading-relaxed whitespace-pre-wrap font-sans">
                {seg.body}
              </div>
            </div>
          );
        }

        // Quoted reply segment
        const isExpanded = expandedQuotes[idx];
        const previewLines = seg.body.split('\n').slice(0, 2).join(' ').slice(0, 100);

        return (
          <div key={idx} className="border-l-2 rounded-sm overflow-hidden"
            style={{ borderColor: '#d1d5db' }}>
            {/* Quoted header — clickable to expand/collapse */}
            <button
              onClick={() => toggleQuote(idx)}
              className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-brand-surface-alt transition-colors"
              style={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
            >
              <Reply size={12} className="text-brand-text-muted shrink-0 rotate-180" />
              <div className="flex-1 min-w-0">
                <span className="text-xs font-medium text-brand-text-sec">
                  {seg.sender || 'Previous message'}
                </span>
                {seg.date && (
                  <span className="text-[10px] text-brand-text-muted ml-2">{seg.date}</span>
                )}
                {!isExpanded && (
                  <p className="text-[11px] text-brand-text-muted truncate mt-0.5">{previewLines}...</p>
                )}
              </div>
              {isExpanded
                ? <ChevronUp size={14} className="text-brand-text-muted shrink-0" />
                : <ChevronDown size={14} className="text-brand-text-muted shrink-0" />
              }
            </button>

            {/* Quoted body — collapsible */}
            {isExpanded && (
              <div className="px-4 py-3 text-sm text-brand-text-muted leading-relaxed whitespace-pre-wrap font-sans"
                style={{ backgroundColor: 'rgba(0,0,0,0.015)' }}>
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
   Stage badge colors — reused for labels
   ============================================================ */
const STAGE_COLORS = {
  'new':          { bg: '#fff4e5', text: '#b35c00', border: '#ffd699' },
  'review':       { bg: '#e8f4fd', text: '#0b6fcc', border: '#b3d9f7' },
  'replied':      { bg: '#e6f7ee', text: '#0a7c42', border: '#a3e4c1' },
  'negotiating':  { bg: '#f3e8ff', text: '#6b21a8', border: '#d4b5f5' },
  'follow-up':    { bg: '#fff1f0', text: '#b91c1c', border: '#fca5a5' },
  'closed-won':   { bg: '#dcfce7', text: '#15803d', border: '#86efac' },
  'closed-lost':  { bg: '#f1f1f1', text: '#6b7280', border: '#d1d5db' },
  'archived':     { bg: '#f5f5f4', text: '#78716c', border: '#d6d3d1' },
};

export default function Inbox() {
  const { user, accessToken, signIn, signOut } = useAuth();
  const { addEmails, emails, addOpp, opportunities } = useData();
  const { fetchMessages, fetchFullMessage, loading, error } = useGmail();
  const toast = useToast();

  const [selectedEmail, setSelectedEmail] = useState(null);
  const [fullBody, setFullBody] = useState('');
  const [importOpen, setImportOpen] = useState(false);
  const [importForm, setImportForm] = useState({ brand: '', type: 'unclear' });
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
      toast?.(`Refreshed — ${msgs.length} emails loaded`);
    } else if (!error) {
      toast?.('No emails found in inbox');
    }
  }, [fetchMessages, addEmails, toast, error]);

  /* ---------- View Full Email ---------- */
  const handleSelectEmail = useCallback(async (email) => {
    setSelectedEmail(email);
    setFullBody('');
    const full = await fetchFullMessage(email.id);
    if (full) setFullBody(full.body);
  }, [fetchFullMessage]);

  /* ---------- Import as Opportunity ---------- */
  const handleImport = () => {
    if (!selectedEmail || !importForm.brand) return;
    const fromMatch = selectedEmail.from?.match(/<(.+?)>/) || [];
    addOpp({
      brand: importForm.brand,
      contact: selectedEmail.from?.replace(/<.+>/, '').trim() || '',
      email: fromMatch[1] || '',
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
    setImportForm({ brand: '', type: 'unclear' });
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
                  <Mail size={16} className="text-brand-text-muted mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate flex-1">{em.from?.replace(/<.+>/, '').trim() || 'Unknown'}</p>
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
                    <p className="text-[11px] text-brand-text-muted mt-1 line-clamp-1">{em.snippet}</p>
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
              <div className="px-6 py-4 border-b border-brand-border-l">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold truncate">{selectedEmail.subject || '(No subject)'}</h3>
                    <p className="text-sm text-brand-text-sec mt-1">{selectedEmail.from}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-brand-text-muted">{selectedEmail.date}</p>
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
                            {label.brandName} — {label.stageLabel}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                  <button onClick={() => { setImportForm({ brand: selectedEmail.from?.replace(/<.+>/, '').trim().split(' ')[0] || '', type: 'unclear' }); setImportOpen(true); }} className="btn btn-primary btn-sm shrink-0">
                    <Plus size={14} /> Import as Opp
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-5">
                {fullBody ? (
                  <ThreadView
                    body={fullBody}
                    senderName={selectedEmail.from?.replace(/<.+>/, '').trim()}
                    senderDate={selectedEmail.date}
                  />
                ) : (
                  <p className="text-sm text-brand-text-sec leading-relaxed">{selectedEmail.snippet}</p>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-brand-text-muted">
              <p className="text-sm">Select an email to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* ---- Import Modal ---- */}
      <Modal open={importOpen} onClose={() => setImportOpen(false)} title="Import as Opportunity" size="sm">
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-xs font-medium text-brand-text-sec mb-1.5">Brand Name *</label>
            <input className="input" value={importForm.brand} onChange={e => setImportForm(f => ({ ...f, brand: e.target.value }))} placeholder="e.g. Glossier" />
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
