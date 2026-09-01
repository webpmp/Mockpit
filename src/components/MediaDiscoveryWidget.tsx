import React, { useState } from 'react';
import { ChevronDown, Sparkles, TrendingUp } from 'lucide-react';
import { ComponentInstance } from '../types';
import { useMockpitStore } from '../store/useMockpitStore';
import { ComponentHeader } from './ComponentRenderer';
import {
  DISCOVERY_TRACKS_TRENDING,
  DISCOVERY_TRACKS_FORYOU,
  renderCoverIcon,
} from '../data/mediaData';

interface MediaDiscoveryWidgetProps {
  component: ComponentInstance;
  isSelected: boolean;
  customColor: string;
  styleOpacity?: number;
  headerLabel: string;
}

export const MediaDiscoveryWidget: React.FC<MediaDiscoveryWidgetProps> = ({
  component,
  isSelected,
  customColor,
  styleOpacity = 1,
  headerLabel,
}) => {
  const updateComponentStaticProps = useMockpitStore((s) => s.updateComponentStaticProps);

  const mode = (component.staticProps?.mode as 'trending' | 'foryou') || 'trending';
  const layout = (component.staticProps?.layout as 'horizontal' | 'vertical') || 'horizontal';

  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [isModeDropdownOpen, setIsModeDropdownOpen] = useState(false);

  const tracks = mode === 'trending' ? DISCOVERY_TRACKS_TRENDING : DISCOVERY_TRACKS_FORYOU;

  const handleSelectMode = (newMode: 'trending' | 'foryou') => {
    updateComponentStaticProps(component.id, { mode: newMode });
    setIsModeDropdownOpen(false);
  };

  const handleCardClick = (trackId: string) => {
    setSelectedTrackId((prev) => (prev === trackId ? null : trackId));
  };

  const modeLabel = mode === 'trending' ? 'Trending' : 'For You';

  return (
    <div
      data-component-type="mediaDiscovery"
      className="w-full h-full rounded-2xl bg-slate-900/90 border border-slate-800 p-3.5 flex flex-col justify-between shadow-lg backdrop-blur-md transition-all duration-300 relative overflow-hidden select-none"
      style={{
        borderColor: isSelected ? customColor : undefined,
        opacity: styleOpacity,
      }}
    >
      {/* Component Header with Mode Switcher Dropdown */}
      <ComponentHeader
        type="mediaDiscovery"
        label={headerLabel || (mode === 'trending' ? 'Trending' : 'Discovery')}
        customColor={customColor}
        rightElement={
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsModeDropdownOpen((prev) => !prev);
              }}
              className="text-xs font-mono font-extrabold uppercase px-3 py-1.5 min-h-[36px] rounded-full border flex items-center gap-1.5 hover:brightness-110 transition-all cursor-pointer shadow-sm active:scale-95"
              style={{
                color: customColor || '#38bdf8',
                borderColor: `${customColor || '#38bdf8'}50`,
                backgroundColor: `${customColor || '#38bdf8'}20`,
              }}
              title="Switch Discovery Mode"
            >
              {mode === 'trending' ? (
                <TrendingUp className="w-3.5 h-3.5 shrink-0" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
              )}
              <span>{modeLabel}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  isModeDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {isModeDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsModeDropdownOpen(false);
                  }}
                />
                <div className="absolute right-0 top-full mt-1.5 z-40 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl p-1.5 min-w-[140px] space-y-1 animate-in fade-in duration-150">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectMode('trending');
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-mono font-bold rounded-lg transition-colors cursor-pointer text-left min-h-[44px] ${
                      mode === 'trending'
                        ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <TrendingUp className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Trending</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectMode('foryou');
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-mono font-bold rounded-lg transition-colors cursor-pointer text-left min-h-[44px] ${
                      mode === 'foryou'
                        ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>For You</span>
                  </button>
                </div>
              </>
            )}
          </div>
        }
      />

      {/* Main Track Display: Horizontal (default) vs Vertical */}
      {layout === 'horizontal' ? (
        <div className="flex-1 min-h-0 mt-3 overflow-x-auto overflow-y-hidden pr-1 pb-1 flex flex-row gap-3 custom-scrollbar items-center">
          {tracks.map((track) => {
            const isCardSelected = selectedTrackId === track.id;

            return (
              <button
                key={track.id}
                type="button"
                data-track-id={track.id}
                onClick={() => handleCardClick(track.id)}
                className={`w-[148px] shrink-0 flex flex-col items-start p-2 rounded-xl border transition-all cursor-pointer group text-left ${
                  isCardSelected
                    ? 'bg-slate-800/90 border-sky-400 ring-1 ring-sky-400/50 shadow-md'
                    : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/40'
                }`}
                style={
                  isCardSelected
                    ? {
                        borderColor: customColor || '#38bdf8',
                        boxShadow: `0 0 0 1px ${customColor || '#38bdf8'}50`,
                      }
                    : undefined
                }
              >
                {/* 120x120px Album Art Block */}
                <div
                  className={`w-[120px] h-[120px] mx-auto rounded-lg relative overflow-hidden bg-gradient-to-br ${track.gradientFrom} ${track.gradientTo} flex items-center justify-center shadow-md shrink-0 group-hover:scale-[1.02] transition-transform`}
                >
                  {/* Trending Static Rank Badge - strictly no animate-pulse */}
                  {mode === 'trending' && track.rank && (
                    <div
                      className="absolute top-1.5 left-1.5 bg-amber-500 text-slate-950 font-mono font-bold text-[11px] px-1.5 py-0.5 rounded shadow-md z-10 select-none"
                      title={`Rank #${track.rank}`}
                    >
                      #{track.rank}
                    </div>
                  )}

                  {/* Centered Icon */}
                  {renderCoverIcon(track.iconName, 'w-10 h-10 text-white/95 drop-shadow')}
                </div>

                {/* Track Title (1 line, truncate) & Artist (1 line, truncate) */}
                <div className="w-full mt-2 space-y-0.5 px-0.5">
                  <div
                    className="text-sm font-semibold text-slate-100 truncate w-full"
                    title={track.title}
                  >
                    {track.title}
                  </div>
                  <div
                    className="text-xs text-slate-400 truncate w-full"
                    title={track.artist}
                  >
                    {track.artist}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        /* Vertical Stacked Rows */
        <div className="flex-1 min-h-0 mt-3 overflow-y-auto pr-1 flex flex-col gap-2 custom-scrollbar">
          {tracks.map((track) => {
            const isCardSelected = selectedTrackId === track.id;

            return (
              <button
                key={track.id}
                type="button"
                data-track-id={track.id}
                onClick={() => handleCardClick(track.id)}
                className={`flex items-center gap-3 p-2 rounded-xl border transition-all cursor-pointer group text-left min-h-[76px] w-full ${
                  isCardSelected
                    ? 'bg-slate-800/90 border-sky-400 ring-1 ring-sky-400/50 shadow-md'
                    : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/40'
                }`}
                style={
                  isCardSelected
                    ? {
                        borderColor: customColor || '#38bdf8',
                        boxShadow: `0 0 0 1px ${customColor || '#38bdf8'}50`,
                      }
                    : undefined
                }
              >
                {/* 64x64px Album Art Block */}
                <div
                  className={`w-16 h-16 rounded-lg relative overflow-hidden bg-gradient-to-br ${track.gradientFrom} ${track.gradientTo} flex items-center justify-center shadow-md shrink-0 group-hover:scale-[1.02] transition-transform`}
                >
                  {/* Trending Static Rank Badge */}
                  {mode === 'trending' && track.rank && (
                    <div
                      className="absolute top-1 left-1 bg-amber-500 text-slate-950 font-mono font-bold text-[10px] px-1 py-0.2 rounded shadow-sm z-10 select-none"
                      title={`Rank #${track.rank}`}
                    >
                      #{track.rank}
                    </div>
                  )}

                  {/* Centered Icon */}
                  {renderCoverIcon(track.iconName, 'w-6 h-6 text-white/95 drop-shadow')}
                </div>

                {/* Track Details */}
                <div className="flex-1 min-w-0 space-y-0.5">
                  <div
                    className="text-sm font-semibold text-slate-100 truncate"
                    title={track.title}
                  >
                    {track.title}
                  </div>
                  <div
                    className="text-xs text-slate-400 truncate"
                    title={track.artist}
                  >
                    {track.artist}
                  </div>
                  <div className="text-[11px] font-mono text-slate-500 truncate">
                    {track.album} • {track.duration}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
