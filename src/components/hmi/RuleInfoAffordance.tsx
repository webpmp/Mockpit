import React, { useState } from 'react';
import { HMIRule } from '../../lib/hmiRules/registry';
import { Info } from 'lucide-react';

interface RuleInfoAffordanceProps {
  rule: HMIRule;
}

export const RuleInfoAffordance: React.FC<RuleInfoAffordanceProps> = ({ rule }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-flex items-center shrink-0">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className="w-5 h-5 rounded-md bg-slate-800/90 hover:bg-slate-700 text-slate-400 hover:text-sky-300 flex items-center justify-center text-xs font-mono transition-colors cursor-pointer border border-slate-700/70 shadow-sm"
        title={`View rule standard & details for ${rule.title}`}
        aria-label={`View details for rule ${rule.title}`}
      >
        <Info className="w-3.5 h-3.5" />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 bottom-full mb-1.5 z-50 w-72 sm:w-80 p-3 rounded-xl bg-slate-950 border border-slate-700/90 shadow-2xl text-xs font-mono space-y-1.5 animate-in fade-in zoom-in-95 duration-100 text-left pointer-events-none"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-1">
            <span className="text-xs font-bold text-sky-400 uppercase tracking-wider">
              {rule.category} • {rule.tier.toUpperCase()}
            </span>
            <span className="text-xs text-slate-500">{rule.id}</span>
          </div>
          <div className="text-slate-200 font-bold text-xs">{rule.title}</div>
          <p className="text-slate-300 text-xs leading-relaxed font-sans">{rule.description}</p>
          {rule.standardRef && (
            <div className="text-[11px] text-slate-400 font-mono pt-1 border-t border-slate-800/80">
              <span className="text-slate-500 font-semibold">Standard: </span>
              <span className="text-sky-300">{rule.standardRef}</span>
            </div>
          )}
          <div className="text-[10px] text-slate-500 font-mono flex items-center justify-between pt-0.5">
            <span>Source: {rule.source}</span>
            {rule.addedDate && <span>Added: {rule.addedDate}</span>}
          </div>
        </div>
      )}
    </div>
  );
};

