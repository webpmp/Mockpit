import { ComponentType, ComponentInstance, Binding } from '../types';
import { COMPONENT_META } from './componentMeta';
import { DEFAULT_COMPONENT_LABELS } from '../components/ComponentRenderer';

export interface QuickAccessOption {
  type: ComponentType;
  label: string;
}

export const QUICK_ACCESS_OPTIONS: QuickAccessOption[] = [
  { type: 'media', label: 'Music Media Player' },
  { type: 'climate', label: 'Climate Control' },
  { type: 'climateTemp', label: 'Temperature Control' },
  { type: 'climateVent', label: 'Air Vents' },
  { type: 'climateSeats', label: 'Heated / Cooled Seats' },
  { type: 'vehicleExplodedView', label: 'Vehicle Controls (Exploded View)' },
  { type: 'vehicleStatusCallout', label: 'Vehicle Status Callout' },
  { type: 'driveMode', label: 'Drive Mode Selector' },
  { type: 'speed', label: 'Speedometer' },
  { type: 'gear', label: 'Gear Indicator' },
  { type: 'battery', label: 'Battery Indicator' },
  { type: 'tirePressure', label: 'Tire Pressure Monitor' },
  { type: 'miniNav', label: 'Mini Navigation' },
  { type: 'overheadVisualization', label: 'Overhead Driving Visualization' },
  { type: 'nowPlaying', label: 'Now Playing Card' },
  { type: 'mediaPlaylists', label: 'Playlists' },
  { type: 'mediaDiscovery', label: 'Media Discovery' },
  { type: 'mediaSearch', label: 'Music Search' },
  { type: 'phone', label: 'Phone & Contacts' },
  { type: 'phoneContacts', label: 'Phone Contacts' },
  { type: 'phoneDialPad', label: 'Phone Dial Pad' },
  { type: 'phoneMessaging', label: 'Phone Messaging' },
  { type: 'navFavorites', label: 'Navigation Favorites' },
  { type: 'navDestination', label: 'Navigation Destination' },
  { type: 'navTripEstimate', label: 'Trip Estimate' },
  { type: 'navTripSummary', label: 'Trip Summary' },
];

export function getDefaultQuickAccessDimensions(type: ComponentType): { width: number; height: number } {
  switch (type) {
    case 'media':
      return { width: 540, height: 320 };
    case 'climate':
      return { width: 480, height: 260 };
    case 'climateTemp':
      return { width: 280, height: 360 };
    case 'climateVent':
      return { width: 440, height: 260 };
    case 'climateSeats':
      return { width: 400, height: 220 };
    case 'vehicleExplodedView':
      return { width: 580, height: 360 };
    case 'vehicleStatusCallout':
      return { width: 340, height: 180 };
    case 'speed':
      return { width: 260, height: 180 };
    case 'gear':
      return { width: 220, height: 150 };
    case 'battery':
      return { width: 340, height: 140 };
    case 'driveMode':
      return { width: 340, height: 170 };
    case 'tirePressure':
      return { width: 380, height: 210 };
    case 'miniNav':
      return { width: 340, height: 460 };
    case 'overheadVisualization':
      return { width: 620, height: 380 };
    case 'nowPlaying':
      return { width: 420, height: 180 };
    case 'mediaPlaylists':
      return { width: 480, height: 360 };
    case 'mediaDiscovery':
      return { width: 560, height: 260 };
    case 'mediaSearch':
      return { width: 480, height: 220 };
    case 'phone':
      return { width: 380, height: 260 };
    case 'phoneContacts':
      return { width: 420, height: 420 };
    case 'phoneDialPad':
      return { width: 360, height: 420 };
    case 'phoneMessaging':
      return { width: 440, height: 420 };
    case 'navFavorites':
      return { width: 380, height: 260 };
    case 'navDestination':
      return { width: 380, height: 240 };
    case 'navTripEstimate':
      return { width: 380, height: 200 };
    case 'navTripSummary':
      return { width: 380, height: 160 };
    default:
      return { width: 400, height: 260 };
  }
}

export function getDefaultQuickAccessStaticProps(type: ComponentType): Record<string, string> {
  switch (type) {
    case 'media':
      return {
        label: 'Music Media Player',
        color: '#ec4899',
        showPlaylist: 'true',
      };
    case 'climate':
      return {
        label: 'Climate Control',
        color: '#f97316',
      };
    case 'climateTemp':
      return {
        label: 'Temperature Control',
        color: '#f97316',
      };
    case 'climateVent':
      return {
        label: 'Air Vents',
        color: '#06b6d4',
      };
    case 'climateSeats':
      return {
        label: 'Heated & Cooled Seats',
        color: '#ef4444',
      };
    case 'vehicleExplodedView':
      return {
        label: 'Vehicle Controls',
        color: '#38bdf8',
        displayMode: 'exploded',
      };
    case 'battery':
      return {
        label: 'Battery Indicator',
        color: '#22c55e',
        icon: 'battery',
      };
    case 'gear':
      return {
        label: 'Gear Indicator',
        color: '#f8fafc',
      };
    case 'speed':
      return {
        label: 'Speedometer',
        unit: 'mph',
        color: '#38bdf8',
        displayStyle: 'numeric',
        maxSpeed: '140',
      };
    case 'driveMode':
      return {
        label: 'Drive Mode',
        color: '#06b6d4',
      };
    case 'tirePressure':
      return {
        label: 'Tire Pressure',
        color: '#eab308',
      };
    default:
      return {
        label: DEFAULT_COMPONENT_LABELS[type] || String(type),
        color: COMPONENT_META[type]?.defaultColor || '#38bdf8',
      };
  }
}

export function getDefaultQuickAccessBindings(type: ComponentType): Binding[] {
  switch (type) {
    case 'battery':
      return [
        {
          id: 'qa-bind-bat-1',
          stateField: 'batteryPercent',
          condition: '<',
          value: 15,
          targetProp: 'color',
          targetValue: '#ef4444',
        },
        {
          id: 'qa-bind-bat-2',
          stateField: 'batteryPercent',
          condition: '>=',
          value: 0,
          targetProp: 'text',
          targetValue: '{batteryPercent}%',
        },
      ];
    case 'gear':
      return [
        {
          id: 'qa-bind-gear-1',
          stateField: 'speed',
          condition: '>=',
          value: 0,
          targetProp: 'text',
          targetValue: '{gear}',
        },
      ];
    case 'speed':
      return [
        {
          id: 'qa-bind-spd-1',
          stateField: 'speed',
          condition: '>=',
          value: 0,
          targetProp: 'text',
          targetValue: '{speed}',
        },
      ];
    default:
      return [];
  }
}
