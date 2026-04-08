import { AI_PROMPTS } from '../data';
import { PageHeader, CopyButton } from './Common';
import {
  Mail, PenLine, Handshake, ListChecks, Wand2, Compass, ClipboardList, Sparkles,
} from 'lucide-react';

const ICON_MAP = { Mail, PenLine, Handshake, ListChecks, Wand2, Compass, ClipboardList };

export default function Prompts() {
  return (
    <div className="animate-fadeIn">
      <PageHeader title="Prompt Studio" subtitle="Claude-ready prompts to draft, negotiate, and respond like a pro." />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {AI_PROMPTS.map(p => {
          const Icon = ICON_MAP[p.icon] || Sparkles;
          return (
            <div key={p.id} className="card p-5 flex flex-col gap-3 hover:shadow-md transition-all">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-sm bg-gradient-to-br from-brand-primary-l to-[#f9e8e5] text-brand-primary flex items-center justify-center shrink-0">
                  <Icon size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-brand-text">{p.title}</p>
                  <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider bg-brand-surface-alt text-brand-text-muted">
                    {p.category}
                  </span>
                </div>
              </div>

              <div className="bg-brand-surface-alt border border-brand-border-l rounded-sm p-3.5 text-[13px] leading-relaxed text-brand-text-sec whitespace-pre-line flex-1 max-h-[200px] overflow-y-auto">
                {p.text}
              </div>

              <div className="flex justify-end">
                <CopyButton text={p.text} label="Copy Prompt" copiedLabel="Copied!" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
