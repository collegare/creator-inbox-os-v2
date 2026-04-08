/* ============================================================
   Utility helpers
   ============================================================ */

/** Format ISO date to readable string */
export function fmtDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** Short date: "Apr 7" */
export function fmtDateShort(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** Check if a date is today or past */
export function isDue(dateStr) {
  if (!dateStr) return false;
  const today = new Date(); today.setHours(0,0,0,0);
  return new Date(dateStr) <= today;
}

/** Format currency */
export function fmtCurrency(val) {
  if (!val) return '$0';
  const num = typeof val === 'string' ? parseFloat(val.replace(/[^0-9.-]/g, '')) : val;
  if (isNaN(num)) return val;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num);
}

/** Parse a rate string to number */
export function parseRate(str) {
  if (!str) return 0;
  const num = parseFloat(String(str).replace(/[^0-9.-]/g, ''));
  return isNaN(num) ? 0 : num;
}

/** Copy text to clipboard with fallback */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    return true;
  }
}

/** Escape HTML */
export function escHtml(str) {
  if (!str) return '';
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

/** Get month name */
export function monthName(idx) {
  return ['January','February','March','April','May','June','July','August','September','October','November','December'][idx];
}

/** Get days in a month */
export function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

/** Get day of week the month starts on (0=Sun) */
export function firstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

/** Pipeline statuses in order */
export const PIPELINE_STAGES = [
  { id: 'new',           label: 'New' },
  { id: 'review',        label: 'Review' },
  { id: 'replied',       label: 'Replied' },
  { id: 'negotiating',   label: 'Negotiating' },
  { id: 'in-progress',   label: 'In Progress' },
  { id: 'filming',       label: 'Filming' },
  { id: 'editing',       label: 'Editing' },
  { id: 'in-review',     label: 'In Review' },
  { id: 'revisions',     label: 'Revisions' },
  { id: 'shipment',      label: 'Shipment' },
  { id: 'delivered',     label: 'Post/Delivered' },
  { id: 'follow-up',     label: 'Follow-up' },
  { id: 'closed-won',    label: 'Closed Won' },
  { id: 'closed-lost',   label: 'Closed Lost' },
  { id: 'archived',      label: 'Archived' },
];

/** Opportunity types */
export const OPP_TYPES = ['paid', 'gifting', 'affiliate', 'pr', 'partnership', 'unclear'];

/** Priority levels */
export const PRIORITIES = ['high', 'medium', 'low'];

/** Get badge class for a status */
export function statusBadge(status) {
  return `badge-${status?.replace(/\s+/g, '-') || 'new'}`;
}
