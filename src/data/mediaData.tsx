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
  ListMusic,
  Folder,
} from 'lucide-react';

export const MUSIC_SERVICES = ['Spotify', 'Apple Music', 'YouTube Music', 'Amazon Music'] as const;
export type MusicServiceType = (typeof MUSIC_SERVICES)[number];

export interface PlaylistMock {
  id: string;
  name: string;
  trackCount: number;
  iconName?: string;
  gradientBg: string;
  accentColor: string;
}

export const MOCK_PLAYLISTS: Record<MusicServiceType, PlaylistMock[]> = {
  Spotify: [
    { id: 'sp-1', name: 'Discover Weekly', trackCount: 30, iconName: 'Compass', gradientBg: 'from-emerald-600 to-teal-900', accentColor: '#1DB954' },
    { id: 'sp-2', name: 'Daily Mix 1', trackCount: 50, iconName: 'Radio', gradientBg: 'from-green-600 to-emerald-950', accentColor: '#1DB954' },
    { id: 'sp-3', name: 'Liked Songs', trackCount: 214, iconName: 'Heart', gradientBg: 'from-teal-600 to-emerald-900', accentColor: '#1DB954' },
    { id: 'sp-4', name: 'Road Trip Radio', trackCount: 42, iconName: 'Flame', gradientBg: 'from-emerald-500 to-teal-800', accentColor: '#1DB954' },
    { id: 'sp-5', name: 'Release Radar', trackCount: 30, iconName: 'Sparkles', gradientBg: 'from-green-700 to-teal-950', accentColor: '#1DB954' },
    { id: 'sp-6', name: 'Chill Vibes', trackCount: 65, iconName: 'Music', gradientBg: 'from-emerald-700 to-slate-900', accentColor: '#1DB954' },
    { id: 'sp-7', name: 'Throwback Jams', trackCount: 55, iconName: 'Disc', gradientBg: 'from-teal-700 to-emerald-950', accentColor: '#1DB954' },
    { id: 'sp-8', name: 'Workout Power', trackCount: 40, iconName: 'Zap', gradientBg: 'from-green-500 to-teal-900', accentColor: '#1DB954' },
  ],
  'Apple Music': [
    { id: 'am-1', name: 'Favorites Mix', trackCount: 25, iconName: 'Heart', gradientBg: 'from-rose-600 to-pink-900', accentColor: '#FA243C' },
    { id: 'am-2', name: 'New Music Mix', trackCount: 25, iconName: 'Sparkles', gradientBg: 'from-pink-600 to-rose-950', accentColor: '#FA243C' },
    { id: 'am-3', name: 'Replay 2026', trackCount: 100, iconName: 'TrendingUp', gradientBg: 'from-red-600 to-rose-900', accentColor: '#FA243C' },
    { id: 'am-4', name: 'Heavy Rotation', trackCount: 40, iconName: 'Flame', gradientBg: 'from-rose-500 to-red-950', accentColor: '#FA243C' },
    { id: 'am-5', name: 'Chill Mix', trackCount: 25, iconName: 'Disc', gradientBg: 'from-pink-700 to-rose-950', accentColor: '#FA243C' },
    { id: 'am-6', name: 'Spatial Audio Showcase', trackCount: 32, iconName: 'Zap', gradientBg: 'from-rose-700 to-slate-900', accentColor: '#FA243C' },
    { id: 'am-7', name: 'Throwback Essentials', trackCount: 45, iconName: 'Disc', gradientBg: 'from-red-600 to-pink-950', accentColor: '#FA243C' },
    { id: 'am-8', name: 'Focus Mix', trackCount: 30, iconName: 'Compass', gradientBg: 'from-rose-600 to-red-900', accentColor: '#FA243C' },
  ],
  'YouTube Music': [
    { id: 'yt-1', name: 'My Supermix', trackCount: 100, iconName: 'Zap', gradientBg: 'from-red-600 to-amber-900', accentColor: '#FF0000' },
    { id: 'yt-2', name: 'Discover Mix', trackCount: 50, iconName: 'Compass', gradientBg: 'from-amber-600 to-red-950', accentColor: '#FF0000' },
    { id: 'yt-3', name: 'Liked Music', trackCount: 185, iconName: 'Heart', gradientBg: 'from-red-700 to-orange-950', accentColor: '#FF0000' },
    { id: 'yt-4', name: 'Energy Booster', trackCount: 35, iconName: 'Flame', gradientBg: 'from-orange-600 to-red-900', accentColor: '#FF0000' },
    { id: 'yt-5', name: 'Focus Flow', trackCount: 48, iconName: 'Disc', gradientBg: 'from-red-800 to-slate-900', accentColor: '#FF0000' },
    { id: 'yt-6', name: 'Commute Beats', trackCount: 28, iconName: 'Radio', gradientBg: 'from-amber-700 to-red-950', accentColor: '#FF0000' },
    { id: 'yt-7', name: 'Late Night Drive', trackCount: 38, iconName: 'Music', gradientBg: 'from-red-600 to-orange-900', accentColor: '#FF0000' },
    { id: 'yt-8', name: 'Throwback Hits', trackCount: 60, iconName: 'TrendingUp', gradientBg: 'from-amber-600 to-red-950', accentColor: '#FF0000' },
  ],
  'Amazon Music': [
    { id: 'az-1', name: 'My Discovery Mix', trackCount: 30, iconName: 'Sparkles', gradientBg: 'from-cyan-600 to-blue-900', accentColor: '#00A8E1' },
    { id: 'az-2', name: 'Top Songs - Liked', trackCount: 150, iconName: 'Heart', gradientBg: 'from-sky-600 to-cyan-950', accentColor: '#00A8E1' },
    { id: 'az-3', name: 'All Hits Radio', trackCount: 50, iconName: 'Radio', gradientBg: 'from-blue-600 to-indigo-950', accentColor: '#00A8E1' },
    { id: 'az-4', name: 'Acoustic Chill', trackCount: 40, iconName: 'Music', gradientBg: 'from-cyan-700 to-sky-950', accentColor: '#00A8E1' },
    { id: 'az-5', name: 'Road Trip USA', trackCount: 60, iconName: 'Compass', gradientBg: 'from-sky-500 to-blue-900', accentColor: '#00A8E1' },
    { id: 'az-6', name: 'Ultra HD Hits', trackCount: 25, iconName: 'Zap', gradientBg: 'from-blue-700 to-slate-900', accentColor: '#00A8E1' },
    { id: 'az-7', name: 'Feel Good Friday', trackCount: 42, iconName: 'Sparkles', gradientBg: 'from-cyan-600 to-sky-900', accentColor: '#00A8E1' },
    { id: 'az-8', name: 'Workout Energy', trackCount: 33, iconName: 'Flame', gradientBg: 'from-blue-600 to-cyan-950', accentColor: '#00A8E1' },
  ],
};

export const PROVIDER_ACCENTS: Record<MusicServiceType, { color: string; gradient: string; label: string }> = {
  Spotify: { color: '#1DB954', gradient: 'from-emerald-500 to-teal-800', label: 'Spotify' },
  'Apple Music': { color: '#FA243C', gradient: 'from-rose-500 to-pink-800', label: 'Apple Music' },
  'YouTube Music': { color: '#FF0000', gradient: 'from-red-600 to-amber-800', label: 'YouTube Music' },
  'Amazon Music': { color: '#00A8E1', gradient: 'from-cyan-500 to-blue-800', label: 'Amazon Music' },
};

export interface DiscoveryTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: string;
  gradientFrom: string;
  gradientTo: string;
  iconName: string;
  rank?: number;
  linkedTrackId?: string; // NEW — maps this Discovery card to a real SAMPLE_TRACKS id
}

export const DISCOVERY_TRACKS_TRENDING: DiscoveryTrack[] = [
  {
    id: 'tr-1',
    rank: 1,
    title: 'Cruel Summer',
    artist: 'Taylor Swift',
    album: 'Lover',
    duration: '2:58',
    gradientFrom: 'from-pink-600',
    gradientTo: 'to-rose-900',
    iconName: 'Flame',
    linkedTrackId: 't7',
  },
  {
    id: 'tr-2',
    rank: 2,
    title: 'Paint The Town Red',
    artist: 'Doja Cat',
    album: 'Scarlet',
    duration: '3:51',
    gradientFrom: 'from-red-600',
    gradientTo: 'to-amber-950',
    iconName: 'Sparkles',
    linkedTrackId: 't23',
  },
  {
    id: 'tr-3',
    rank: 3,
    title: 'Greedy',
    artist: 'Tate McRae',
    album: 'THINK LATER',
    duration: '2:11',
    gradientFrom: 'from-purple-600',
    gradientTo: 'to-indigo-950',
    iconName: 'TrendingUp',
    linkedTrackId: 't24',
  },
  {
    id: 'tr-4',
    rank: 4,
    title: 'Strangers',
    artist: 'Kenya Grace',
    album: 'After Thought',
    duration: '2:52',
    gradientFrom: 'from-cyan-600',
    gradientTo: 'to-blue-950',
    iconName: 'Zap',
    linkedTrackId: 't25',
  },
  {
    id: 'tr-5',
    rank: 5,
    title: 'Water',
    artist: 'Tyla',
    album: 'TYLA',
    duration: '3:20',
    gradientFrom: 'from-teal-600',
    gradientTo: 'to-emerald-950',
    iconName: 'Compass',
    linkedTrackId: 't26',
  },
  {
    id: 'tr-6',
    rank: 6,
    title: 'Lovin On Me',
    artist: 'Jack Harlow',
    album: 'Lovin On Me',
    duration: '2:18',
    gradientFrom: 'from-amber-600',
    gradientTo: 'to-red-950',
    iconName: 'Radio',
    linkedTrackId: 't27',
  },
  {
    id: 'tr-7',
    rank: 7,
    title: 'Good Days',
    artist: 'SZA',
    album: 'Good Days',
    duration: '4:39',
    gradientFrom: 'from-fuchsia-600',
    gradientTo: 'to-purple-950',
    iconName: 'Sparkles',
    linkedTrackId: 't28',
  },
  {
    id: 'tr-8',
    rank: 8,
    title: 'Flowers',
    artist: 'Miley Cyrus',
    album: 'Endless Summer Vacation',
    duration: '3:20',
    gradientFrom: 'from-pink-500',
    gradientTo: 'to-orange-600',
    iconName: 'Flame',
    linkedTrackId: 't29',
  },
];

export const DISCOVERY_TRACKS_FORYOU: DiscoveryTrack[] = [
  {
    id: 'fy-1',
    title: 'Resonance',
    artist: 'HOME',
    album: 'Odyssey',
    duration: '3:32',
    gradientFrom: 'from-indigo-600',
    gradientTo: 'to-purple-950',
    iconName: 'Disc',
    linkedTrackId: 't15',
  },
  {
    id: 'fy-2',
    title: 'After Dark',
    artist: 'Mr.Kitty',
    album: 'Time',
    duration: '4:17',
    gradientFrom: 'from-violet-600',
    gradientTo: 'to-slate-950',
    iconName: 'Music',
    linkedTrackId: 't16',
  },
  {
    id: 'fy-3',
    title: 'Pacific Coast Highway',
    artist: 'Kavinsky',
    album: 'OutRun',
    duration: '4:18',
    gradientFrom: 'from-rose-600',
    gradientTo: 'to-orange-950',
    iconName: 'Compass',
    linkedTrackId: 't17',
  },
  {
    id: 'fy-4',
    title: 'Sunset Lover',
    artist: 'Petit Biscuit',
    album: 'Presence',
    duration: '3:57',
    gradientFrom: 'from-amber-500',
    gradientTo: 'to-pink-900',
    iconName: 'Sparkles',
    linkedTrackId: 't19',
  },
  {
    id: 'fy-5',
    title: 'Daylight',
    artist: 'David Kushner',
    album: 'Daylight',
    duration: '3:32',
    gradientFrom: 'from-emerald-600',
    gradientTo: 'to-cyan-950',
    iconName: 'Heart',
    linkedTrackId: 't20',
  },
  {
    id: 'fy-6',
    title: 'Starboy',
    artist: 'The Weeknd ft. Daft Punk',
    album: 'Starboy',
    duration: '3:50',
    gradientFrom: 'from-purple-600',
    gradientTo: 'to-pink-900',
    iconName: 'Zap',
    linkedTrackId: 't1',
  },
  {
    id: 'fy-7',
    title: 'Electric Feel',
    artist: 'MGMT',
    album: 'Oracular Spectaculor',
    duration: '3:49',
    gradientFrom: 'from-lime-600',
    gradientTo: 'to-emerald-950',
    iconName: 'Zap',
    linkedTrackId: 't21',
  },
  {
    id: 'fy-8',
    title: 'Nights',
    artist: 'Frank Ocean',
    album: 'Blonde',
    duration: '5:07',
    gradientFrom: 'from-slate-600',
    gradientTo: 'to-indigo-950',
    iconName: 'Music',
    linkedTrackId: 't22',
  },
  {
    id: 'fy-9',
    title: 'Borderline',
    artist: 'Tame Impala',
    album: 'The Slow Rush',
    duration: '3:57',
    gradientFrom: 'from-orange-500',
    gradientTo: 'to-red-950',
    iconName: 'TrendingUp',
  },
  {
    id: 'fy-10',
    title: 'Space Song',
    artist: 'Beach House',
    album: 'Depression Cherry',
    duration: '5:20',
    gradientFrom: 'from-sky-500',
    gradientTo: 'to-indigo-950',
    iconName: 'Sparkles',
  },
  {
    id: 'fy-11',
    title: 'Sweater Weather',
    artist: 'The Neighbourhood',
    album: 'I Love You.',
    duration: '4:00',
    gradientFrom: 'from-slate-500',
    gradientTo: 'to-zinc-950',
    iconName: 'Music',
  },
  {
    id: 'fy-12',
    title: 'Tongue Tied',
    artist: 'Grouplove',
    album: 'Never Trust a Happy Song',
    duration: '3:38',
    gradientFrom: 'from-yellow-500',
    gradientTo: 'to-orange-950',
    iconName: 'Zap',
  },
  {
    id: 'fy-13',
    title: 'Young Blood',
    artist: 'The Naked and Famous',
    album: 'Passive Me, Aggressive You',
    duration: '4:07',
    gradientFrom: 'from-pink-500',
    gradientTo: 'to-purple-950',
    iconName: 'Flame',
  },
  {
    id: 'fy-14',
    title: 'Somebody Else',
    artist: 'The 1975',
    album: 'I Like It When You Sleep, for You Are So Beautiful Yet So Unaware of It',
    duration: '5:47',
    gradientFrom: 'from-rose-500',
    gradientTo: 'to-slate-950',
    iconName: 'Heart',
  },
  {
    id: 'fy-15',
    title: 'Kids',
    artist: 'Current Joys',
    album: 'Wild Heart',
    duration: '3:37',
    gradientFrom: 'from-teal-500',
    gradientTo: 'to-cyan-950',
    iconName: 'Compass',
  },
  {
    id: 'fy-16',
    title: '505',
    artist: 'Arctic Monkeys',
    album: 'Favourite Worst Nightmare',
    duration: '4:13',
    gradientFrom: 'from-red-600',
    gradientTo: 'to-indigo-950',
    iconName: 'Disc',
  },
];

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
  {
    id: 't13',
    title: 'Salad Days',
    artist: 'Mac DeMarco',
    album: 'Salad Days',
    duration: '2:25',
    durationSec: 145,
    coverBg: 'from-lime-500 to-emerald-700',
    iconName: 'Music',
  },
  {
    id: 't14',
    title: 'Chamber of Reflection',
    artist: 'Mac DeMarco',
    album: 'Salad Days',
    duration: '3:51',
    durationSec: 231,
    coverBg: 'from-indigo-500 to-violet-800',
    iconName: 'Music',
  },
  {
    id: 't15',
    title: 'Resonance',
    artist: 'HOME',
    album: 'Odyssey',
    duration: '3:32',
    durationSec: 212,
    coverBg: 'from-indigo-600 to-purple-950',
    iconName: 'Disc',
  },
  {
    id: 't16',
    title: 'After Dark',
    artist: 'Mr.Kitty',
    album: 'Time',
    duration: '4:17',
    durationSec: 257,
    coverBg: 'from-violet-600 to-slate-950',
    iconName: 'Music',
  },
  {
    id: 't17',
    title: 'Pacific Coast Highway',
    artist: 'Kavinsky',
    album: 'OutRun',
    duration: '4:18',
    durationSec: 258,
    coverBg: 'from-rose-600 to-orange-950',
    iconName: 'Compass',
  },
  {
    id: 't18',
    title: 'Sunroof',
    artist: 'Nicky Youre & dazy',
    album: 'Sunroof',
    duration: '2:43',
    durationSec: 163,
    coverBg: 'from-sky-400 to-cyan-600',
    iconName: 'Radio',
  },
  {
    id: 't19',
    title: 'Sunset Lover',
    artist: 'Petit Biscuit',
    album: 'Presence',
    duration: '3:57',
    durationSec: 237,
    coverBg: 'from-amber-500 to-pink-900',
    iconName: 'Sparkles',
  },
  {
    id: 't20',
    title: 'Daylight',
    artist: 'David Kushner',
    album: 'Daylight',
    duration: '3:32',
    durationSec: 212,
    coverBg: 'from-emerald-600 to-cyan-950',
    iconName: 'Heart',
  },
  {
    id: 't21',
    title: 'Electric Feel',
    artist: 'MGMT',
    album: 'Oracular Spectacular',
    duration: '3:49',
    durationSec: 229,
    coverBg: 'from-lime-600 to-emerald-950',
    iconName: 'Zap',
  },
  {
    id: 't22',
    title: 'Nights',
    artist: 'Frank Ocean',
    album: 'Blonde',
    duration: '5:07',
    durationSec: 307,
    coverBg: 'from-slate-600 to-indigo-950',
    iconName: 'Music',
  },
  {
    id: 't23',
    title: 'Paint The Town Red',
    artist: 'Doja Cat',
    album: 'Scarlet',
    duration: '3:51',
    durationSec: 231,
    coverBg: 'from-red-600 to-amber-950',
    iconName: 'Sparkles',
  },
  {
    id: 't24',
    title: 'Greedy',
    artist: 'Tate McRae',
    album: 'THINK LATER',
    duration: '2:11',
    durationSec: 131,
    coverBg: 'from-purple-600 to-indigo-950',
    iconName: 'TrendingUp',
  },
  {
    id: 't25',
    title: 'Strangers',
    artist: 'Kenya Grace',
    album: 'After Thought',
    duration: '2:52',
    durationSec: 172,
    coverBg: 'from-cyan-600 to-blue-950',
    iconName: 'Zap',
  },
  {
    id: 't26',
    title: 'Water',
    artist: 'Tyla',
    album: 'TYLA',
    duration: '3:20',
    durationSec: 200,
    coverBg: 'from-teal-600 to-emerald-950',
    iconName: 'Compass',
  },
  {
    id: 't27',
    title: 'Lovin On Me',
    artist: 'Jack Harlow',
    album: 'Lovin On Me',
    duration: '2:18',
    durationSec: 138,
    coverBg: 'from-amber-600 to-red-950',
    iconName: 'Radio',
  },
  {
    id: 't28',
    title: 'Good Days',
    artist: 'SZA',
    album: 'Good Days',
    duration: '4:39',
    durationSec: 279,
    coverBg: 'from-fuchsia-600 to-purple-950',
    iconName: 'Sparkles',
  },
  {
    id: 't29',
    title: 'Flowers',
    artist: 'Miley Cyrus',
    album: 'Endless Summer Vacation',
    duration: '3:20',
    durationSec: 200,
    coverBg: 'from-pink-500 to-orange-600',
    iconName: 'Flame',
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
    case 'ListMusic':
      return <ListMusic className={className} />;
    case 'Folder':
      return <Folder className={className} />;
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

export type MediaContentType = 'music' | 'podcast' | 'audiobook';
export type MediaSearchSource = 'spotify' | 'apple_music' | 'radio';

export interface SearchCatalogItem {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration?: string;
  contentType: MediaContentType;
  source: MediaSearchSource;
  sourceLabel: string;
  iconName?: string;
  linkedTrackId?: string; // NEW — maps this catalog item to a real SAMPLE_TRACKS id
}

export const MOCK_SEARCH_CATALOG: SearchCatalogItem[] = [
  // Music - Spotify
  { id: 'sc-1', title: 'Salad Days', artist: 'Mac DeMarco', album: 'Salad Days', duration: '2:25', contentType: 'music', source: 'spotify', sourceLabel: 'Spotify', iconName: 'Music', linkedTrackId: 't13' },
  { id: 'sc-2', title: 'Chamber of Reflection', artist: 'Mac DeMarco', album: 'Salad Days', duration: '3:51', contentType: 'music', source: 'spotify', sourceLabel: 'Spotify', iconName: 'Music', linkedTrackId: 't14' },
  { id: 'sc-3', title: 'Starboy', artist: 'The Weeknd ft. Daft Punk', album: 'Starboy', duration: '3:50', contentType: 'music', source: 'spotify', sourceLabel: 'Spotify', iconName: 'Music', linkedTrackId: 't1' },
  { id: 'sc-4', title: 'Blinding Lights', artist: 'The Weeknd', album: 'After Hours', duration: '3:20', contentType: 'music', source: 'spotify', sourceLabel: 'Spotify', iconName: 'Music', linkedTrackId: 't3' },
  { id: 'sc-5', title: 'Midnight City', artist: 'M83', album: "Hurry Up, We're Dreaming", duration: '4:03', contentType: 'music', source: 'spotify', sourceLabel: 'Spotify', iconName: 'Music', linkedTrackId: 't2' },
  { id: 'sc-6', title: 'Resonance', artist: 'HOME', album: 'Odyssey', duration: '3:32', contentType: 'music', source: 'spotify', sourceLabel: 'Spotify', iconName: 'Disc', linkedTrackId: 't15' },
  { id: 'sc-7', title: 'After Dark', artist: 'Mr.Kitty', album: 'Time', duration: '4:17', contentType: 'music', source: 'spotify', sourceLabel: 'Spotify', iconName: 'Music', linkedTrackId: 't16' },
  
  // Music - Apple Music
  { id: 'sc-8', title: 'As It Was', artist: 'Harry Styles', album: "Harry's House", duration: '2:47', contentType: 'music', source: 'apple_music', sourceLabel: 'Apple Music', iconName: 'Disc', linkedTrackId: 't4' },
  { id: 'sc-9', title: 'Cruel Summer', artist: 'Taylor Swift', album: 'Lover', duration: '2:58', contentType: 'music', source: 'apple_music', sourceLabel: 'Apple Music', iconName: 'Heart', linkedTrackId: 't7' },
  { id: 'sc-10', title: 'Levitating', artist: 'Dua Lipa', album: 'Future Nostalgia', duration: '3:23', contentType: 'music', source: 'apple_music', sourceLabel: 'Apple Music', iconName: 'Zap', linkedTrackId: 't5' },
  { id: 'sc-11', title: 'Get Lucky', artist: 'Daft Punk ft. Pharrell', album: 'Random Access Memories', duration: '4:08', contentType: 'music', source: 'apple_music', sourceLabel: 'Apple Music', iconName: 'Sparkles', linkedTrackId: 't6' },
  { id: 'sc-12', title: 'Pacific Coast Highway', artist: 'Kavinsky', album: 'OutRun', duration: '4:18', contentType: 'music', source: 'apple_music', sourceLabel: 'Apple Music', iconName: 'Compass', linkedTrackId: 't17' },
  
  // Music - Radio
  { id: 'sc-13', title: 'KEXP 90.3 FM Live', artist: 'Where the Music Matters', album: 'Seattle Radio', duration: 'Live', contentType: 'music', source: 'radio', sourceLabel: 'Radio', iconName: 'Radio' },
  { id: 'sc-14', title: 'NPR Music Live Sessions', artist: 'Tiny Desk Concerts', album: 'NPR Radio', duration: 'Live', contentType: 'music', source: 'radio', sourceLabel: 'Radio', iconName: 'Radio' },
  { id: 'sc-15', title: 'Heat Waves', artist: 'Glass Animals', album: 'Alt Nation', duration: '3:58', contentType: 'music', source: 'radio', sourceLabel: 'Radio', iconName: 'Radio', linkedTrackId: 't11' },
  { id: 'sc-16', title: 'Sunroof', artist: 'Nicky Youre & dazy', album: 'Top Hits Radio', duration: '2:43', contentType: 'music', source: 'radio', sourceLabel: 'Radio', iconName: 'Radio', linkedTrackId: 't18' },

  // Spoken Word - Podcasts (Spotify / Apple Music)
  { id: 'sc-17', title: 'The Daily: Behind the Wheel', artist: 'The New York Times', album: 'Episode 1842', duration: '24 min', contentType: 'podcast', source: 'spotify', sourceLabel: 'Spotify', iconName: 'Radio' },
  { id: 'sc-18', title: 'Huberman Lab: Focus & Soundscapes', artist: 'Dr. Andrew Huberman', album: 'Science & Health', duration: '1 hr 45 min', contentType: 'podcast', source: 'apple_music', sourceLabel: 'Apple Music', iconName: 'Radio' },
  { id: 'sc-19', title: 'How I Built This: Music Streaming', artist: 'Guy Raz · NPR', album: 'Business & Tech', duration: '48 min', contentType: 'podcast', source: 'spotify', sourceLabel: 'Spotify', iconName: 'Radio' },
  { id: 'sc-20', title: 'Hardcore History: Twilight of the Gods', artist: 'Dan Carlin', album: 'History Classic', duration: '4 hr 12 min', contentType: 'podcast', source: 'apple_music', sourceLabel: 'Apple Music', iconName: 'Radio' },

  // Spoken Word - Audiobooks
  { id: 'sc-21', title: 'Atomic Habits (Unabridged)', artist: 'James Clear', album: 'Narrated by Author', duration: '5 hr 35 min', contentType: 'audiobook', source: 'spotify', sourceLabel: 'Spotify', iconName: 'Radio' },
  { id: 'sc-22', title: 'Project Hail Mary', artist: 'Andy Weir', album: 'Narrated by Ray Porter', duration: '16 hr 10 min', contentType: 'audiobook', source: 'apple_music', sourceLabel: 'Apple Music', iconName: 'Radio' },
  { id: 'sc-23', title: 'Steve Jobs', artist: 'Walter Isaacson', album: 'Narrated by Dylan Baker', duration: '25 hr 02 min', contentType: 'audiobook', source: 'apple_music', sourceLabel: 'Apple Music', iconName: 'Radio' },
];

export const MOCK_NLU_LOOKUP: Record<string, { queryLabel: string; results: SearchCatalogItem[] }> = {
  'indie rock': {
    queryLabel: 'Indie Rock Curated Mix',
    results: [
      { id: 'sc-1', title: 'Salad Days', artist: 'Mac DeMarco', album: 'Salad Days', duration: '2:25', contentType: 'music', source: 'spotify', sourceLabel: 'Spotify', iconName: 'Music', linkedTrackId: 't13' },
      { id: 'sc-2', title: 'Chamber of Reflection', artist: 'Mac DeMarco', album: 'Salad Days', duration: '3:51', contentType: 'music', source: 'spotify', sourceLabel: 'Spotify', iconName: 'Music', linkedTrackId: 't14' },
      { id: 'sc-5', title: 'Midnight City', artist: 'M83', album: "Hurry Up, We're Dreaming", duration: '4:03', contentType: 'music', source: 'spotify', sourceLabel: 'Spotify', iconName: 'Music', linkedTrackId: 't2' },
      { id: 'sc-15', title: 'Heat Waves', artist: 'Glass Animals', album: 'Alt Nation', duration: '3:58', contentType: 'music', source: 'radio', sourceLabel: 'Radio', iconName: 'Radio', linkedTrackId: 't11' },
    ],
  },
  'workout hype': {
    queryLabel: 'High Energy Workout Beats',
    results: [
      { id: 'sc-3', title: 'Starboy', artist: 'The Weeknd ft. Daft Punk', album: 'Starboy', duration: '3:50', contentType: 'music', source: 'spotify', sourceLabel: 'Spotify', iconName: 'Music', linkedTrackId: 't1' },
      { id: 'sc-10', title: 'Levitating', artist: 'Dua Lipa', album: 'Future Nostalgia', duration: '3:23', contentType: 'music', source: 'apple_music', sourceLabel: 'Apple Music', iconName: 'Zap', linkedTrackId: 't5' },
      { id: 'sc-11', title: 'Get Lucky', artist: 'Daft Punk ft. Pharrell', album: 'Random Access Memories', duration: '4:08', contentType: 'music', source: 'apple_music', sourceLabel: 'Apple Music', iconName: 'Sparkles', linkedTrackId: 't6' },
    ],
  },
  'something chill for the drive': {
    queryLabel: 'Chill Drive Soundscape',
    results: [
      { id: 'sc-6', title: 'Resonance', artist: 'HOME', album: 'Odyssey', duration: '3:32', contentType: 'music', source: 'spotify', sourceLabel: 'Spotify', iconName: 'Disc', linkedTrackId: 't15' },
      { id: 'sc-7', title: 'After Dark', artist: 'Mr.Kitty', album: 'Time', duration: '4:17', contentType: 'music', source: 'spotify', sourceLabel: 'Spotify', iconName: 'Music', linkedTrackId: 't16' },
      { id: 'sc-12', title: 'Pacific Coast Highway', artist: 'Kavinsky', album: 'OutRun', duration: '4:18', contentType: 'music', source: 'apple_music', sourceLabel: 'Apple Music', iconName: 'Compass', linkedTrackId: 't17' },
      { id: 'sc-13', title: 'KEXP 90.3 FM Live', artist: 'Where the Music Matters', album: 'Seattle Radio', duration: 'Live', contentType: 'music', source: 'radio', sourceLabel: 'Radio', iconName: 'Radio' },
    ],
  },
};

const linkedIdsInCatalog = new Set(
  MOCK_SEARCH_CATALOG.filter((item) => item.linkedTrackId).map((item) => item.linkedTrackId)
);

const derivedFromSampleTracks: SearchCatalogItem[] = SAMPLE_TRACKS.filter(
  (track) => !linkedIdsInCatalog.has(track.id)
).map((track) => ({
  id: track.id,
  title: track.title,
  artist: track.artist,
  album: track.album,
  duration: track.duration,
  contentType: 'music',
  source: 'spotify',
  sourceLabel: 'Spotify',
  iconName: track.iconName,
  linkedTrackId: track.id,
}));

export const SEARCHABLE_CATALOG: SearchCatalogItem[] = [
  ...MOCK_SEARCH_CATALOG,
  ...derivedFromSampleTracks,
];

