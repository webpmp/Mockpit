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

export const CruiseControlIcon: React.FC<React.SVGProps<SVGSVGElement>> = ({
  className = '',
  style,
  ...props
}) =>
  React.createElement(
    'svg',
    {
      viewBox: '0 0 200 200',
      fill: 'currentColor',
      className: `shrink-0 ${className}`,
      style,
      'aria-hidden': 'true',
      ...props,
    },
    React.createElement('path', {
      d: 'm49.957 28.711c-6.0882 0.18548-11.54 3.8277-14.043 9.3809l-2.3164 5.1387c-0.65301 1.449-1.2268 2.934-1.7188 4.4453l-1.0918 3.3535-7.9551 0.41406c-2.987 0.15618-5.3262 2.6221-5.3262 5.6133v2.3496c0 0.92296 0.74701 1.6699 1.6699 1.6699h8.373c-0.41576 1.496-0.69534 3.0287-0.81836 4.5781l-0.42188 5.3418c-0.1512 1.9044-0.12646 3.8191 0.07617 5.7188l0.72656 6.8223c0.20216 1.8953 0.65782 3.756 1.3516 5.5312l1.4941 3.8223c0.18158 0.46464 0.62806 0.77148 1.127 0.77148h0.80274v15.439c0 0.79762 0.64379 1.4395 1.4414 1.4395h12.328c0.79762 0 1.4395-0.64186 1.4395-1.4395v-15.439h31.156c9.8605-4.923 20.956-7.7109 32.684-7.7109 1.2063 0 2.4052 0.03379 3.5976 0.0918 0.18911-0.82567 0.3377-1.6617 0.42774-2.5059l0.72656-6.8223c0.20261-1.8996 0.22732-3.8143 0.0762-5.7188l-0.42187-5.3418c-0.12302-1.5495-0.40456-3.0821-0.82032-4.5781h8.373c0.92296 0 1.6719-0.74701 1.6719-1.6699v-2.3496c0-2.9912-2.3411-5.4571-5.3281-5.6133l-7.9531-0.41406-1.0918-3.3535c-0.49197-1.5113-1.0658-2.9964-1.7188-4.4453l-2.3164-5.1387c-2.5027-5.5532-7.9546-9.1953-14.043-9.3809zm3.3711 6.6055h35.414c4.8423 0 9.2429 2.8178 11.268 7.2168l6.2266 15.707h-70.4l6.2266-15.707c2.024-4.3983 6.4237-7.216 11.266-7.2168z',
    }),
    React.createElement('circle', {
      cx: 110.93,
      cy: 159.55,
      r: 11.214,
    }),
    React.createElement(
      'g',
      { stroke: 'currentColor' },
      React.createElement(
        'g',
        { strokeWidth: 5 },
        React.createElement('path', {
          d: 'm155.98 168.26h17.052v-8.714a62.097 62.097 0 0 0-62.097-62.097 62.097 62.097 0 0 0-62.097 62.097v8.714h17.052',
          fill: 'none',
        }),
        React.createElement('path', { d: 'm54.508 133.63 14.286 6.3604' }),
        React.createElement('path', { d: 'm110.93 97.452-5e-5 15.638' })
      ),
      React.createElement('path', {
        d: 'm75.396 108.63 35.688 50.187',
        strokeWidth: 6,
      }),
      React.createElement('path', {
        d: 'm167.51 133.42-14.286 6.3604',
        strokeWidth: 5,
      }),
      React.createElement('path', {
        d: 'm146.47 108.63-9.062 12.744',
        strokeWidth: 5,
      })
    ),
    React.createElement('path', {
      d: 'm167.28 55.312-12.863 22.279-11.641-6.7207 7.6758 28.65 28.65-7.6777-11.641-6.7207 12.863-22.279z',
    })
  );

export const NowPlayingIcon: React.FC<React.SVGProps<SVGSVGElement>> = ({
  className = '',
  style,
  ...props
}) => {
  const finalClass = className ? (className.includes('w-') ? className : `w-5 h-5 ${className}`) : 'w-5 h-5';
  return React.createElement(
    'svg',
    {
      xmlns: 'http://www.w3.org/2000/svg',
      width: 24,
      height: 24,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth: 1.5,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      className: finalClass,
      'aria-hidden': 'true',
      style,
      ...props,
    },
    React.createElement('rect', {
      x: 5,
      y: 3,
      width: 14,
      height: 13,
      rx: 2.5,
      fill: '#18181b',
    }),
    React.createElement(
      'g',
      { className: 'speaker-cone' },
      React.createElement('circle', {
        cx: 12,
        cy: 9.5,
        r: 4,
        stroke: '#a1a1aa',
        strokeWidth: 1,
      }),
      React.createElement('circle', {
        cx: 12,
        cy: 9.5,
        r: 1.5,
        fill: 'currentColor',
        stroke: 'none',
      })
    ),
    React.createElement('line', {
      x1: 3,
      y1: 20,
      x2: 21,
      y2: 20,
      stroke: '#3f3f46',
      strokeWidth: 2,
    }),
    React.createElement('line', {
      x1: 3,
      y1: 20,
      x2: 13,
      y2: 20,
      stroke: '#38bdf8',
      strokeWidth: 2,
    }),
    React.createElement('circle', {
      cx: 13,
      cy: 20,
      r: 1.5,
      fill: '#38bdf8',
      stroke: 'none',
    })
  );
};

export const COMPONENT_META: Record<ComponentType, ComponentMeta> = {
  battery: { type: 'battery', icon: Battery, defaultColor: '#38bdf8' },
  gear: { type: 'gear', icon: ParkingCircle, defaultColor: '#38bdf8' },
  speed: { type: 'speed', icon: Gauge, defaultColor: '#38bdf8' },
  climate: { type: 'climate', icon: Thermometer, defaultColor: '#fb923c' },
  driveMode: { type: 'driveMode', icon: Compass, defaultColor: '#38bdf8' },
  cruiseControl: { type: 'cruiseControl', icon: CruiseControlIcon, defaultColor: '#38bdf8' },
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
  nowPlaying: { type: 'nowPlaying', icon: NowPlayingIcon, defaultColor: '#ec4899' },
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
