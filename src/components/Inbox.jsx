import { useState, useCallback } from 'react';
import { useAuth, useData } from '../contexts';
import { useGmail } from '../hooks';
import { PageHeader, EmptyState, Modal, useToast } from './Common';
import { Mail, RefreshCw, Plus, ExternalLink, Inbox as InboxIcon, LogIn, ChevronRight } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import { OPP_TYPES } from '../utils';

export default function Inbox() {
  const { user, accessToken, signIn, signOut } = useAuth();
  const { addEmails, emails, addOpp } = useData();
  const { fetchMessages, fetchFullMessage, loading, error } = useGmail();
  const toast = useToast();

  const [selectedEmail, setSelectedEmail] = useState(null);
  const [fullBody, setFullBody] = useState('');
  const [importOpen, setImportOpen] = useState(false);
  const [importForm, setImportForm] = useState({ brand: '', type: 'unclear' });

  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

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

  /* ---------- Fetch Emails ---------- */
  const handleFetch = useCallback(async () => {
    const msgs = await fetchMessages('category:primary', 30);
    if (msgs.length) {
      addEmails(msgs);
      toast?.(`Imported ${msgs.length} emails`);
    } else {
      toast?.('No new emails found');
    }
  }, [fetchMessages, addEmails, toast]);

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
          <button onClick={signOut} className="btn btn-ghost btn-sm">Disconnect</button>
        </div>
      </PageHeader>

      {error && <div className="mb-4 p-3 rounded-sm bg-brand-danger-bg text-brand-danger text-sm">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4" style={{ minHeight: '60vh' }}>
        {/* Email list */}
        <div className="lg:col-span-2 card flex flex-col overflow-hidden">
          <div className="px-5 py-4 border-b border-brand-border-l text-sm font-semibold text-brand-text">
            {emails.length} Emails
          </div>
          <div className="flex-1 overflow-y-auto">
            {emails.length > 0 ? emails.map(em => (
              <button
                key={em.id}
                onClick={() => handleSelectEmail(em)}
                className={`w-full text-left px-5 py-3.5 border-b border-brand-border-l hover:bg-brand-surface-alt transition-colors flex items-start gap-3 ${selectedEmail?.id === em.id ? 'bg-brand-primary-l' : ''}`}
              >
                <Mail size={16} className="text-brand-text-muted mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{em.from?.replace(/<.+>/, '').trim() || 'Unknown'}</p>
                  <p className="text-xs text-brand-text-sec truncate mt-0.5">{em.subject}</p>
                  <p className="text-[11px] text-brand-text-muted mt-1 line-clamp-1">{em.snippet}</p>
                </div>
                <ChevronRight size={14} className="text-brand-text-muted mt-1 shrink-0" />
              </button>
            )) : (
              <div className="flex flex-col items-center justify-center py-16 text-brand-text-muted">
                <InboxIcon size={36} className="opacity-40 mb-3" />
                <p className="text-sm">Click "Sync Emails" to import</p>
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
                    <p className="text-xs text-brand-text-muted mt-0.5">{selectedEmail.date}</p>
                  </div>
                  <button onClick={() => { setImportForm({ brand: selectedEmail.from?.replace(/<.+>/, '').trim().split(' ')[0] || '', type: 'unclear' }); setImportOpen(true); }} className="btn btn-primary btn-sm shrink-0">
                    <Plus size={14} /> Import as Opp
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-5">
                {fullBody ? (
                  <pre className="text-sm text-brand-text-sec whitespace-pre-wrap font-sans leading-relaxed">{fullBody}</pre>
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
