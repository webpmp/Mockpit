import React, { useState, useEffect } from 'react';
import {
  Music,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Search,
  Clock,
  Radio,
  ListMusic,
  Disc,
  TrendingUp,
  Sparkles,
  Flame,
  Zap,
  Heart,
  Compass,
  ChevronDown,
} from 'lucide-react';
import { ComponentInstance } from '../types';
import { useMockpitStore } from '../store/useMockpitStore';
import { ComponentHeader } from './ComponentRenderer';
import { MockpitInput } from './MockpitInput';
import {
  Track,
  Playlist,
  Album,
  SAMPLE_TRACKS,
  SAMPLE_PLAYLISTS,
  SAMPLE_ALBUMS,
  renderCoverIcon,
  formatMediaTime,
  MUSIC_SERVICES,
  MusicServiceType,
} from '../data/mediaData';

const SERVICES = MUSIC_SERVICES;
type ServiceType = MusicServiceType;

interface MusicMediaPlayerProps {
  component: ComponentInstance;
  isSelected: boolean;
  customColor: string;
  styleOpacity?: number;
  headerLabel: string;
}

export const MusicMediaPlayer: React.FC<MusicMediaPlayerProps> = ({
  component,
  isSelected,
  customColor,
  styleOpacity = 1,
  headerLabel,
}) => {
  const updateComponentStaticProps = useMockpitStore((s) => s.updateComponentStaticProps);
  const selectedMusicService = useMockpitStore((s) => s.selectedMusicService);
  const setSelectedMusicService = useMockpitStore((s) => s.setSelectedMusicService);

  const currentService: ServiceType =
    (selectedMusicService as ServiceType) || (component.staticProps?.service as ServiceType) || 'Spotify';

  const [activeTab, setActiveTab] = useState<'lastPlayed' | 'library' | 'search'>('lastPlayed');
  const [currentTrack, setCurrentTrack] = useState<Track>(SAMPLE_TRACKS[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [progressSec, setProgressSec] = useState<number>(102);
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [isRepeat, setIsRepeat] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isServiceDropdownOpen, setIsServiceDropdownOpen] = useState<boolean>(false);

  // Simulated progress timer when playing
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setProgressSec((prev) => {
          if (prev >= currentTrack.durationSec) {
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentTrack.durationSec]);

  const handleSelectService = (serviceName: ServiceType) => {
    setSelectedMusicService(serviceName);
    updateComponentStaticProps(component.id, { service: serviceName });
  };

  const handleSelectTrack = (track: Track) => {
    setCurrentTrack(track);
    setProgressSec(Math.floor(track.durationSec * 0.25));
    setIsPlaying(true);
  };

  const handleTogglePlay = () => {
    setIsPlaying((prev) => !prev);
  };

  const handleNextTrack = () => {
    const currentIndex = SAMPLE_TRACKS.findIndex((t) => t.id === currentTrack.id);
    const nextIndex = (currentIndex + 1) % SAMPLE_TRACKS.length;
    handleSelectTrack(SAMPLE_TRACKS[nextIndex]);
  };

  const handlePrevTrack = () => {
    const currentIndex = SAMPLE_TRACKS.findIndex((t) => t.id === currentTrack.id);
    const prevIndex = (currentIndex - 1 + SAMPLE_TRACKS.length) % SAMPLE_TRACKS.length;
    handleSelectTrack(SAMPLE_TRACKS[prevIndex]);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const filteredSearchTracks = SAMPLE_TRACKS.filter(
    (t) =>
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.album.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      className="w-full h-full rounded-2xl bg-slate-900/90 border border-slate-800 p-3.5 flex flex-col justify-between shadow-lg backdrop-blur-md transition-all duration-300 relative overflow-hidden select-none"
      style={{ borderColor: isSelected ? customColor : undefined, opacity: styleOpacity }}
    >
      {/* Component Header with Compact Service Selector Dropdown */}
      <ComponentHeader
        type="media"
        label={headerLabel}
        customColor={customColor}
        rightElement={
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsServiceDropdownOpen((prev) => !prev);
              }}
              className="text-xs font-mono font-extrabold uppercase px-2.5 py-1 rounded-full border flex items-center gap-1 hover:brightness-110 transition-all cursor-pointer shadow-sm"
              style={{
                color: customColor,
                borderColor: `${customColor}50`,
                backgroundColor: `${customColor}20`,
              }}
              title="Switch Music Provider"
            >
              <span>{currentService}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  isServiceDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {isServiceDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsServiceDropdownOpen(false);
                  }}
                />
                <div className="absolute right-0 top-full mt-1.5 z-40 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl p-1.5 min-w-[150px] space-y-1 animate-in fade-in duration-150">
                  {SERVICES.map((s) => {
                    const isActive = currentService === s;
                    return (
                      <button
                        key={s}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectService(s);
                          setIsServiceDropdownOpen(false);
                        }}
                        className={`w-full text-left text-xs font-mono font-bold px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer block ${
                          isActive
                            ? 'bg-slate-800 text-slate-100'
                            : 'text-slate-300 hover:text-white hover:bg-slate-900'
                        }`}
                        style={isActive ? { color: customColor } : undefined}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        }
      />

      {/* Tabs Row: Last Played | Library | Search (Increased Text Size for Legibility) */}
      <div className="flex items-center gap-1.5 border-b border-slate-800/80 pb-2 my-2 shrink-0">
        <button
          onClick={() => setActiveTab('lastPlayed')}
          className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'lastPlayed'
              ? 'bg-slate-800 text-slate-100 border border-slate-700/80 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Clock className="w-4 h-4 text-slate-400" />
          Last Played
        </button>
        <button
          onClick={() => setActiveTab('library')}
          className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'library'
              ? 'bg-slate-800 text-slate-100 border border-slate-700/80 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <ListMusic className="w-4 h-4 text-slate-400" />
          Library
        </button>
        <button
          onClick={() => setActiveTab('search')}
          className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'search'
              ? 'bg-slate-800 text-slate-100 border border-slate-700/80 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Search className="w-4 h-4 text-slate-400" />
          Search
        </button>
      </div>

      {/* Tab Contents Area */}
      <div className="flex-1 min-h-0 my-1 overflow-y-auto custom-scrollbar space-y-1.5 pr-0.5">
        {/* Tab 1: Last Played */}
        {activeTab === 'lastPlayed' && (
          <div className="space-y-1.5">
            <div className="text-xs font-mono text-slate-400 font-bold uppercase mb-1.5">
              Recent Tracks on {currentService}
            </div>
            {SAMPLE_TRACKS.map((track) => {
              const isSelectedTrack = currentTrack.id === track.id;
              return (
                <div
                  key={track.id}
                  onClick={() => handleSelectTrack(track)}
                  className={`p-2.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer group ${
                    isSelectedTrack
                      ? 'bg-slate-800/90 border-slate-600 shadow-sm'
                      : 'bg-slate-950/40 hover:bg-slate-800/60 border-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    {/* Mock Album Art Placeholder */}
                    <div
                      className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br ${track.coverBg} flex items-center justify-center shrink-0 shadow-sm border border-white/10 group-hover:scale-105 transition-transform`}
                    >
                      {renderCoverIcon(track.iconName)}
                    </div>
                    <div className="min-w-0">
                      <div
                        className={`text-sm sm:text-base font-bold truncate ${
                          isSelectedTrack ? 'text-slate-100' : 'text-slate-200 group-hover:text-white'
                        }`}
                      >
                        {track.title}
                      </div>
                      <div className="text-xs sm:text-sm text-slate-400 truncate">
                        {track.artist} &bull; <span className="text-slate-500">{track.album}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-xs sm:text-sm font-mono text-slate-400 shrink-0 flex items-center gap-2">
                    {isSelectedTrack && isPlaying && (
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    )}
                    <span>{track.duration}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 2: Library */}
        {activeTab === 'library' && (
          <div className="space-y-3">
            {/* Playlists Section */}
            <div>
              <div className="text-xs font-mono text-slate-400 font-bold uppercase mb-1.5">
                Your Playlists
              </div>
              <div className="grid grid-cols-2 gap-2">
                {SAMPLE_PLAYLISTS.map((pl) => (
                  <div
                    key={pl.id}
                    onClick={() => {
                      const sampleT = SAMPLE_TRACKS.find((t) => t.id === pl.sampleTrackId);
                      if (sampleT) handleSelectTrack(sampleT);
                    }}
                    className="p-2.5 rounded-xl bg-slate-950/50 hover:bg-slate-800/80 border border-slate-800/80 cursor-pointer transition-colors flex items-center gap-2.5 group"
                  >
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 text-slate-300 group-hover:scale-105 transition-transform">
                      {renderCoverIcon(pl.iconName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold text-slate-200 truncate group-hover:text-white">
                        {pl.name}
                      </div>
                      <div className="text-xs text-slate-400 font-mono">
                        {pl.tracksCount} tracks
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Albums Section */}
            <div>
              <div className="text-xs font-mono text-slate-400 font-bold uppercase mb-1.5">
                Saved Albums
              </div>
              <div className="space-y-1.5">
                {SAMPLE_ALBUMS.map((album) => (
                  <div
                    key={album.id}
                    onClick={() => {
                      const sampleT = SAMPLE_TRACKS.find((t) => t.id === album.sampleTrackId);
                      if (sampleT) handleSelectTrack(sampleT);
                    }}
                    className="p-2 rounded-xl bg-slate-950/30 hover:bg-slate-800/60 border border-slate-800/40 cursor-pointer transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Disc className="w-5 h-5 text-slate-400 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-sm font-bold text-slate-200 truncate block">
                          {album.title}
                        </span>
                        <span className="text-xs text-slate-400 truncate block">
                          {album.artist} ({album.year})
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-slate-400 hover:text-slate-100">
                      Play &rarr;
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Search */}
        {activeTab === 'search' && (
          <div className="space-y-2.5">
            <MockpitInput
              value={searchQuery}
              onChange={(val) => setSearchQuery(val)}
              placeholder={`Search ${currentService} catalog...`}
              componentId={component.id}
              keyboardSlideDirection={component.staticProps?.keyboardSlideDirection as any}
              className="text-sm sm:text-base py-2 font-mono"
              icon={<Search className="w-4 h-4 text-slate-400" />}
            />

            <div className="space-y-1.5">
              {filteredSearchTracks.length === 0 ? (
                <div className="text-sm sm:text-base text-slate-400 italic p-3 text-center font-medium">
                  No matching tracks found on {currentService}.
                </div>
              ) : (
                filteredSearchTracks.map((track) => (
                  <div
                    key={track.id}
                    onClick={() => handleSelectTrack(track)}
                    className="p-2.5 rounded-xl bg-slate-950/50 hover:bg-slate-800/80 border border-slate-800/80 flex items-center justify-between cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br ${track.coverBg} flex items-center justify-center shrink-0 border border-white/10`}
                      >
                        {renderCoverIcon(track.iconName)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm sm:text-base font-bold text-slate-200 truncate group-hover:text-slate-100">
                          {track.title}
                        </div>
                        <div className="text-xs sm:text-sm text-slate-400 truncate">{track.artist}</div>
                      </div>
                    </div>
                    <div className="text-xs sm:text-sm font-mono text-slate-400 shrink-0">
                      {track.duration}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Basic Playback Chrome */}
      <div className="pt-2.5 border-t border-slate-800/80 bg-slate-950/40 -mx-3.5 -mb-3.5 p-3.5 rounded-b-2xl shrink-0">
        {/* Track Title & Cover */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${currentTrack.coverBg} flex items-center justify-center shrink-0 shadow-md border border-white/20`}
            >
              {renderCoverIcon(currentTrack.iconName)}
            </div>
            <div className="min-w-0">
              <div className="text-sm sm:text-base font-extrabold text-slate-100 truncate">
                {currentTrack.title}
              </div>
              <div className="text-xs sm:text-sm text-slate-400 truncate font-medium">
                {currentTrack.artist}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsShuffle((p) => !p)}
              className={`p-2 rounded-xl transition-colors cursor-pointer ${
                isShuffle ? 'text-slate-100 bg-slate-800 border border-slate-700' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Shuffle"
            >
              <Shuffle className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsRepeat((p) => !p)}
              className={`p-2 rounded-xl transition-colors cursor-pointer ${
                isRepeat ? 'text-slate-100 bg-slate-800 border border-slate-700' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Repeat"
            >
              <Repeat className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress Bar & Time */}
        <div className="space-y-1 mb-2">
          <div
            className="w-full bg-slate-800 h-2 rounded-full overflow-hidden cursor-pointer relative"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const ratio = Math.max(0, Math.min(1, clickX / rect.width));
              setProgressSec(Math.floor(ratio * currentTrack.durationSec));
            }}
          >
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(100, (progressSec / currentTrack.durationSec) * 100)}%`,
                backgroundColor: customColor,
                boxShadow: `0 0 10px ${customColor}80`,
              }}
            />
          </div>
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 font-semibold">
            <span>{formatTime(progressSec)}</span>
            <span>{currentTrack.duration}</span>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-3.5">
            <button
              onClick={handlePrevTrack}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Previous track"
            >
              <SkipBack className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <button
              onClick={handleTogglePlay}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full text-slate-950 flex items-center justify-center shadow-md transition-all cursor-pointer active:scale-95 hover:brightness-110 font-bold"
              style={{
                backgroundColor: customColor,
                boxShadow: `0 0 14px ${customColor}60`,
              }}
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-current text-slate-950" />
              ) : (
                <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current ml-0.5 text-slate-950" />
              )}
            </button>

            <button
              onClick={handleNextTrack}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Next track"
            >
              <SkipForward className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

