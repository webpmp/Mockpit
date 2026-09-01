import React, { useState } from 'react';
import { ComponentInstance } from '../types';
import { useMockpitStore } from '../store/useMockpitStore';
import { ComponentHeader } from './ComponentRenderer';
import {
  MOCK_PLAYLISTS,
  MusicServiceType,
  renderCoverIcon,
} from '../data/mediaData';

interface MediaPlaylistsWidgetProps {
  component: ComponentInstance;
  isSelected: boolean;
  customColor: string;
  styleOpacity?: number;
  headerLabel: string;
}

export const MediaPlaylistsWidget: React.FC<MediaPlaylistsWidgetProps> = ({
  component,
  isSelected,
  customColor,
  styleOpacity = 1,
  headerLabel,
}) => {
  const selectedMusicService = useMockpitStore((s) => s.selectedMusicService);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);

  const activeService: MusicServiceType =
    (selectedMusicService as MusicServiceType) ||
    (component.staticProps?.service as MusicServiceType) ||
    'Spotify';

  const playlists = MOCK_PLAYLISTS[activeService] || MOCK_PLAYLISTS.Spotify;

  const handleSelectPlaylist = (playlistId: string) => {
    setSelectedPlaylistId((prev) => (prev === playlistId ? null : playlistId));
  };

  return (
    <div
      data-component-type="mediaPlaylists"
      className="w-full h-full rounded-2xl bg-slate-900/90 border border-slate-800 p-3.5 flex flex-col justify-between shadow-lg backdrop-blur-md transition-all duration-300 relative overflow-hidden select-none"
      style={{
        borderColor: isSelected ? customColor : undefined,
        opacity: styleOpacity,
      }}
    >
      {/* Component Header with Read-Only Provider Reflection Badge */}
      <ComponentHeader
        type="mediaPlaylists"
        label={headerLabel || 'Playlists'}
        customColor={customColor}
        rightElement={
          <div
            className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border transition-colors shadow-sm"
            style={{
              color: customColor || '#38bdf8',
              borderColor: `${customColor || '#38bdf8'}40`,
              backgroundColor: `${customColor || '#38bdf8'}15`,
            }}
            title={`Active streaming service: ${activeService}`}
          >
            {activeService}
          </div>
        }
      />

      {/* Playlists Grid: 3 columns, 96x96px art thumbnails, track count */}
      <div className="flex-1 min-h-0 mt-3 overflow-y-auto pr-1">
        <div className="grid grid-cols-3 gap-3">
          {playlists.map((playlist) => {
            const isCardSelected = selectedPlaylistId === playlist.id;

            return (
              <button
                key={playlist.id}
                type="button"
                onClick={() => handleSelectPlaylist(playlist.id)}
                className={`flex flex-col items-center text-center p-2 rounded-xl border transition-all cursor-pointer group ${
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
                {/* 96x96px Brand-Themed Gradient Album/Playlist Cover */}
                <div
                  className={`w-24 h-24 rounded-lg bg-gradient-to-br ${playlist.gradientBg} flex items-center justify-center shadow-md shrink-0 group-hover:scale-[1.02] transition-transform`}
                >
                  {renderCoverIcon(playlist.iconName || 'ListMusic', 'w-8 h-8 text-white/95 drop-shadow')}
                </div>

                {/* Playlist Name & Track Count (strictly no badges/disclaimers) */}
                <div className="w-full mt-2 space-y-0.5 px-0.5">
                  <div
                    className="text-sm font-semibold text-slate-100 truncate text-center"
                    title={playlist.name}
                  >
                    {playlist.name}
                  </div>
                  <div className="text-xs font-mono text-slate-400 text-center">
                    {playlist.trackCount} tracks
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
