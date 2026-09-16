import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface WeatherDetailRowProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sub?: string;
  id?: string;
}

/**
 * Standard EPA / WHO UV Index Category scale:
 * 0–2 Low, 3–5 Moderate, 6–7 High, 8–10 Very High, 11+ Extreme.
 */
export function getUvCategory(uv: number): string {
  const rounded = Math.round(uv);
  if (rounded <= 2) return 'Low';
  if (rounded <= 5) return 'Moderate';
  if (rounded <= 7) return 'High';
  if (rounded <= 10) return 'Very High';
  return 'Extreme';
}

export { WeatherDetailCard } from './WeatherDetailCard';
export type { WeatherDetailCardProps } from './WeatherDetailCard';

export function WeatherDetailRow({ icon: Icon, label, value, sub, id }: WeatherDetailRowProps) {
  const rowId = id || `weather-detail-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div
      id={rowId}
      className="bg-slate-950/55 border border-slate-800 rounded-xl flex items-center justify-between px-3.5 py-2.5"
    >
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/25 flex items-center justify-center text-sky-300 shrink-0">
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-xs font-bold uppercase tracking-wide text-slate-300 font-mono">{label}</span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-lg font-black font-mono text-slate-100">{value}</span>
        {sub && <span className="text-[10px] font-bold font-mono text-slate-500">{sub}</span>}
      </div>
    </div>
  );
}
