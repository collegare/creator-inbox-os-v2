import { useMemo } from 'react';
import { useData } from '../contexts';
import { PageHeader } from './Common';
import { parseRate, fmtCurrency, fmtDateShort, isDue, PIPELINE_STAGES } from '../utils';
import {
  Mail, Clock, DollarSign, Gift, Archive, TrendingUp,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

const PIE_COLORS = ['#2d6a4f','#4a6fa5','#b8860b','#7b2d8e','#6b1309','#9e9892'];

export default function Dashboard({ onNavigate }) {
  const { opportunities } = useData();

  /* ---------- STATS ---------- */
  const stats = useMemo(() => {
    const active = opportunities.filter(o => o.status !== 'archived');
    return {
      newCount:     opportunities.filter(o => o.status === 'new').length,
      followUp:     opportunities.filter(o => o.followUpDate && isDue(o.followUpDate) && o.status !== 'archived' && o.status !== 'closed-won' && o.status !== 'closed-lost').length,
      paid:         active.filter(o => o.type === 'paid').length,
      gifted:       active.filter(o => o.type === 'gifting').length,
      archived:     opportunities.filter(o => o.status === 'archived').length,
      totalPipeline: active.reduce((s, o) => s + parseRate(o.rate), 0),
      closedRevenue: opportunities.filter(o => o.status === 'closed-won').reduce((s, o) => s + parseRate(o.rate), 0),
    };
  }, [opportunities]);

  /* ---------- REVENUE CHART DATA (last 6 months) ---------- */
  const revenueData = useMemo(() => {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      const label = d.toLocaleDateString('en-US', { month: 'short' });
      const closed = opportunities.filter(o => o.status === 'closed-won' && o.updatedAt?.startsWith(key));
      const revenue = closed.reduce((s, o) => s + parseRate(o.rate), 0);
      const count = closed.length;
      months.push({ name: label, revenue, deals: count });
    }
    return months;
  }, [opportunities]);

  /* ---------- TYPE BREAKDOWN (pie chart) ---------- */
  const typeBreakdown = useMemo(() => {
    const map = {};
    opportunities.filter(o => o.status !== 'archived').forEach(o => {
      const t = o.type || 'unclear';
      map[t] = (map[t] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [opportunities]);

  /* ---------- RECENT ---------- */
  const recent = useMemo(() =>
    [...opportunities].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 6),
  [opportunities]);

  /* ---------- STAT CARDS CONFIG ---------- */
  const cards = [
    { label: 'New', value: stats.newCount, icon: Mail, color: 'bg-brand-info-bg text-brand-info' },
    { label: 'Follow-ups Due', value: stats.followUp, icon: Clock, color: 'bg-brand-warning-bg text-brand-warning' },
    { label: 'Paid Opps', value: stats.paid, icon: DollarSign, color: 'bg-brand-success-bg text-brand-success' },
    { label: 'Gifted Opps', value: stats.gifted, icon: Gift, color: 'bg-[var(--c-gifted-bg)] text-[var(--c-gifted)]' },
    { label: 'Archived', value: stats.archived, icon: Archive, color: 'bg-brand-surface-alt text-brand-text-muted' },
  ];

  return (
    <div className="animate-fadeIn">
      <PageHeader title="Welcome back" subtitle="Here's what's happening in your creator inbox today." />

      {/* ---- Stat Cards ---- */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 mb-9">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} className="card flex items-center gap-3.5 px-5 py-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
              <div className={`w-11 h-11 rounded-sm flex items-center justify-center shrink-0 ${c.color}`}>
                <Icon size={20} />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-2xl font-bold tracking-tight leading-none">{c.value}</span>
                <span className="text-[12.5px] text-brand-text-sec mt-1 leading-tight">{c.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ---- Revenue Row ---- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        {/* Revenue highlight cards */}
        <div className="card p-6 flex flex-col justify-center">
          <div className="flex items-center gap-2 text-brand-text-sec text-sm mb-2">
            <TrendingUp size={16} /> Pipeline Value
          </div>
          <span className="text-3xl font-bold tracking-tight">{fmtCurrency(stats.totalPipeline)}</span>
          <span className="text-xs text-brand-text-muted mt-1">{opportunities.filter(o => o.status !== 'archived').length} active opportunities</span>
        </div>
        <div className="card p-6 flex flex-col justify-center">
          <div className="flex items-center gap-2 text-brand-text-sec text-sm mb-2">
            <DollarSign size={16} /> Closed Revenue
          </div>
          <span className="text-3xl font-bold tracking-tight text-brand-success">{fmtCurrency(stats.closedRevenue)}</span>
          <span className="text-xs text-brand-text-muted mt-1">{opportunities.filter(o => o.status === 'closed-won').length} deals closed</span>
        </div>

        {/* Type breakdown pie */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-brand-text mb-2">By Type</h3>
          {typeBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={140}>
              <PieChart>
                <Pie data={typeBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={55} innerRadius={30} paddingAngle={2}>
                  {typeBreakdown.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Legend iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[140px] flex items-center justify-center text-sm text-brand-text-muted">No data yet</div>
          )}
        </div>
      </div>

      {/* ---- Revenue Chart ---- */}
      <div className="card p-6 mb-8">
        <h3 className="text-sm font-semibold text-brand-text mb-4">Revenue — Last 6 Months</h3>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={revenueData}>
            <defs>
              <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--c-primary)" stopOpacity={0.15} />
                <stop offset="95%" stopColor="var(--c-primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--c-border-light)" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--c-text-muted)' }} />
            <YAxis tick={{ fontSize: 12, fill: 'var(--c-text-muted)' }} tickFormatter={v => `$${v}`} />
            <Tooltip contentStyle={{ fontSize: '13px', borderRadius: '8px', background: 'var(--c-surface)', border: '1px solid var(--c-border-light)' }} formatter={v => [`$${v}`, 'Revenue']} />
            <Area type="monotone" dataKey="revenue" stroke="var(--c-primary)" fill="url(#grad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ---- Bottom Row: How-to + Recent ---- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* How to use */}
        <div className="card">
          <div className="flex items-center gap-2.5 px-6 pt-5 text-sm font-semibold text-brand-text">
            <span className="text-brand-primary">&#9432;</span> How to Use This Dashboard
          </div>
          <div className="px-6 py-4">
            <ol className="list-none space-y-0">
              {[
                ['Log every opportunity', 'Add it to Opportunities as soon as it lands.'],
                ['Categorize & prioritize', 'Tag by type and set a priority level.'],
                ['Respond with confidence', 'Use Reply Library for polished templates.'],
                ['Draft with AI prompts', 'Prompt Studio handles tricky emails.'],
                ['Follow up & close', 'Daily Workflow runs your inbox in 10 min.'],
              ].map(([title, desc], i) => (
                <li key={i} className="flex items-start gap-3.5 py-3 border-b border-brand-border-l last:border-b-0 first:pt-0 last:pb-0">
                  <span className="w-7 h-7 rounded-full bg-brand-primary-l text-brand-primary text-xs font-semibold flex items-center justify-center shrink-0">{i+1}</span>
                  <div className="min-w-0">
                    <span className="block text-[13.5px] font-semibold text-brand-text leading-snug">{title}</span>
                    <span className="block text-[13px] text-brand-text-sec leading-snug mt-0.5">{desc}</span>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Recent opportunities */}
        <div className="card flex flex-col">
          <div className="flex items-center gap-2.5 px-6 pt-5 text-sm font-semibold text-brand-text">
            <Clock size={16} className="text-brand-primary" /> Recent Opportunities
          </div>
          <div className="px-6 py-4 flex-1 flex flex-col">
            {recent.length > 0 ? (
              <div className="flex flex-col gap-2 flex-1">
                {recent.map(o => (
                  <div key={o.id} className="flex items-center justify-between px-3.5 py-2.5 rounded-sm bg-brand-surface-alt hover:bg-brand-bg transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">{o.brand}</span>
                      <span className={`badge badge-${o.type}`}>{o.type}</span>
                    </div>
                    <span className={`badge badge-${o.status?.replace(/\s+/g, '-')}`}>{o.status}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-brand-text-muted py-8">
                <Mail size={40} className="opacity-40 mb-3" />
                <p className="text-sm max-w-[280px] text-center">No opportunities yet. Head to Opportunities to add your first one.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
