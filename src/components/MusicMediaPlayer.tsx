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
  Volume2,
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

const SERVICES = ['Spotify', 'Apple Music', 'YouTube Music', 'Amazon Music'] as const;
type ServiceType = (typeof SERVICES)[number];

interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: string;
  durationSec: number;
  coverBg: string;
  iconName: string;
}

interface Playlist {
  id: string;
  name: string;
  tracksCount: number;
  iconName: string;
  sampleTrackId: string;
}

interface Album {
  id: string;
  title: string;
  artist: string;
  year: string;
  sampleTrackId: string;
}

const SAMPLE_TRACKS: Track[] = [
  {
    id: 't1',
    title: 'Starboy',
    artist: 'The Weeknd ft. Daft Punk',
    album: 'Starboy',
    duration: '3:50',
    durationSec: 230,
    coverBg: 'from-purple-600 to-pink-600',
    iconName: 'Music',
  },
  {
    id: 't2',
    title: 'Midnight City',
    artist: 'M83',
    album: "Hurry Up, We're Dreaming",
    duration: '4:03',
    durationSec: 243,
    coverBg: 'from-blue-600 to-indigo-600',
    iconName: 'Radio',
  },
  {
    id: 't3',
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    album: 'After Hours',
    duration: '3:20',
    durationSec: 200,
    coverBg: 'from-rose-600 to-amber-600',
    iconName: 'Flame',
  },
  {
    id: 't4',
    title: 'As It Was',
    artist: 'Harry Styles',
    album: "Harry's House",
    duration: '2:47',
    durationSec: 167,
    coverBg: 'from-emerald-600 to-teal-600',
    iconName: 'Disc',
  },
  {
    id: 't5',
    title: 'Levitating',
    artist: 'Dua Lipa',
    album: 'Future Nostalgia',
    duration: '3:23',
    durationSec: 203,
    coverBg: 'from-fuchsia-600 to-purple-600',
    iconName: 'Zap',
  },
  {
    id: 't6',
    title: 'Get Lucky',
    artist: 'Daft Punk ft. Pharrell',
    album: 'Random Access Memories',
    duration: '4:08',
    durationSec: 248,
    coverBg: 'from-amber-500 to-orange-600',
    iconName: 'Sparkles',
  },
  {
    id: 't7',
    title: 'Cruel Summer',
    artist: 'Taylor Swift',
    album: 'Lover',
    duration: '2:58',
    durationSec: 178,
    coverBg: 'from-pink-500 to-rose-500',
    iconName: 'Heart',
  },
  {
    id: 't8',
    title: 'Drivers License',
    artist: 'Olivia Rodrigo',
    album: 'SOUR',
    duration: '4:02',
    durationSec: 242,
    coverBg: 'from-violet-600 to-purple-800',
    iconName: 'Compass',
  },
  {
    id: 't9',
    title: 'Stay',
    artist: 'The Kid LAROI & Justin Bieber',
    album: 'F*CK LOVE 3: OVER YOU',
    duration: '2:21',
    durationSec: 141,
    coverBg: 'from-sky-500 to-blue-700',
    iconName: 'Zap',
  },
  {
    id: 't10',
    title: 'Sunflower',
    artist: 'Post Malone & Swae Lee',
    album: 'Into the Spider-Verse',
    duration: '2:38',
    durationSec: 158,
    coverBg: 'from-yellow-500 to-amber-600',
    iconName: 'Sparkles',
  },
  {
    id: 't11',
    title: 'Heat Waves',
    artist: 'Glass Animals',
    album: 'Dreamland',
    duration: '3:58',
    durationSec: 238,
    coverBg: 'from-red-500 to-orange-500',
    iconName: 'Flame',
  },
  {
    id: 't12',
    title: 'Bad Habits',
    artist: 'Ed Sheeran',
    album: '=',
    duration: '3:51',
    durationSec: 231,
    coverBg: 'from-cyan-600 to-blue-600',
    iconName: 'Music',
  },
];

const SAMPLE_PLAYLISTS: Playlist[] = [
  { id: 'p1', name: 'Night Drive Hits', tracksCount: 24, iconName: 'Radio', sampleTrackId: 't2' },
  { id: 'p2', name: 'Chill Synthwave', tracksCount: 18, iconName: 'Music', sampleTrackId: 't1' },
  { id: 'p3', name: 'Roadtrip Classics', tracksCount: 35, iconName: 'Compass', sampleTrackId: 't6' },
  { id: 'p4', name: 'Top 50 - Global', tracksCount: 50, iconName: 'TrendingUp', sampleTrackId: 't3' },
  { id: 'p5', name: 'Electronic Focus', tracksCount: 42, iconName: 'Zap', sampleTrackId: 't5' },
  { id: 'p6', name: 'Acoustic Sunset', tracksCount: 29, iconName: 'Sparkles', sampleTrackId: 't7' },
];

const SAMPLE_ALBUMS: Album[] = [
  { id: 'a1', title: 'Starboy', artist: 'The Weeknd', year: '2016', sampleTrackId: 't1' },
  { id: 'a2', title: 'After Hours', artist: 'The Weeknd', year: '2020', sampleTrackId: 't3' },
  { id: 'a3', title: "Hurry Up, We're Dreaming", artist: 'M83', year: '2011', sampleTrackId: 't2' },
  { id: 'a4', title: 'Random Access Memories', artist: 'Daft Punk', year: '2013', sampleTrackId: 't6' },
  { id: 'a5', title: 'Future Nostalgia', artist: 'Dua Lipa', year: '2020', sampleTrackId: 't5' },
  { id: 'a6', title: 'Dreamland', artist: 'Glass Animals', year: '2020', sampleTrackId: 't11' },
];

const renderCoverIcon = (iconName: string) => {
  switch (iconName) {
    case 'Radio':
      return <Radio className="w-5 h-5 text-white/90" />;
    case 'Flame':
      return <Flame className="w-5 h-5 text-white/90" />;
    case 'Disc':
      return <Disc className="w-5 h-5 text-white/90" />;
    case 'Zap':
      return <Zap className="w-5 h-5 text-white/90" />;
    case 'Sparkles':
      return <Sparkles className="w-5 h-5 text-white/90" />;
    case 'Heart':
      return <Heart className="w-5 h-5 text-white/90" />;
    case 'Compass':
      return <Compass className="w-5 h-5 text-white/90" />;
    case 'TrendingUp':
      return <TrendingUp className="w-5 h-5 text-white/90" />;
    default:
      return <Music className="w-5 h-5 text-white/90" />;
  }
};

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

  const currentService: ServiceType =
    (component.staticProps?.service as ServiceType) || 'Spotify';

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
              className="bg-gradient-to-r from-pink-500 to-purple-500 h-full rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(100, (progressSec / currentTrack.durationSec) * 100)}%`,
              }}
            />
          </div>
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 font-semibold">
            <span>{formatTime(progressSec)}</span>
            <span>{currentTrack.duration}</span>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Volume2 className="w-4 h-4" />
            <span className="text-xs font-mono font-medium">Stereo</span>
          </div>

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
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white flex items-center justify-center shadow-md transition-all cursor-pointer active:scale-95"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
              ) : (
                <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current ml-0.5" />
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

          <div className="text-xs font-mono text-slate-400 font-bold uppercase">
            {currentService.split(' ')[0]}
          </div>
        </div>
      </div>
    </div>
  );
};

