import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getAvailableOdvVehicles, resolveOdvVehicle, getVehicleOriginalColors, OdvVehicleAsset } from '../utils/odvVehicleAssets';
import { EgoVehicleColors } from '../types';
import { useRecoloredVehicleImage } from '../utils/vehicleImageRecoloring';

interface EgoVehicleCarouselProps {
  selectedVehicleId?: string;
  onSelectVehicle: (vehicle: OdvVehicleAsset) => void;
  disabled?: boolean;
  colors?: EgoVehicleColors;
}

const CarouselVehicleThumbnail: React.FC<{
  url: string;
  vehicleId: string;
  label: string;
  isSelected: boolean;
  colors?: EgoVehicleColors;
}> = ({ url, vehicleId, label, isSelected, colors }) => {
  const origColors = getVehicleOriginalColors(vehicleId);
  const recoloredUrl = useRecoloredVehicleImage(
    url,
    isSelected ? colors : undefined,
    origColors
  );
  return (
    <img
      src={recoloredUrl || url}
      alt={label}
      className="max-h-12 w-auto max-w-full object-contain pointer-events-none drop-shadow-sm bg-transparent"
      loading="lazy"
      onError={(e) => {
        (e.target as HTMLElement).style.display = 'none';
      }}
    />
  );
};

export const EgoVehicleCarousel: React.FC<EgoVehicleCarouselProps> = ({
  selectedVehicleId,
  onSelectVehicle,
  disabled = false,
  colors,
}) => {
  const odvVehicles = getAvailableOdvVehicles();
  const selectedVehicle = resolveOdvVehicle(selectedVehicleId);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  };

  useEffect(() => {
    checkScroll();
  }, [odvVehicles.length]);

  // Scroll selected item into view on mount or change
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const selectedBtn = el.querySelector(`[data-vehicle-id="${selectedVehicle.id}"]`) as HTMLElement;
    if (selectedBtn) {
      const containerLeft = el.scrollLeft;
      const containerRight = containerLeft + el.clientWidth;
      const btnLeft = selectedBtn.offsetLeft;
      const btnRight = btnLeft + selectedBtn.offsetWidth;
      if (btnLeft < containerLeft || btnRight > containerRight) {
        selectedBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
    checkScroll();
  }, [selectedVehicle.id]);

  const handleScroll = (direction: 'left' | 'right') => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const scrollAmount = direction === 'left' ? -120 : 120;
    el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    setTimeout(checkScroll, 250);
  };

  return (
    /* ds-raw-start: vehicle inspector carousel controls */
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-slate-300 font-mono font-semibold">Model</span>
        <span className="text-[10px] text-sky-400 font-mono font-bold bg-sky-950/60 px-1.5 py-0.5 rounded border border-sky-800/50">
          {selectedVehicle.label}
        </span>
      </div>

      <div className="relative flex items-center gap-1">
        <button
          type="button"
          disabled={disabled || !canScrollLeft}
          onClick={() => handleScroll('left')}
          className="p-1 rounded bg-slate-900 text-slate-400 border border-slate-700/80 disabled:opacity-20 disabled:cursor-not-allowed transition-colors shrink-0 cursor-pointer"
          aria-label="Previous vehicle models"
          title="Previous vehicle models"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        <div
          ref={scrollContainerRef}
          onScroll={checkScroll}
          className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1 px-0.5 scroll-smooth flex-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          role="radiogroup"
          aria-label="Select ego vehicle model"
        >
          {odvVehicles.map((v) => {
            const isSelected = selectedVehicle.id === v.id;
            return (
              <button
                key={v.id}
                type="button"
                data-vehicle-id={v.id}
                role="radio"
                aria-checked={isSelected}
                aria-label={v.label}
                title={v.label}
                disabled={disabled}
                onClick={() => onSelectVehicle(v)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectVehicle(v);
                  }
                }}
                className={`relative shrink-0 w-14 h-20 rounded-md p-1 flex flex-col items-center justify-between transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-sky-950/60 border-sky-400 ring-1 ring-sky-400/50 text-sky-300 shadow-[0_0_8px_rgba(56,189,248,0.25)]'
                    : 'bg-slate-900/40 border-slate-700/60 text-slate-400 '
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <div className="w-full flex-1 flex items-center justify-center overflow-hidden bg-transparent">
                  <CarouselVehicleThumbnail
                    url={v.url}
                    vehicleId={v.id}
                    label={v.label}
                    isSelected={isSelected}
                    colors={colors}
                  />
                </div>
                <span className="text-[9px] font-mono leading-tight truncate w-full text-center mt-1">
                  {v.label}
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          disabled={disabled || !canScrollRight}
          onClick={() => handleScroll('right')}
          className="p-1 rounded bg-slate-900 text-slate-400 border border-slate-700/80 disabled:opacity-20 disabled:cursor-not-allowed transition-colors shrink-0 cursor-pointer"
          aria-label="Next vehicle models"
          title="Next vehicle models"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
    /* ds-raw-end */
  );
};
