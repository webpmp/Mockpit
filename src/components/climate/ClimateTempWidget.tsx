import React, { useState, useRef } from 'react';
import { Plus, Minus } from 'lucide-react';
import { ComponentHeader } from '../ComponentRenderer';
import { useMockpitStore } from '../../store/useMockpitStore';
import { getTemperatureColor } from '../../utils/tempGradient';
import { useHoldRepeat } from '../../hooks/useHoldRepeat';

interface ClimateTempWidgetProps {
  component: any;
  resolved: Record<string, any>;
  isSelected?: boolean;
  customColor: string;
  baseOpacity: string;
  styleOpacity: number;
}

export const ClimateTempWidget: React.FC<ClimateTempWidgetProps> = ({
  component,
  resolved,
  isSelected,
  customColor,
  baseOpacity,
  styleOpacity,
}) => {
  const headerLabel = resolved.label || component.staticProps?.label || 'Temperature';

  const minTemp = Number(component.staticProps?.minTemp) || 60;
  const maxTemp = Number(component.staticProps?.maxTemp) || 85;
  const orientation = (component.staticProps?.orientation || 'vertical') as 'vertical' | 'horizontal';

  const tempGradientColors = useMockpitStore((s) => s.tempGradientColors);

  const [temp, setTemp] = useState<number>(() => {
    const p = parseFloat(String(resolved.temp || component.staticProps?.temp || '72'));
    return isNaN(p) ? 72 : Math.min(maxTemp, Math.max(minTemp, p));
  });

  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const puckRef = useRef<HTMLDivElement>(null);

  const plusRepeat = useHoldRepeat({
    onTrigger: () => setTemp((prev) => Math.min(maxTemp, prev + 1)),
  });

  const minusRepeat = useHoldRepeat({
    onTrigger: () => setTemp((prev) => Math.max(minTemp, prev - 1)),
  });

  const pct = Math.min(100, Math.max(0, ((temp - minTemp) / (maxTemp - minTemp)) * 100));

  const ratio = pct / 100;
  const posCalcHorizontal = `calc(clamp(12px,3.5cqw,18px) + ${pct}% - clamp(24px,7cqw,36px) * ${ratio})`;
  const posCalcVertical = `calc(clamp(12px,4cqw,19px) + ${pct}% - clamp(24px,8cqw,38px) * ${ratio})`;

  // Compute calibrated color at current temperature
  const currentColor = getTemperatureColor(temp, minTemp, maxTemp, tempGradientColors);

  // Compute gradient stops for track fill background
  const comfortTemp = Math.min(maxTemp - 1, Math.max(minTemp + 1, 72));
  const comfortPct = Math.min(100, Math.max(0, ((comfortTemp - minTemp) / (maxTemp - minTemp)) * 100));

  const trackGradientStyle =
    orientation === 'horizontal'
      ? `linear-gradient(to right, ${tempGradientColors.cold} 0%, ${tempGradientColors.neutral} ${comfortPct}%, ${tempGradientColors.hot} 100%)`
      : `linear-gradient(to top, ${tempGradientColors.cold} 0%, ${tempGradientColors.neutral} ${comfortPct}%, ${tempGradientColors.hot} 100%)`;

  const updateTempFromPointer = (e: React.PointerEvent) => {
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const puckRect = puckRef.current?.getBoundingClientRect();

    if (orientation === 'horizontal') {
      const width = rect.width;
      const radius = puckRect ? puckRect.width / 2 : 14;
      const usableWidth = width - 2 * radius;
      const clickX = e.clientX - rect.left;
      const clampedX = Math.max(0, Math.min(usableWidth, clickX - radius));
      const newRatio = usableWidth > 0 ? clampedX / usableWidth : 0;
      const newTemp = Math.round(minTemp + newRatio * (maxTemp - minTemp));
      setTemp(newTemp);
    } else {
      const height = rect.height;
      const radius = puckRect ? puckRect.height / 2 : 14;
      const usableHeight = height - 2 * radius;
      const clickY = e.clientY - rect.top;
      const invertedY = Math.max(0, Math.min(height, height - clickY));
      const clampedY = Math.max(0, Math.min(usableHeight, invertedY - radius));
      const newRatio = usableHeight > 0 ? clampedY / usableHeight : 0;
      const newTemp = Math.round(minTemp + newRatio * (maxTemp - minTemp));
      setTemp(newTemp);
    }
  };

  return (
    <div
      className={`@container w-full h-full rounded-2xl bg-slate-900/90 border border-slate-800 p-3.5 flex flex-col justify-between shadow-lg backdrop-blur-md transition-all duration-300 relative overflow-hidden ${baseOpacity}`}
      style={{ borderColor: isSelected ? customColor : undefined, opacity: styleOpacity }}
    >
      <ComponentHeader
        type="climateTemp"
        label={headerLabel}
        customColor={customColor}
      />

      {orientation === 'horizontal' ? (
        /* Horizontal Thermometer Slider */
        <div className="flex-1 min-h-0 min-w-0 flex flex-col justify-center items-center gap-2 px-2 my-auto w-full">
          {/* Fixed Numeral Readout Centered Above Track */}
          <div
            className="text-center font-mono font-black text-[clamp(22px,8cqw,36px)] tracking-tight transition-colors shrink-0 select-none"
            style={{ color: currentColor }}
          >
            {temp}°
          </div>

          {/* Track Row with Buttons */}
          <div className="flex flex-row items-center justify-between gap-3 w-full">
            {/* Left - Button (Cool) */}
            <button
              {...minusRepeat.bind}
              className="w-[clamp(28px,8cqw,40px)] h-[clamp(28px,8cqw,40px)] rounded-full bg-slate-800 hover:bg-slate-700 active:scale-90 border border-slate-700 flex items-center justify-center text-sky-400 shadow cursor-pointer transition-transform shrink-0 select-none"
            >
              <Minus className="w-4 h-4 pointer-events-none" />
            </button>

            {/* Horizontal Mercury Track */}
            <div
              ref={trackRef}
              onPointerDown={(e) => {
                e.stopPropagation();
                setIsDragging(true);
                updateTempFromPointer(e);
              }}
              onPointerMove={(e) => {
                if (isDragging) updateTempFromPointer(e);
              }}
              onPointerUp={() => setIsDragging(false)}
              onPointerLeave={() => setIsDragging(false)}
              className="h-[clamp(16px,5cqh,24px)] flex-1 mx-[clamp(12px,3.5cqw,18px)] rounded-full bg-slate-950 border border-slate-800/80 relative cursor-pointer select-none overflow-visible flex items-center justify-center"
            >
              {/* Full Track Fixed Gradient & Dark Unfilled Mask (Left to Right) */}
              <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
                <div
                  className="absolute inset-0 rounded-full"
                  style={{ background: trackGradientStyle }}
                />
                <div
                  className="absolute top-0 bottom-0 right-0 bg-slate-950 transition-all duration-75"
                  style={{ left: posCalcHorizontal }}
                />
              </div>

              {/* Puck / Plain Drag Handle (No Text) */}
              <div
                ref={puckRef}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-75 z-10 flex items-center justify-center cursor-grab active:cursor-grabbing"
                style={{ left: posCalcHorizontal }}
              >
                <div
                  className="w-[clamp(24px,7cqw,36px)] h-[clamp(24px,7cqw,36px)] rounded-full border-2 border-slate-900 shadow-xl transition-colors shrink-0"
                  style={{
                    backgroundColor: currentColor,
                    boxShadow: `0 0 12px ${currentColor}aa`,
                  }}
                />
              </div>
            </div>

            {/* Right + Button (Warm) */}
            <button
              {...plusRepeat.bind}
              className="w-[clamp(28px,8cqw,40px)] h-[clamp(28px,8cqw,40px)] rounded-full bg-slate-800 hover:bg-slate-700 active:scale-90 border border-slate-700 flex items-center justify-center text-red-400 shadow cursor-pointer transition-transform shrink-0 select-none"
            >
              <Plus className="w-4 h-4 pointer-events-none" />
            </button>
          </div>
        </div>
      ) : (
        /* Vertical Thermometer Slider */
        <div className="flex-1 min-h-0 min-w-0 flex flex-col items-center justify-between py-1 my-auto w-full">
          {/* Top + Button (Warm) */}
          <button
            {...plusRepeat.bind}
            className="w-[clamp(28px,8cqw,40px)] h-[clamp(28px,8cqw,40px)] rounded-full bg-slate-800 hover:bg-slate-700 active:scale-90 border border-slate-700 flex items-center justify-center text-red-400 shadow cursor-pointer transition-transform shrink-0 mb-[clamp(12px,4cqw,19px)] select-none"
          >
            <Plus className="w-4 h-4 pointer-events-none" />
          </button>

          {/* Track Container */}
          <div className="flex-1 min-h-0 w-full relative flex items-center justify-center">
            {/* Vertical Mercury Thermometer Slider Track */}
            <div
              ref={trackRef}
              onPointerDown={(e) => {
                e.stopPropagation();
                setIsDragging(true);
                updateTempFromPointer(e);
              }}
              onPointerMove={(e) => {
                if (isDragging) updateTempFromPointer(e);
              }}
              onPointerUp={() => setIsDragging(false)}
              onPointerLeave={() => setIsDragging(false)}
              className="w-[clamp(16px,6cqw,28px)] h-full rounded-full bg-slate-950 border border-slate-800/80 relative cursor-pointer select-none overflow-visible flex items-center justify-center"
            >
              {/* Full Track Fixed Gradient & Dark Unfilled Mask (Bottom to Top) */}
              <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
                <div
                  className="absolute inset-0 rounded-full"
                  style={{ background: trackGradientStyle }}
                />
                <div
                  className="absolute top-0 left-0 right-0 bg-slate-950 transition-all duration-75"
                  style={{ bottom: posCalcVertical }}
                />
              </div>

              {/* Puck / Plain Drag Handle (No Text) */}
              <div
                ref={puckRef}
                className="absolute left-1/2 -translate-x-1/2 translate-y-1/2 transition-all duration-75 z-10 flex items-center justify-center cursor-grab active:cursor-grabbing"
                style={{ bottom: posCalcVertical }}
              >
                <div
                  className="w-[clamp(24px,8cqw,38px)] h-[clamp(24px,8cqw,38px)] rounded-full border-2 border-slate-900 shadow-xl transition-colors shrink-0"
                  style={{
                    backgroundColor: currentColor,
                    boxShadow: `0 0 12px ${currentColor}aa`,
                  }}
                />
              </div>
            </div>

            {/* Fixed Numeral Readout Absolutely Positioned to the Right of Track */}
            <div
              className="absolute left-[calc(50%+clamp(16px,5cqw,24px))] font-mono font-black text-[clamp(22px,8cqw,38px)] tracking-tight transition-colors shrink-0 select-none whitespace-nowrap pointer-events-none"
              style={{ color: currentColor }}
            >
              {temp}°
            </div>
          </div>

          {/* Bottom - Button (Cool) */}
          <button
            {...minusRepeat.bind}
            className="w-[clamp(28px,8cqw,40px)] h-[clamp(28px,8cqw,40px)] rounded-full bg-slate-800 hover:bg-slate-700 active:scale-90 border border-slate-700 flex items-center justify-center text-sky-400 shadow cursor-pointer transition-transform shrink-0 mt-[clamp(12px,4cqw,19px)] select-none"
          >
            <Minus className="w-4 h-4 pointer-events-none" />
          </button>
        </div>
      )}
    </div>
  );
};
