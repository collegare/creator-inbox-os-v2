import { useState, useMemo } from 'react';
import { useData } from '../contexts';
import { Modal, ConfirmDialog, PageHeader, EmptyState, useToast } from './Common';
import { fmtDate, isDue, OPP_TYPES, PRIORITIES, PIPELINE_STAGES, statusBadge, parseRate, fmtCurrency } from '../utils';
import { useExport } from '../hooks';
import {
  Plus, Pencil, Trash2, Briefcase, Filter, Download,
  Mail, Package, DollarSign, CalendarCheck, Clock,
} from 'lucide-react';

const STATUSES = PIPELINE_STAGES.map(s => s.id);

export default function Opportunities() {
  const { opportunities, addOpp, updateOpp, deleteOpp } = useData();
  const toast = useToast();
  const { exportCSV, exportPDF } = useExport();

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  /* ---------- Filter + Sort ---------- */
  const filtered = useMemo(() => {
    let list = [...opportunities];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(o =>
        o.brand?.toLowerCase().includes(q) ||
        o.contact?.toLowerCase().includes(q) ||
        o.email?.toLowerCase().includes(q) ||
        o.notes?.toLowerCase().includes(q)
      );
    }
    if (filterStatus !== 'all') list = list.filter(o => o.status === filterStatus);
    if (filterType !== 'all') list = list.filter(o => o.type === filterType);
    const pOrder = { high: 0, medium: 1, low: 2 };
    list.sort((a, b) => (pOrder[a.priority] ?? 1) - (pOrder[b.priority] ?? 1) || new Date(b.createdAt) - new Date(a.createdAt));
    return list;
  }, [opportunities, search, filterStatus, filterType]);

  /* ---------- Form state ---------- */
  const blank = { brand: '', contact: '', email: '', type: '', priority: 'medium', status: 'new', deliverables: '', rate: '', lastContactDate: '', followUpDate: '', notes: '' };
  const [form, setForm] = useState(blank);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const openAdd = () => { setEditId(null); setForm(blank); setModalOpen(true); };
  const openEdit = (o) => { setEditId(o.id); setForm({ ...blank, ...o }); setModalOpen(true); };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editId) {
      updateOpp(editId, form);
      toast?.('Opportunity updated');
    } else {
      addOpp(form);
      toast?.('Opportunity added');
    }
    setModalOpen(false);
  };

  /* ---------- Export ---------- */
  const cols = [
    { key: 'brand', label: 'Brand' }, { key: 'contact', label: 'Contact' }, { key: 'email', label: 'Email' },
    { key: 'type', label: 'Type' }, { key: 'status', label: 'Status' }, { key: 'priority', label: 'Priority' },
    { key: 'deliverables', label: 'Deliverables' }, { key: 'rate', label: 'Rate' },
    { key: 'lastContactDate', label: 'Last Contact' }, { key: 'followUpDate', label: 'Follow-up' }, { key: 'notes', label: 'Notes' },
  ];

  return (
    <div className="animate-fadeIn">
      <PageHeader title="Opportunities" subtitle="Track every brand deal, collab, and partnership.">
        <div className="flex gap-2">
          <div className="relative group">
            <button className="btn btn-ghost btn-sm"><Download size={15} /> Export</button>
            <div className="absolute right-0 top-full mt-1 card p-2 shadow-lg hidden group-hover:block z-10 min-w-[140px]">
              <button onClick={() => exportCSV(filtered, 'opportunities.csv')} className="block w-full text-left text-sm px-3 py-2 rounded hover:bg-brand-surface-alt">CSV</button>
              <button onClick={() => exportPDF(filtered, cols, 'Opportunities', 'opportunities.pdf')} className="block w-full text-left text-sm px-3 py-2 rounded hover:bg-brand-surface-alt">PDF</button>
            </div>
          </div>
          <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Add</button>
        </div>
      </PageHeader>

      {/* ---- Filters ---- */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-2.5 flex-1 min-w-[220px] bg-brand-surface border border-brand-border-l rounded-sm px-3.5 focus-within:border-brand-primary transition-colors">
          <Filter size={16} className="text-brand-text-muted shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search brands, contacts..." className="input border-none px-0 py-2.5 bg-transparent" />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="select w-auto">
          <option value="all">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="select w-auto">
          <option value="all">All Types</option>
          {OPP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* ---- Grid ---- */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(o => {
            const dueSoon = isDue(o.followUpDate);
            return (
              <div key={o.id} className="card p-5 flex flex-col gap-3 hover:shadow-md hover:border-brand-border transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-base font-semibold truncate">{o.brand}</p>
                    {o.contact && <p className="text-xs text-brand-text-sec mt-0.5">{o.contact}</p>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button className="btn-icon" onClick={() => openEdit(o)}><Pencil size={14} /></button>
                    <button className="btn-icon" onClick={() => setDeleteId(o.id)}><Trash2 size={14} /></button>
                  </div>
                </div>

                <div className="flex gap-1.5 flex-wrap">
                  <span className={`badge badge-${o.type}`}>{o.type}</span>
                  <span className={`badge ${statusBadge(o.status)}`}>{o.status}</span>
                  <span className={`badge badge-${o.priority}`}>{o.priority}</span>
                </div>

                <div className="flex flex-col gap-1.5 text-[13px] text-brand-text-sec">
                  {o.email && <div className="flex items-center gap-2"><Mail size={14} className="text-brand-text-muted shrink-0" /> {o.email}</div>}
                  {o.deliverables && <div className="flex items-center gap-2"><Package size={14} className="text-brand-text-muted shrink-0" /> {o.deliverables}</div>}
                  {o.rate && <div className="flex items-center gap-2"><DollarSign size={14} className="text-brand-text-muted shrink-0" /> {fmtCurrency(parseRate(o.rate))}</div>}
                  {o.lastContactDate && <div className="flex items-center gap-2"><CalendarCheck size={14} className="text-brand-text-muted shrink-0" /> Last: {fmtDate(o.lastContactDate)}</div>}
                  {o.followUpDate && (
                    <div className={`flex items-center gap-2 ${dueSoon ? 'text-brand-danger font-medium' : ''}`}>
                      <Clock size={14} className="shrink-0" /> Follow-up: {fmtDate(o.followUpDate)}{dueSoon ? ' (due!)' : ''}
                    </div>
                  )}
                </div>

                {o.notes && <p className="text-[13px] text-brand-text-muted italic pt-2 border-t border-brand-border-l">{o.notes}</p>}
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState icon={Briefcase} message={opportunities.length ? 'No opportunities match your filters.' : 'No opportunities tracked yet.'} action={!opportunities.length && <button className="btn btn-secondary" onClick={openAdd}>Add Your First Opportunity</button>} />
      )}

      {/* ---- Add/Edit Modal ---- */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Edit Opportunity' : 'Add Opportunity'}>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div><label className="block text-xs font-medium text-brand-text-sec mb-1.5">Brand / Company *</label><input className="input" required value={form.brand} onChange={e => set('brand', e.target.value)} placeholder="e.g. Glossier" /></div>
            <div><label className="block text-xs font-medium text-brand-text-sec mb-1.5">Contact Name</label><input className="input" value={form.contact} onChange={e => set('contact', e.target.value)} placeholder="e.g. Sarah Kim" /></div>
            <div><label className="block text-xs font-medium text-brand-text-sec mb-1.5">Email</label><input className="input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="sarah@glossier.com" /></div>
            <div><label className="block text-xs font-medium text-brand-text-sec mb-1.5">Type *</label><select className="select" required value={form.type} onChange={e => set('type', e.target.value)}><option value="">Select...</option>{OPP_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
            <div><label className="block text-xs font-medium text-brand-text-sec mb-1.5">Priority</label><select className="select" value={form.priority} onChange={e => set('priority', e.target.value)}>{PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
            <div><label className="block text-xs font-medium text-brand-text-sec mb-1.5">Status</label><select className="select" value={form.status} onChange={e => set('status', e.target.value)}>{STATUSES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
            <div><label className="block text-xs font-medium text-brand-text-sec mb-1.5">Deliverables</label><input className="input" value={form.deliverables} onChange={e => set('deliverables', e.target.value)} placeholder="2 Reels + 1 Story" /></div>
            <div>
              <label className="block text-xs font-medium text-brand-text-sec mb-1.5">Rate (USD)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-text-muted text-sm select-none">$</span>
                <input
                  className="input pl-7"
                  type="number"
                  min="0"
                  step="1"
                  value={form.rate}
                  onChange={e => set('rate', e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
            <div><label className="block text-xs font-medium text-brand-text-sec mb-1.5">Last Contact</label><input className="input" type="date" value={form.lastContactDate} onChange={e => set('lastContactDate', e.target.value)} /></div>
            <div><label className="block text-xs font-medium text-brand-text-sec mb-1.5">Follow-up Date</label><input className="input" type="date" value={form.followUpDate} onChange={e => set('followUpDate', e.target.value)} /></div>
          </div>
          <div className="mb-6"><label className="block text-xs font-medium text-brand-text-sec mb-1.5">Notes</label><textarea className="input" rows={3} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Additional details..." /></div>
          <div className="flex justify-end gap-3">
            <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">{editId ? 'Update' : 'Save'}</button>
          </div>
        </form>
      </Modal>

      {/* ---- Delete Confirm ---- */}
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { deleteOpp(deleteId); toast?.('Opportunity deleted'); }}
        title="Delete Opportunity"
        message="Are you sure? This cannot be undone."
      />
    </div>
  );
}
