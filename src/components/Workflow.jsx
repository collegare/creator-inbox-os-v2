import { WORKFLOW_STEPS } from '../data';
import { PageHeader } from './Common';

export default function Workflow() {
  return (
    <div className="animate-fadeIn">
      <PageHeader title="Daily Workflow" subtitle="How to run your creator inbox in 10 minutes a day." />

      <p className="text-[15px] text-brand-text-sec leading-relaxed max-w-2xl mb-6">
        Run through these six steps every day to stay on top of your creator inbox. Total time: about 10 minutes.
      </p>

      <div className="flex flex-col gap-4 max-w-2xl">
        {WORKFLOW_STEPS.map(step => (
          <div key={step.number} className="card p-6 flex gap-5 items-start hover:shadow-sm transition-all">
            <div className="w-10 h-10 rounded-full bg-brand-primary text-white text-base font-bold flex items-center justify-center shrink-0">
              {step.number}
            </div>
            <div className="flex-1">
              <h3 className="text-[15px] font-semibold mb-1.5">{step.title}</h3>
              <p className="text-sm text-brand-text-sec leading-relaxed">{step.desc}</p>
              <span className="inline-block mt-2 text-xs font-medium text-brand-primary">{step.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
