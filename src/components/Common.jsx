import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';

/* ============================================================
   MODAL
   ============================================================ */
export function Modal({ open, onClose, title, size = 'md', children }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;
  const widths = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl' };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
      <div className={`card w-full ${widths[size]} max-h-[90vh] overflow-y-auto shadow-xl`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-7 pt-6 pb-0">
          <h2 className="text-lg font-bold tracking-tight text-brand-text">{title}</h2>
          <button onClick={onClose} className="btn-icon border-none text-brand-text-muted hover:text-brand-text">
            <X size={20} />
          </button>
        </div>
        <div className="px-7 py-5">{children}</div>
      </div>
    </div>
  );
}

/* ============================================================
   CONFIRM DIALOG
   ============================================================ */
export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Delete', danger = true }) {
  if (!open) return null;
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-brand-text-sec mb-6 leading-relaxed">{message}</p>
      <div className="flex justify-end gap-3">
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</button>
      </div>
    </Modal>
  );
}

/* ============================================================
   TOAST SYSTEM
   ============================================================ */
const ToastCtx = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  }, []);

  return (
    <ToastCtx.Provider value={addToast}>
      {children}
      <div className="fixed bottom-6 right-6 z-[300] flex flex-col gap-2">
        {toasts.map(t => (
          <div key={t.id} className="flex items-center gap-2.5 px-5 py-3.5 rounded-sm text-sm font-normal text-white shadow-lg min-w-[260px] bg-brand-text" style={{ animation: 'toastIn 0.3s ease' }}>
            {t.type === 'success' ? <CheckCircle size={18} className="text-green-400" /> : <AlertCircle size={18} className="text-red-400" />}
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);

/* ============================================================
   EMPTY STATE
   ============================================================ */
export function EmptyState({ icon: Icon, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-brand-text-muted text-center">
      {Icon && <Icon size={48} className="opacity-40 mb-4" />}
      <p className="text-[15px] mb-5 max-w-[360px] leading-relaxed">{message}</p>
      {action}
    </div>
  );
}

/* ============================================================
   PAGE HEADER
   ============================================================ */
export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-8 flex-wrap">
      <div>
        <h1 className="text-[28px] font-bold tracking-tight text-brand-text">{title}</h1>
        {subtitle && <p className="text-[15px] text-brand-text-sec mt-1.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

/* ============================================================
   COPY BUTTON
   ============================================================ */
export function CopyButton({ text, label = 'Copy', copiedLabel = 'Copied!' }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button onClick={handleCopy} className={`btn btn-sm ${copied ? 'bg-brand-success text-white' : 'btn-primary'}`}>
      {copied ? copiedLabel : label}
    </button>
  );
}
