import { useState, useEffect } from 'react';
import { WORKFLOW_STEPS } from '../data';
import { PageHeader } from './Common';
import { CheckCircle2, Circle, ExternalLink, RotateCcw } from 'lucide-react';

/** Tab each workflow step links to */
const STEP_LINKS = {
  1: { tab: 'inbox',         label: 'Open Inbox' },
  2: { tab: 'opportunities', label: 'Open Opportunities' },
  3: { tab: 'opportunities', label: 'Open Opportunities' },
  4: { tab: 'templates',     label: 'Open Reply Library' },
  5: { tab: 'opportunities', label: 'Open Opportunities' },
  6: { tab: 'opportunities', label: 'Open Opportunities' },
};

function todayKey() {
  return new Date().toISOString().split('T')[0];
}

function loadChecked() {
  try {
    const raw = localStorage.getItem('cio_workflow_checked');
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    // Reset if saved for a different day
    if (parsed.date !== todayKey()) return new Set();
    return new Set(parsed.steps);
  } catch {
    return new Set();
  }
}

function saveChecked(checkedSet) {
  try {
    localStorage.setItem('cio_workflow_checked', JSON.stringify({
      date: todayKey(),
      steps: [...checkedSet],
    }));
  } catch {}
}

export default function Workflow({ onNavigate }) {
  const [checked, setChecked] = useState(() => loadChecked());

  useEffect(() => {
    saveChecked(checked);
  }, [checked]);

  const toggle = (num) => {
    setChecked(prev => {
      const next = new Set(prev);
      if (next.has(num)) next.delete(num);
      else next.add(num);
      return next;
    });
  };

  const reset = () => setChecked(new Set());

  const completedCount = checked.size;
  const totalCount = WORKFLOW_STEPS.length;
  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const allDone = completedCount === totalCount;

  return (
    <div className="animate-fadeIn">
      <PageHeader title="Daily Workflow" subtitle="Run your creator inbox in 10 minutes a day." />

      {/* Progress card */}
      <div className="card p-5 max-w-2xl mb-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-sm font-semibold text-brand-text">
              {allDone ? 'All done for today!' : `${completedCount} of ${totalCount} steps complete`}
            </span>
            {!allDone && (
              <span className="text-xs text-brand-text-muted ml-2">Resets each morning</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-brand-primary">{pct}%</span>
            {completedCount > 0 && (
              <button
                onClick={reset}
                className="btn-icon"
                title="Reset today's progress"
              >
                <RotateCcw size={14} />
              </button>
            )}
          </div>
        </div>
        <div className="h-2 bg-brand-border-l rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${pct}%`,
              backgroundColor: allDone ? 'var(--c-success)' : 'var(--c-primary)',
            }}
          />
        </div>
      </div>

      {/* Step list */}
      <div className="flex flex-col gap-3 max-w-2xl">
        {WORKFLOW_STEPS.map(step => {
          const done = checked.has(step.number);
          const link = STEP_LINKS[step.number];
          return (
            <div
              key={step.number}
              className={`card p-5 flex gap-4 items-start transition-all duration-200 ${done ? 'opacity-55' : 'hover:shadow-sm'}`}
            >
              {/* Checkbox */}
              <button
                onClick={() => toggle(step.number)}
                className="shrink-0 mt-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary rounded-full"
                aria-label={done ? `Mark step ${step.number} incomplete` : `Mark step ${step.number} complete`}
              >
                {done
                  ? <CheckCircle2 size={26} style={{ color: 'var(--c-success)' }} />
                  : <Circle size={26} className="text-brand-border hover:text-brand-text-muted transition-colors" />
                }
              </button>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3 mb-1">
                  <h3 className={`text-[15px] font-semibold leading-snug ${done ? 'line-through text-brand-text-muted' : 'text-brand-text'}`}>
                    {step.title}
                  </h3>
                  {link && onNavigate && (
                    <button
                      onClick={() => onNavigate(link.tab)}
                      className="btn btn-ghost btn-sm shrink-0 text-xs gap-1"
                    >
                      {link.label}
                      <ExternalLink size={11} />
                    </button>
                  )}
                </div>
                <p className={`text-sm leading-relaxed ${done ? 'text-brand-text-muted' : 'text-brand-text-sec'}`}>
                  {step.desc}
                </p>
                <span className="inline-block mt-2 text-xs font-medium text-brand-primary">{step.time}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
