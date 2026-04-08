import { useState } from 'react';
import { useData } from '../contexts';
import { REPLY_TEMPLATES } from '../data';
import { PageHeader, Modal, CopyButton, useToast, ConfirmDialog } from './Common';
import {
  Gift, DollarSign, Tag, Clock, XCircle, ArrowUpRight, Shield, Calendar,
  Receipt, ChevronDown, Plus, Pencil, Trash2, MessageSquareText,
} from 'lucide-react';

/* Map icon names from data to components */
const ICON_MAP = { Gift, DollarSign, Tag, Clock, XCircle, ArrowUpRight, Shield, Calendar, Receipt };

export default function Templates() {
  const { customTemplates, addTemplate, updateTemplate, deleteTemplate } = useData();
  const toast = useToast();

  const [openCards, setOpenCards] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState({ title: '', text: '', category: 'Custom' });

  const toggleCard = (id) => setOpenCards(prev => ({ ...prev, [id]: !prev[id] }));

  const openAdd = () => { setEditId(null); setForm({ title: '', text: '', category: 'Custom' }); setModalOpen(true); };
  const openEdit = (t) => { setEditId(t.id); setForm({ title: t.title, text: t.text, category: t.category || 'Custom' }); setModalOpen(true); };

  const handleSave = () => {
    if (!form.title || !form.text) return;
    if (editId) {
      updateTemplate(editId, form);
      toast?.('Template updated');
    } else {
      addTemplate({ ...form, icon: 'MessageSquareText' });
      toast?.('Template created');
    }
    setModalOpen(false);
  };

  /* Combine built-in + custom */
  const allTemplates = [
    ...REPLY_TEMPLATES.map(t => ({ ...t, builtin: true })),
    ...customTemplates.map(t => ({ ...t, builtin: false })),
  ];

  return (
    <div className="animate-fadeIn">
      <PageHeader title="Reply Library" subtitle="Copy-paste-ready templates for every creator inbox scenario.">
        <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> New Template</button>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {allTemplates.map(t => {
          const isOpen = openCards[t.id];
          const Icon = ICON_MAP[t.icon] || MessageSquareText;
          return (
            <div key={t.id} className="card overflow-hidden">
              {/* Header */}
              <button onClick={() => toggleCard(t.id)} className="w-full flex items-center justify-between px-5 py-4 hover:bg-brand-surface-alt transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-sm bg-brand-primary-l text-brand-primary flex items-center justify-center shrink-0">
                    <Icon size={18} />
                  </div>
                  <div className="text-left">
                    <span className="text-sm font-semibold text-brand-text">{t.title}</span>
                    {t.category && <span className="block text-[11px] text-brand-text-muted mt-0.5">{t.category}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!t.builtin && (
                    <>
                      <span onClick={(e) => { e.stopPropagation(); openEdit(t); }} className="btn-icon border-none" title="Edit">
                        <Pencil size={14} />
                      </span>
                      <span onClick={(e) => { e.stopPropagation(); setDeleteId(t.id); }} className="btn-icon border-none" title="Delete">
                        <Trash2 size={14} />
                      </span>
                    </>
                  )}
                  <ChevronDown size={18} className={`text-brand-text-muted transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {/* Body */}
              {isOpen && (
                <div className="px-5 pb-5 animate-fadeIn">
                  <div className="bg-brand-surface-alt border border-brand-border-l rounded-sm p-4 text-[13.5px] leading-relaxed text-brand-text-sec whitespace-pre-line mb-3">
                    {t.text}
                  </div>
                  <div className="flex justify-end">
                    <CopyButton text={t.text} label="Copy to Clipboard" copiedLabel="Copied!" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ---- Add/Edit Modal ---- */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editId ? 'Edit Template' : 'New Template'} size="md">
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-xs font-medium text-brand-text-sec mb-1.5">Template Title *</label>
            <input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Counter-offer response" />
          </div>
          <div>
            <label className="block text-xs font-medium text-brand-text-sec mb-1.5">Category</label>
            <input className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="e.g. Negotiation" />
          </div>
          <div>
            <label className="block text-xs font-medium text-brand-text-sec mb-1.5">Template Text *</label>
            <textarea className="input" rows={10} value={form.text} onChange={e => setForm(f => ({ ...f, text: e.target.value }))} placeholder="Write your template here..." />
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={!form.title || !form.text}>{editId ? 'Update' : 'Save'}</button>
        </div>
      </Modal>

      {/* ---- Delete Confirm ---- */}
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { deleteTemplate(deleteId); toast?.('Template deleted'); }}
        title="Delete Template"
        message="Are you sure you want to delete this custom template?"
      />
    </div>
  );
}
