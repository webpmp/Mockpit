import {
  LayoutGrid,
  MapPin,
  Music,
  Phone,
  CloudSun,
  Wind,
  Car,
  Gauge,
  Radio,
  Flame,
  Layout,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export const SCREEN_ICON_OPTIONS: Array<{ key: string; icon: LucideIcon; label: string }> = [
  { key: 'layout-grid', icon: LayoutGrid, label: 'Grid' },
  { key: 'map-pin', icon: MapPin, label: 'Map Pin' },
  { key: 'music', icon: Music, label: 'Music' },
  { key: 'phone', icon: Phone, label: 'Phone' },
  { key: 'cloud-sun', icon: CloudSun, label: 'Weather' },
  { key: 'wind', icon: Wind, label: 'Climate' },
  { key: 'car', icon: Car, label: 'Vehicle' },
  { key: 'gauge', icon: Gauge, label: 'Gauge' },
  { key: 'radio', icon: Radio, label: 'Radio' },
  { key: 'flame', icon: Flame, label: 'Flame' },
];

const ICON_MAP: Record<string, LucideIcon> = Object.fromEntries(
  SCREEN_ICON_OPTIONS.map((opt) => [opt.key, opt.icon])
);

const LEGACY_ID_FALLBACK: Record<string, string> = {
  home: 'layout-grid',
  navigation: 'map-pin',
  favorites: 'map-pin',
  media: 'music',
  playlists: 'music',
  phone: 'phone',
  weather: 'cloud-sun',
  'weather-radar': 'cloud-sun',
  radar: 'cloud-sun',
  vehicle: 'car',
  climate: 'wind',
};

export function getScreenIcon(screen: { id: string; name?: string; icon?: string } | null | undefined): LucideIcon {
  if (!screen) return Layout;
  if (screen.icon && ICON_MAP[screen.icon]) return ICON_MAP[screen.icon];
  const normId = screen.id?.toLowerCase();
  const normName = screen.name?.toLowerCase();
  const fallbackKey = LEGACY_ID_FALLBACK[normId] || (normName ? LEGACY_ID_FALLBACK[normName] : undefined);
  return fallbackKey && ICON_MAP[fallbackKey] ? ICON_MAP[fallbackKey] : Layout;
}
