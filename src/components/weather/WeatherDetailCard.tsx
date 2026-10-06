import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface WeatherDetailCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sub?: string;
  id?: string;
  key?: React.Key;
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

export function WeatherDetailCard({
  icon: Icon,
  label,
  value,
  sub,
  id,
}: WeatherDetailCardProps) {
  const cardId = id || `weather-detail-${label.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div
      id={cardId}
      className="bg-ds-background/55 border border-ds-line-subtle rounded-xl h-[235px] flex flex-col items-center justify-center gap-3 text-center min-w-0 p-4"
    >
      <Icon className="w-14 h-14 text-ds-primary shrink-0" strokeWidth={1.5} />
      <span className="text-[10px] font-bold uppercase tracking-wide text-ds-content-secondary font-mono leading-tight break-words">
        {label}
      </span>
      <div className="flex items-baseline gap-1">
        <span className="text-lg font-black font-mono text-ds-content leading-none">{value}</span>
        {sub && <span className="text-[10px] font-bold font-mono text-ds-content-subtle">{sub}</span>}
      </div>
    </div>
  );
}
