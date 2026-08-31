import React from 'react';
import {
  Music,
  Radio,
  Flame,
  Disc,
  Zap,
  Sparkles,
  Heart,
  Compass,
  TrendingUp,
} from 'lucide-react';

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: string;
  durationSec: number;
  coverBg: string;
  iconName: string;
}

export interface Playlist {
  id: string;
  name: string;
  tracksCount: number;
  iconName: string;
  sampleTrackId: string;
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  year: string;
  sampleTrackId: string;
}

export const SAMPLE_TRACKS: Track[] = [
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

export const SAMPLE_PLAYLISTS: Playlist[] = [
  { id: 'p1', name: 'Night Drive Hits', tracksCount: 24, iconName: 'Radio', sampleTrackId: 't2' },
  { id: 'p2', name: 'Chill Synthwave', tracksCount: 18, iconName: 'Music', sampleTrackId: 't1' },
  { id: 'p3', name: 'Roadtrip Classics', tracksCount: 35, iconName: 'Compass', sampleTrackId: 't6' },
  { id: 'p4', name: 'Top 50 - Global', tracksCount: 50, iconName: 'TrendingUp', sampleTrackId: 't3' },
  { id: 'p5', name: 'Electronic Focus', tracksCount: 42, iconName: 'Zap', sampleTrackId: 't5' },
  { id: 'p6', name: 'Acoustic Sunset', tracksCount: 29, iconName: 'Sparkles', sampleTrackId: 't7' },
];

export const SAMPLE_ALBUMS: Album[] = [
  { id: 'a1', title: 'Starboy', artist: 'The Weeknd', year: '2016', sampleTrackId: 't1' },
  { id: 'a2', title: 'After Hours', artist: 'The Weeknd', year: '2020', sampleTrackId: 't3' },
  { id: 'a3', title: "Hurry Up, We're Dreaming", artist: 'M83', year: '2011', sampleTrackId: 't2' },
  { id: 'a4', title: 'Random Access Memories', artist: 'Daft Punk', year: '2013', sampleTrackId: 't6' },
  { id: 'a5', title: 'Future Nostalgia', artist: 'Dua Lipa', year: '2020', sampleTrackId: 't5' },
  { id: 'a6', title: 'Dreamland', artist: 'Glass Animals', year: '2020', sampleTrackId: 't11' },
];

export const renderCoverIcon = (iconName: string, className = 'w-5 h-5 text-white/90') => {
  switch (iconName) {
    case 'Radio':
      return <Radio className={className} />;
    case 'Flame':
      return <Flame className={className} />;
    case 'Disc':
      return <Disc className={className} />;
    case 'Zap':
      return <Zap className={className} />;
    case 'Sparkles':
      return <Sparkles className={className} />;
    case 'Heart':
      return <Heart className={className} />;
    case 'Compass':
      return <Compass className={className} />;
    case 'TrendingUp':
      return <TrendingUp className={className} />;
    default:
      return <Music className={className} />;
  }
};

export const formatMediaTime = (seconds?: number | null): string => {
  if (seconds === undefined || seconds === null || isNaN(seconds) || !isFinite(seconds) || seconds < 0) {
    return '0:00';
  }
  const totalSecs = Math.floor(seconds);
  const hours = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;
  if (hours > 0) {
    return `${hours}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};
