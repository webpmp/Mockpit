import React from 'react';
import { Minus, Plus } from 'lucide-react';

export interface NumericStepperProps {
  value: number | string;
  onChange: (value: string) => void;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

function getPrecision(step: number): number {
  const stepStr = step.toString();
  if (stepStr.includes('.')) {
    return stepStr.split('.')[1].length;
  }
  return 0;
}

function clampAndRound(val: number, min?: number, max?: number, step: number = 1): number {
  let clamped = val;
  if (min !== undefined) clamped = Math.max(min, clamped);
  if (max !== undefined) clamped = Math.min(max, clamped);
  const precision = getPrecision(step);
  return parseFloat(clamped.toFixed(precision));
}

export const NumericStepper: React.FC<NumericStepperProps> = ({
  value,
  onChange,
  min,
  max,
  step = 1,
  placeholder,
  className = '',
  disabled = false,
}) => {
  const strVal = value !== undefined && value !== null ? String(value) : '';

  const handleDecrement = (e: React.MouseEvent) => {
    e.preventDefault();
    if (disabled) return;
    let num = parseFloat(strVal);
    if (isNaN(num)) {
      num = min !== undefined ? min : parseFloat(placeholder || '0') || 0;
    } else {
      num = num - step;
    }
    const nextVal = clampAndRound(num, min, max, step);
    onChange(String(nextVal));
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.preventDefault();
    if (disabled) return;
    let num = parseFloat(strVal);
    if (isNaN(num)) {
      num = min !== undefined ? min : parseFloat(placeholder || '0') || 0;
    } else {
      num = num + step;
    }
    const nextVal = clampAndRound(num, min, max, step);
    onChange(String(nextVal));
  };

  const currentNum = parseFloat(strVal);
  const isAtMin = !isNaN(currentNum) && min !== undefined && currentNum <= min;
  const isAtMax = !isNaN(currentNum) && max !== undefined && currentNum >= max;

  return (
    <div className={`inline-flex items-center gap-1.5 shrink-0 ${className}`}>
      <button
        type="button"
        onClick={handleDecrement}
        disabled={disabled || isAtMin}
        title="Decrease"
        className="w-7 h-7 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 active:scale-95 disabled:opacity-40 disabled:hover:bg-slate-900 disabled:hover:text-slate-300 disabled:active:scale-100 disabled:cursor-not-allowed flex items-center justify-center transition-all select-none shrink-0"
      >
        <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
      </button>

      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={strVal}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-14 bg-slate-900 px-1 py-1 rounded-md text-slate-100 font-mono text-xs font-bold text-center focus:outline-none focus:ring-1 focus:ring-sky-500 border border-slate-700/80 no-spinner transition-all"
      />

      <button
        type="button"
        onClick={handleIncrement}
        disabled={disabled || isAtMax}
        title="Increase"
        className="w-7 h-7 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 active:scale-95 disabled:opacity-40 disabled:hover:bg-slate-900 disabled:hover:text-slate-300 disabled:active:scale-100 disabled:cursor-not-allowed flex items-center justify-center transition-all select-none shrink-0"
      >
        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
      </button>
    </div>
  );
};
