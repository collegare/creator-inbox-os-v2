import { useState, useMemo, useCallback, useEffect } from 'react';
import { useData, useAuth } from '../contexts';
import { useCalendar } from '../hooks';
import { PageHeader, Modal, useToast } from './Common';
import { fmtDateShort, monthName, daysInMonth, firstDayOfMonth } from '../utils';
import { ChevronLeft, ChevronRight, Plus, RefreshCw, Trash2, CalendarDays } from 'lucide-react';

export default function CalendarView() {
  const { calendarEvents, addCalEvent, deleteCalEvent, opportunities } = useData();
  const { accessToken } = useAuth();
  const { fetchEvents, loading } = useCalendar();
  const toast = useToast();

  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ title: '', start: '', end: '', description: '' });

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y-1); } else setMonth(m => m-1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y+1); } else setMonth(m => m+1); };

  /* ---- Merge calendar events + opportunity deadlines ---- */
  const allEvents = useMemo(() => {
    const events = [...calendarEvents];
    /* Add follow-up dates from opportunities as events */
    opportunities.forEach(o => {
      if (o.followUpDate) {
        events.push({ id: `opp-fu-${o.id}`, title: `Follow-up: ${o.brand}`, start: o.followUpDate, type: 'follow-up', source: 'opportunity' });
      }
    });
    return events;
  }, [calendarEvents, opportunities]);

  /* ---- Grid data ---- */
  const gridData = useMemo(() => {
    const days = daysInMonth(year, month);
    const startDay = firstDayOfMonth(year, month);
    const cells = [];
    for (let i = 0; i < startDay; i++) cells.push(null);
    for (let d = 1; d <= days; d++) {
      const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const dayEvents = allEvents.filter(e => e.start?.startsWith(dateStr));
      cells.push({ day: d, date: dateStr, events: dayEvents });
    }
    return cells;
  }, [year, month, allEvents]);

  /* ---- Sync Google Calendar ---- */
  const handleSync = useCallback(async () => {
    const start = new Date(year, month, 1).toISOString();
    const end = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
    const events = await fetchEvents(start, end);
    events.forEach(e => addCalEvent(e));
    toast?.(`Synced ${events.length} events`);
  }, [fetchEvents, addCalEvent, year, month, toast]);

  /* ---- Add event ---- */
  const handleAdd = () => {
    if (!form.title || !form.start) return;
    addCalEvent({ ...form, source: 'manual' });
    toast?.('Event added');
    setModalOpen(false);
    setForm({ title: '', start: '', end: '', description: '' });
  };

  const today = new Date();
  const isToday = (dateStr) => {
    const t = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
    return dateStr === t;
  };

  return (
    <div className="animate-fadeIn">
      <PageHeader title="Calendar" subtitle="Track deadlines, follow-ups, and synced events.">
        <div className="flex gap-2">
          {accessToken && (
            <button onClick={handleSync} disabled={loading} className="btn btn-secondary btn-sm">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Sync Google
            </button>
          )}
          <button className="btn btn-primary btn-sm" onClick={() => setModalOpen(true)}>
            <Plus size={14} /> Add Event
          </button>
        </div>
      </PageHeader>

      {/* ---- Month Navigation ---- */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={prevMonth} className="btn-icon"><ChevronLeft size={18} /></button>
        <h2 className="text-lg font-semibold">{monthName(month)} {year}</h2>
        <button onClick={nextMonth} className="btn-icon"><ChevronRight size={18} /></button>
      </div>

      {/* ---- Calendar Grid ---- */}
      <div className="card overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-brand-border-l">
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
            <div key={d} className="py-2.5 text-center text-xs font-medium text-brand-text-muted">{d}</div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {gridData.map((cell, i) => (
            <div key={i} className={`min-h-[100px] border-b border-r border-brand-border-l p-2 ${cell ? 'bg-brand-surface' : 'bg-brand-surface-alt'}`}>
              {cell && (
                <>
                  <span className={`text-xs font-medium inline-flex items-center justify-center w-6 h-6 rounded-full ${isToday(cell.date) ? 'bg-brand-primary text-white' : 'text-brand-text-sec'}`}>
                    {cell.day}
                  </span>
                  <div className="mt-1 space-y-0.5">
                    {cell.events.slice(0, 3).map(ev => (
                      <div key={ev.id} className={`text-[10px] px-1.5 py-0.5 rounded truncate ${ev.source === 'opportunity' ? 'bg-brand-warning-bg text-brand-warning' : ev.source === 'google' ? 'bg-brand-info-bg text-brand-info' : 'bg-brand-primary-l text-brand-primary'}`}>
                        {ev.title}
                      </div>
                    ))}
                    {cell.events.length > 3 && (
                      <span className="text-[10px] text-brand-text-muted">+{cell.events.length - 3} more</span>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ---- Upcoming events sidebar ---- */}
      <div className="mt-6 card p-5">
        <h3 className="text-sm font-semibold mb-3">Upcoming Events</h3>
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {allEvents
            .filter(e => new Date(e.start) >= new Date(new Date().setHours(0,0,0,0)))
            .sort((a, b) => new Date(a.start) - new Date(b.start))
            .slice(0, 10)
            .map(e => (
              <div key={e.id} className="flex items-center justify-between px-3 py-2.5 rounded-sm bg-brand-surface-alt">
                <div className="flex items-center gap-3 min-w-0">
                  <CalendarDays size={14} className="text-brand-text-muted shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{e.title}</p>
                    <p className="text-xs text-brand-text-muted">{fmtDateShort(e.start)}</p>
                  </div>
                </div>
                {e.source !== 'opportunity' && (
                  <button onClick={() => { deleteCalEvent(e.id); toast?.('Event removed'); }} className="btn-icon border-none shrink-0">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))
          }
          {allEvents.filter(e => new Date(e.start) >= new Date(new Date().setHours(0,0,0,0))).length === 0 && (
            <p className="text-sm text-brand-text-muted py-4 text-center">No upcoming events</p>
          )}
        </div>
      </div>

      {/* ---- Add Event Modal ---- */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Event" size="sm">
        <div className="space-y-4 mb-6">
          <div><label className="block text-xs font-medium text-brand-text-sec mb-1.5">Title *</label><input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Follow-up with Glossier" /></div>
          <div><label className="block text-xs font-medium text-brand-text-sec mb-1.5">Date *</label><input className="input" type="date" value={form.start} onChange={e => setForm(f => ({ ...f, start: e.target.value }))} /></div>
          <div><label className="block text-xs font-medium text-brand-text-sec mb-1.5">Notes</label><textarea className="input" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
        </div>
        <div className="flex justify-end gap-3">
          <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleAdd} disabled={!form.title || !form.start}>Add</button>
        </div>
      </Modal>
    </div>
  );
}
