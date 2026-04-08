import { useState } from 'react';
import { useTheme, useAuth, useData } from '../contexts';
import { useExport } from '../hooks';
import { PageHeader, Modal, useToast, ConfirmDialog } from './Common';
import {
  Moon, Sun, User, UserPlus, Trash2, Download, Database,
  Mail, CalendarDays, Smartphone, LogIn, LogOut,
} from 'lucide-react';

export default function Settings() {
  const { theme, toggle } = useTheme();
  const { user, accessToken, signOut } = useAuth();
  const { team, addTeamMember, removeTeamMember, opportunities } = useData();
  const { exportCSV, exportPDF } = useExport();
  const toast = useToast();

  const [teamModal, setTeamModal] = useState(false);
  const [teamForm, setTeamForm] = useState({ name: '', email: '', role: 'viewer' });
  const [deleteTeamId, setDeleteTeamId] = useState(null);

  const handleAddMember = () => {
    if (!teamForm.name || !teamForm.email) return;
    addTeamMember(teamForm);
    toast?.('Team member added');
    setTeamModal(false);
    setTeamForm({ name: '', email: '', role: 'viewer' });
  };

  const handleExportAll = (format) => {
    const cols = [
      { key: 'brand', label: 'Brand' }, { key: 'contact', label: 'Contact' },
      { key: 'email', label: 'Email' }, { key: 'type', label: 'Type' },
      { key: 'status', label: 'Status' }, { key: 'priority', label: 'Priority' },
      { key: 'rate', label: 'Rate' }, { key: 'deliverables', label: 'Deliverables' },
    ];
    if (format === 'csv') exportCSV(opportunities, 'creator-inbox-os-export.csv');
    else exportPDF(opportunities, cols, 'Creator Inbox OS — All Opportunities', 'creator-inbox-os-export.pdf');
    toast?.(`Exported as ${format.toUpperCase()}`);
  };

  const handleClearData = () => {
    if (confirm('This will delete ALL your data (opportunities, templates, events, team). Are you sure?')) {
      ['cio_opportunities', 'cio_custom_templates', 'cio_team_members', 'cio_imported_emails', 'cio_calendar_events'].forEach(k => localStorage.removeItem(k));
      window.location.reload();
    }
  };

  return (
    <div className="animate-fadeIn">
      <PageHeader title="Settings" subtitle="Customize your Creator Inbox OS experience." />

      <div className="max-w-2xl space-y-6">

        {/* ---- Appearance ---- */}
        <div className="card p-6">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />} Appearance
          </h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Dark Mode</p>
              <p className="text-xs text-brand-text-muted mt-0.5">Toggle between light and dark themes</p>
            </div>
            <button
              onClick={toggle}
              className={`relative w-12 h-7 rounded-full transition-colors duration-300 ${theme === 'dark' ? 'bg-brand-primary' : 'bg-brand-border'}`}
            >
              <span className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-300 ${theme === 'dark' ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>
        </div>

        {/* ---- Connected Accounts ---- */}
        <div className="card p-6">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <User size={16} /> Connected Accounts
          </h3>
          {user ? (
            <div className="flex items-center justify-between p-3 rounded-sm bg-brand-surface-alt">
              <div className="flex items-center gap-3">
                {user.picture && <img src={user.picture} alt="" className="w-9 h-9 rounded-full" />}
                <div>
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-brand-text-muted">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="badge badge-replied">Connected</span>
                <button onClick={signOut} className="btn btn-ghost btn-sm"><LogOut size={14} /> Disconnect</button>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-brand-text-muted mb-3">No Google account connected</p>
              <p className="text-xs text-brand-text-muted">Connect via the Inbox tab to enable Gmail and Calendar sync</p>
            </div>
          )}

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 p-3 rounded-sm bg-brand-surface-alt">
              <Mail size={16} className="text-brand-text-muted" />
              <div>
                <p className="text-xs font-medium">Gmail</p>
                <p className="text-[11px] text-brand-text-muted">{accessToken ? 'Active' : 'Not connected'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-sm bg-brand-surface-alt">
              <CalendarDays size={16} className="text-brand-text-muted" />
              <div>
                <p className="text-xs font-medium">Calendar</p>
                <p className="text-[11px] text-brand-text-muted">{accessToken ? 'Active' : 'Not connected'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ---- Team Management ---- */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <UserPlus size={16} /> Team Members
            </h3>
            <button className="btn btn-secondary btn-sm" onClick={() => setTeamModal(true)}>
              <UserPlus size={14} /> Add Member
            </button>
          </div>

          {team.length > 0 ? (
            <div className="space-y-2">
              {team.map(m => (
                <div key={m.id} className="flex items-center justify-between p-3 rounded-sm bg-brand-surface-alt">
                  <div>
                    <p className="text-sm font-medium">{m.name}</p>
                    <p className="text-xs text-brand-text-muted">{m.email} &middot; {m.role}</p>
                  </div>
                  <button onClick={() => setDeleteTeamId(m.id)} className="btn-icon border-none"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-brand-text-muted text-center py-4">No team members yet. Add members to collaborate.</p>
          )}
          <p className="text-[11px] text-brand-text-muted mt-3">Team collaboration requires a shared database (e.g. Supabase). Currently, team data is stored locally.</p>
        </div>

        {/* ---- Export & Data ---- */}
        <div className="card p-6">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Download size={16} /> Export & Data
          </h3>
          <div className="flex flex-wrap gap-3 mb-4">
            <button onClick={() => handleExportAll('csv')} className="btn btn-ghost btn-sm"><Download size={14} /> Export CSV</button>
            <button onClick={() => handleExportAll('pdf')} className="btn btn-ghost btn-sm"><Download size={14} /> Export PDF</button>
          </div>
          <div className="pt-4 border-t border-brand-border-l">
            <button onClick={handleClearData} className="btn btn-danger btn-sm"><Database size={14} /> Clear All Data</button>
            <p className="text-[11px] text-brand-text-muted mt-2">This will permanently delete all opportunities, templates, events, and team data.</p>
          </div>
        </div>

        {/* ---- PWA Install ---- */}
        <div className="card p-6">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Smartphone size={16} /> Install App
          </h3>
          <p className="text-sm text-brand-text-sec leading-relaxed mb-3">
            Creator Inbox OS is a Progressive Web App. Install it on your phone or desktop for a native app experience.
          </p>
          <p className="text-xs text-brand-text-muted">
            On iOS: Tap Share &rarr; Add to Home Screen. On Android/Desktop: Click the install prompt in your browser's address bar.
          </p>
        </div>

        {/* ---- Footer branding ---- */}
        <div className="text-center py-8 text-brand-text-muted">
          <p className="text-sm font-medium">Creator Inbox OS v2.0</p>
          <p className="text-xs mt-1">by Collegare Studio &middot; Built for creators who mean business</p>
        </div>
      </div>

      {/* ---- Team Member Modal ---- */}
      <Modal open={teamModal} onClose={() => setTeamModal(false)} title="Add Team Member" size="sm">
        <div className="space-y-4 mb-6">
          <div><label className="block text-xs font-medium text-brand-text-sec mb-1.5">Name *</label><input className="input" value={teamForm.name} onChange={e => setTeamForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Alex Kim" /></div>
          <div><label className="block text-xs font-medium text-brand-text-sec mb-1.5">Email *</label><input className="input" type="email" value={teamForm.email} onChange={e => setTeamForm(f => ({ ...f, email: e.target.value }))} placeholder="alex@example.com" /></div>
          <div><label className="block text-xs font-medium text-brand-text-sec mb-1.5">Role</label>
            <select className="select" value={teamForm.role} onChange={e => setTeamForm(f => ({ ...f, role: e.target.value }))}>
              <option value="viewer">Viewer</option>
              <option value="editor">Editor</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <button className="btn btn-ghost" onClick={() => setTeamModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleAddMember} disabled={!teamForm.name || !teamForm.email}>Add</button>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTeamId}
        onClose={() => setDeleteTeamId(null)}
        onConfirm={() => { removeTeamMember(deleteTeamId); toast?.('Member removed'); }}
        title="Remove Team Member"
        message="Remove this team member?"
      />
    </div>
  );
}
