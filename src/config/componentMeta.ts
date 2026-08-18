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
} from 'lucide-react';
import { ComponentType } from '../types';

export interface ComponentMeta {
  type: ComponentType;
  icon: ElementType;
  defaultColor: string;
}

export const COMPONENT_META: Record<ComponentType, ComponentMeta> = {
  battery: { type: 'battery', icon: Battery, defaultColor: '#22c55e' },
  gear: { type: 'gear', icon: ParkingCircle, defaultColor: '#f8fafc' },
  speed: { type: 'speed', icon: Gauge, defaultColor: '#38bdf8' },
  climate: { type: 'climate', icon: Thermometer, defaultColor: '#f97316' },
  driveMode: { type: 'driveMode', icon: Compass, defaultColor: '#06b6d4' },
  tirePressure: { type: 'tirePressure', icon: CircleDot, defaultColor: '#eab308' },
  map: { type: 'map', icon: MapPin, defaultColor: '#38bdf8' },
  navHome: { type: 'navHome', icon: Home, defaultColor: '#38bdf8' },
  navDestination: { type: 'navDestination', icon: Flag, defaultColor: '#f59e0b' },
  navSearch: { type: 'navSearch', icon: Search, defaultColor: '#10b981' },
  navTripEstimate: { type: 'navTripEstimate', icon: Clock, defaultColor: '#a855f7' },
  overheadVisualization: { type: 'overheadVisualization', icon: Eye, defaultColor: '#38bdf8' },
  miniNav: { type: 'miniNav', icon: Navigation, defaultColor: '#38bdf8' },
  media: { type: 'media', icon: Music, defaultColor: '#ec4899' },
  phone: { type: 'phone', icon: Phone, defaultColor: '#10b981' },
  phoneContacts: { type: 'phoneContacts', icon: Users, defaultColor: '#a855f7' },
  phoneDialPad: { type: 'phoneDialPad', icon: Grid, defaultColor: '#10b981' },
  phoneMessaging: { type: 'phoneMessaging', icon: MessageSquare, defaultColor: '#38bdf8' },
  climateVent: { type: 'climateVent', icon: Fan, defaultColor: '#06b6d4' },
  climateTemp: { type: 'climateTemp', icon: Sun, defaultColor: '#f97316' },
  climateSeats: { type: 'climateSeats', icon: User, defaultColor: '#ef4444' },
  vehicleExplodedView: { type: 'vehicleExplodedView', icon: Layers, defaultColor: '#38bdf8' },
  vehicleStatusCallout: { type: 'vehicleStatusCallout', icon: Activity, defaultColor: '#10b981' },
  sendToServiceCenter: { type: 'sendToServiceCenter', icon: Send, defaultColor: '#38bdf8' },
  warning: { type: 'warning', icon: AlertTriangle, defaultColor: '#f59e0b' },
};

export const getComponentIcon = (type: ComponentType): ElementType => {
  return COMPONENT_META[type]?.icon || Gauge;
};

export const getComponentColor = (type: ComponentType, customColor?: string): string => {
  if (customColor && customColor.startsWith('#')) return customColor;
  return COMPONENT_META[type]?.defaultColor || '#38bdf8';
};
