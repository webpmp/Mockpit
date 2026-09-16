import React, { ElementType } from 'react';
import {
  Battery,
  CircleDot,
  Clock,
  Compass,
  Eye,
  Fan,
  Flag,
  Gauge,
  Grid,
  Home,
  MapPin,
  MessageSquare,
  Music,
  ParkingCircle,
  Phone,
  Search,
  Star,
  Sun,
  Thermometer,
  User,
  Users,
  Zap,
  AlertTriangle,
  Layers,
  Activity,
  Send,
  Navigation,
  ListMusic,
  Sparkles,
  MapPinned,
} from 'lucide-react';
import { ComponentType } from '../types';

export interface ComponentMeta {
  type: ComponentType;
  icon: ElementType;
  defaultColor: string;
}

export const COMPONENT_META: Record<ComponentType, ComponentMeta> = {
  battery: { type: 'battery', icon: Battery, defaultColor: '#38bdf8' },
  gear: { type: 'gear', icon: ParkingCircle, defaultColor: '#38bdf8' },
  speed: { type: 'speed', icon: Gauge, defaultColor: '#38bdf8' },
  climate: { type: 'climate', icon: Thermometer, defaultColor: '#fb923c' },
  driveMode: { type: 'driveMode', icon: Compass, defaultColor: '#38bdf8' },
  tirePressure: { type: 'tirePressure', icon: CircleDot, defaultColor: '#818cf8' },
  map: { type: 'map', icon: MapPin, defaultColor: '#34d399' },
  navHome: { type: 'navHome', icon: Home, defaultColor: '#34d399' },
  navFavorites: { type: 'navFavorites', icon: Star, defaultColor: '#34d399' },
  navDestination: { type: 'navDestination', icon: Flag, defaultColor: '#34d399' },
  navSearch: { type: 'navSearch', icon: Search, defaultColor: '#34d399' },
  navTripEstimate: { type: 'navTripEstimate', icon: Clock, defaultColor: '#34d399' },
  navTripSummary: { type: 'navTripSummary', icon: MapPinned, defaultColor: '#34d399' },
  overheadVisualization: { type: 'overheadVisualization', icon: Eye, defaultColor: '#34d399' },
  miniNav: { type: 'miniNav', icon: Navigation, defaultColor: '#34d399' },
  media: { type: 'media', icon: Music, defaultColor: '#ec4899' },
  nowPlaying: { type: 'nowPlaying', icon: Music, defaultColor: '#ec4899' },
  mediaPlaylists: { type: 'mediaPlaylists', icon: ListMusic, defaultColor: '#ec4899' },
  mediaDiscovery: { type: 'mediaDiscovery', icon: Sparkles, defaultColor: '#ec4899' },
  mediaSearch: { type: 'mediaSearch', icon: Search, defaultColor: '#ec4899' },
  phone: { type: 'phone', icon: Phone, defaultColor: '#2dd4bf' },
  phoneContacts: { type: 'phoneContacts', icon: Users, defaultColor: '#2dd4bf' },
  phoneDialPad: { type: 'phoneDialPad', icon: Grid, defaultColor: '#2dd4bf' },
  phoneMessaging: { type: 'phoneMessaging', icon: MessageSquare, defaultColor: '#2dd4bf' },
  climateVent: { type: 'climateVent', icon: Fan, defaultColor: '#fb923c' },
  climateTemp: { type: 'climateTemp', icon: Sun, defaultColor: '#fb923c' },
  climateSeats: { type: 'climateSeats', icon: User, defaultColor: '#fb923c' },
  vehicleExplodedView: { type: 'vehicleExplodedView', icon: Layers, defaultColor: '#818cf8' },
  vehicleStatusCallout: { type: 'vehicleStatusCallout', icon: Activity, defaultColor: '#818cf8' },
  sendToServiceCenter: { type: 'sendToServiceCenter', icon: Send, defaultColor: '#818cf8' },
  warning: { type: 'warning', icon: AlertTriangle, defaultColor: '#f59e0b' },
};

export const getComponentIcon = (type: ComponentType): ElementType => {
  return COMPONENT_META[type]?.icon || Gauge;
};

export const getComponentColor = (type: ComponentType, customColor?: string): string => {
  if (customColor && customColor.startsWith('#')) return customColor;
  return COMPONENT_META[type]?.defaultColor || '#38bdf8';
};
