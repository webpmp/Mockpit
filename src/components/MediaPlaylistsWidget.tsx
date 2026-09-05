import React, { useState } from 'react';
import { ComponentInstance } from '../types';
import { useMockpitStore } from '../store/useMockpitStore';
import { ComponentHeader } from './ComponentRenderer';
import {
  MOCK_PLAYLISTS,
  MusicServiceType,
  PlaylistMock,
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

  const cardLayoutMode = (component.staticProps?.cardLayoutMode as 'grid' | 'carousel') || 'grid';

  const activeService: MusicServiceType =
    (selectedMusicService as MusicServiceType) ||
    (component.staticProps?.service as MusicServiceType) ||
    'Spotify';

  const playlists = MOCK_PLAYLISTS[activeService] || MOCK_PLAYLISTS.Spotify;

  const handleSelectPlaylist = (playlistId: string) => {
    setSelectedPlaylistId((prev) => (prev === playlistId ? null : playlistId));
  };

  const renderPlaylistCard = (playlist: PlaylistMock) => {
    const isCardSelected = selectedPlaylistId === playlist.id;

    return (
      <button
        key={playlist.id}
        type="button"
        onClick={() => handleSelectPlaylist(playlist.id)}
        className={`w-[148px] shrink-0 flex flex-col items-center text-center p-2 rounded-xl border transition-all cursor-pointer group ${
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
        {/* 120x120px Brand-Themed Gradient Album/Playlist Cover */}
        <div
          className={`w-[120px] h-[120px] rounded-lg bg-gradient-to-br ${playlist.gradientBg} flex items-center justify-center shadow-md shrink-0 group-hover:scale-[1.02] transition-transform`}
        >
          {renderCoverIcon(playlist.iconName || 'ListMusic', 'w-10 h-10 text-white/95 drop-shadow')}
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
      {/* Component Header */}
      <ComponentHeader
        type="mediaPlaylists"
        label={headerLabel || 'Playlists'}
        customColor={customColor}
      />

      {/* Playlists Display: Carousel vs Wrap-Grid */}
      {cardLayoutMode === 'carousel' ? (
        <div className="flex-1 min-h-0 mt-3 overflow-x-auto overflow-y-hidden pr-1 pb-1 flex flex-row gap-3 custom-scrollbar items-center">
          {playlists.map(renderPlaylistCard)}
        </div>
      ) : (
        <div className="flex-1 min-h-0 mt-3 overflow-y-auto pr-1">
          <div className="flex flex-wrap content-start gap-3">
            {playlists.map(renderPlaylistCard)}
          </div>
        </div>
      )}
    </div>
  );
};
