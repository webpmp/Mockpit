import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import {
  AlertTriangle,
  Battery,
  BatteryWarning,
  Bell,
  Check,
  CircleDot,
  Clock,
  Compass,
  DoorOpen,
  Eye,
  Fan,
  Flag,
  Gauge,
  Grid,
  Home,
  Info,
  Key,
  Layers,
  Lock,
  MapPin,
  MessageSquare,
  Music,
  Navigation,
  Phone,
  Play,
  Plus,
  Reply,
  Route,
  Search,
  Send,
  ShieldAlert,
  Sliders,
  Star,
  Sun,
  Thermometer,
  Trash2,
  User,
  Users,
  Wrench,
  X,
  XCircle,
  Zap,
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MusicMediaPlayer } from './MusicMediaPlayer';
import { NowPlayingWidget } from './NowPlayingWidget';
import { MediaPlaylistsWidget } from './MediaPlaylistsWidget';
import { MediaDiscoveryWidget } from './MediaDiscoveryWidget';
import { MusicSearchWidget } from './MusicSearchWidget';
import { MockpitInput } from './MockpitInput';
import { AddressGeocodeInput } from './navigation/AddressGeocodeInput';
import { OverheadDrivingVisualization } from './OverheadDrivingVisualization';
import { PhoneContactsWidget } from './phone/PhoneContactsWidget';
import { PhoneDialPadWidget } from './phone/PhoneDialPadWidget';
import { PhoneMessagingWidget } from './phone/PhoneMessagingWidget';
import { ContactAvatar } from './ContactAvatar';
import { COMPONENT_META } from '../config/componentMeta';
import { getAvatarColor, getInitials } from '../utils/avatarHash';
import { ClimateVentWidget } from './climate/ClimateVentWidget';
import { ClimateTempWidget } from './climate/ClimateTempWidget';
import { ClimateSeatsWidget } from './climate/ClimateSeatsWidget';
import { CompactClimateWidget } from './climate/CompactClimateWidget';
import { VehicleExplodedViewWidget } from './vehicle/VehicleExplodedViewWidget';
import { VehicleStatusCalloutWidget } from './vehicle/VehicleStatusCalloutWidget';
import { SendToServiceWidget } from './vehicle/SendToServiceWidget';
import { DriveModeWidget } from './vehicle/DriveModeWidget';
import { GearWidget } from './vehicle/GearWidget';
import { SpeedometerWidget } from './vehicle/SpeedometerWidget';
import { MiniNav } from './navigation/MiniNav';
import { getResolvedProps } from '../lib/bindingEvaluator';
import { ComponentInstance, ComponentType, DriveModeState, VehicleState, TripStop } from '../types';
import { calculateTripEstimate, calculateStopLegs, haversineMiles } from '../utils/tripCalculations';
import { searchNearbyPOIs } from '../utils/poiSearch';
import { useMockpitStore } from '../store/useMockpitStore';
import { GeocodeResult } from '../utils/geocoding';
import { abbreviateState, formatWaypointName, recomputeChainNames } from '../utils/usStates';

interface ComponentRendererProps {
  component: ComponentInstance;
  vehicleState: VehicleState;
  isSelected?: boolean;
  isPresentation?: boolean;
  onMinimize?: () => void;
}

export const DEFAULT_COMPONENT_LABELS: Record<string, string> = {
  battery: 'Battery Indicator',
  gear: 'Gear Indicator',
  speed: 'Speedometer',
  warning: 'Warning Alert Overlay',
  map: 'Navigation Map',
  media: 'Music Media Player',
  nowPlaying: 'Now Playing Card',
  mediaPlaylists: 'Playlists',
  mediaDiscovery: 'Discovery',
  mediaSearch: 'Music Search',
  climate: 'Climate Control',
  phone: 'Phone & Contacts',
  driveMode: 'Drive Mode Selector',
  tirePressure: 'Tire Pressure Monitor',
  navHome: 'Favorites & Recents',
  navFavorites: 'Favorites & Recents',
  navDestination: 'Trip Planner',
  navSearch: 'Navigation Search',
  navTripEstimate: 'Trip Planner',
  navTripSummary: 'Trip Summary',
  overheadVisualization: 'Overhead Driving Visualization',
  miniNav: 'Mini Nav',
  phoneContacts: 'Contacts',
  phoneDialPad: 'Dial Pad',
  phoneMessaging: 'Messaging',
  climateVent: 'Vent Dashboard',
  climateTemp: 'Temperature Slider',
  climateSeats: 'Seat Climate (Heat/Cool)',
  vehicleExplodedView: 'Exploded View Chassis',
  vehicleStatusCallout: 'Status Callout',
  sendToServiceCenter: 'Send Vehicle Diagnostics',
};

export const getAlphaColor = (color: string, hexAlpha: string, mixPercent: number = 25): string => {
  if (!color) return 'var(--color-primary)';
  if (color.startsWith('var(')) {
    return `color-mix(in srgb, ${color} ${mixPercent}%, transparent)`;
  }
  return `${color}${hexAlpha}`;
};

export const getComponentDefaultIcon = (type: string, customColor: string, iconKey?: string) => {
  const className = 'w-5 h-5 shrink-0';
  if (type === 'warning' || iconKey) {
    return renderNotificationIcon(iconKey || 'alert-triangle', className);
  }
  const IconComp = COMPONENT_META[type as ComponentType]?.icon || Gauge;
  return <IconComp className={className} style={{ color: customColor }} />;
};

interface ComponentHeaderProps {
  type: string;
  label: string;
  customColor: string;
  iconKey?: string;
  rightElement?: React.ReactNode;
  className?: string;
  hideIcon?: boolean;
  hideDivider?: boolean;
}

export const ComponentHeader: React.FC<ComponentHeaderProps> = ({
  type,
  label,
  customColor,
  iconKey,
  rightElement,
  className = '',
  hideIcon = false,
  hideDivider = false,
}) => {
  const isNotification = type === 'warning';

  if (isNotification) {
    return (
      <div
        className={`flex items-center justify-end absolute top-3 right-3 z-20 select-none ${className}`}
      >
        {rightElement && <div className="shrink-0 flex items-center gap-1.5">{rightElement}</div>}
      </div>
    );
  }

  const baseHeaderClass = hideDivider
    ? 'flex items-center justify-between text-[11px] font-bold tracking-wider text-slate-400 uppercase z-10 shrink-0 select-none leading-none'
    : 'flex items-center justify-between h-9 min-h-[36px] max-h-[36px] text-xs font-bold tracking-wider text-slate-400 uppercase z-10 shrink-0 select-none pb-1 border-b border-slate-800/60';

  return (
    <div className={`${baseHeaderClass} ${className}`}>
      <span className="flex items-center gap-1.5 min-w-0 truncate">
        {!hideIcon && getComponentDefaultIcon(type, customColor, iconKey)}
        <span className="truncate">{label}</span>
      </span>
      {rightElement && <div className="shrink-0 flex items-center gap-1.5 ml-2">{rightElement}</div>}
    </div>
  );
};

const MessageToastCard: React.FC<{
  component: ComponentInstance;
  headerLabel: string;
  customColor: string;
  iconKey: string;
  message: string;
  title?: string;
  avatarName?: string;
  threadId: string;
  baseOpacity: string;
  isVisible: boolean;
  styleOpacity: number;
  onMinimize?: () => void;
}> = ({
  component,
  headerLabel,
  customColor,
  iconKey,
  message,
  title,
  avatarName,
  threadId,
  baseOpacity,
  isVisible,
  styleOpacity,
  onMinimize,
}) => {
  const [isReplying, setIsReplying] = React.useState(false);
  const [replyText, setReplyText] = React.useState('');

  const sendUserMessage = useMockpitStore((s) => s.sendUserMessage);
  const markThreadAsRead = useMockpitStore((s) => s.markThreadAsRead);
  const closeKeyboard = useMockpitStore((s) => s.closeKeyboard);
  const clearTransientNotification = useMockpitStore((s) => s.clearTransientNotification);

  const dismissToast = () => {
    if (onMinimize) {
      onMinimize();
    } else {
      clearTransientNotification(component.id);
    }
  };

  const handleCardTap = () => {
    if (isReplying) return;
    setIsReplying(true);
  };

  const handleSendReply = (text: string) => {
    const msgText = text.trim();
    if (!msgText || !threadId) return;

    sendUserMessage(threadId, msgText);
    markThreadAsRead(threadId);

    const activeInput = useMockpitStore.getState().activeInputState;
    if (activeInput) {
      useMockpitStore.setState({ activeInputState: { ...activeInput, onCancel: undefined } });
    }

    closeKeyboard();
    dismissToast();
  };

  const handleCancelReply = () => {
    markThreadAsRead(threadId);
    closeKeyboard();
    dismissToast();
  };

  const handleToggleReply = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isReplying) {
      handleCancelReply();
    } else {
      setIsReplying(true);
    }
  };

  const handleDismissClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isReplying) {
      handleCancelReply();
    } else {
      dismissToast();
    }
  };

  return (
    <div
      className={`w-full rounded-2xl bg-slate-950/95 border-2 p-3 flex flex-col justify-between shadow-2xl backdrop-blur-xl transition-all duration-300 relative overflow-hidden ${baseOpacity}`}
      style={{
        borderColor: customColor,
        boxShadow: isVisible ? `0 0 25px ${getAlphaColor(customColor, '40', 25)}` : undefined,
        opacity: styleOpacity,
      }}
    >
      <ComponentHeader
        type="warning"
        label={headerLabel}
        customColor={customColor}
        iconKey={iconKey}
        rightElement={
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={handleToggleReply}
              className={`p-1 rounded bg-slate-900/90 border transition-colors cursor-pointer shrink-0 ${
                isReplying
                  ? 'border-sky-400 text-sky-400 bg-sky-950/80'
                  : 'border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
              title="Quick Reply"
            >
              <Reply className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleDismissClick}
              className="p-1 rounded bg-slate-900/90 border border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
              title="Dismiss Alert (X)"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        }
      />

      <div
        onClick={handleCardTap}
        className={`flex items-center gap-3 min-w-0 w-full pr-16 my-auto ${
          !isReplying ? 'cursor-pointer hover:opacity-90' : ''
        }`}
      >
        {avatarName ? (
          <ContactAvatar
            name={avatarName}
            className="w-9 h-9 border border-slate-700/80 shadow-md shrink-0"
            fontSizeClassName="text-xs font-extrabold"
          />
        ) : (
          <div
            className="p-2 rounded-xl shrink-0 flex items-center justify-center border"
            style={{
              backgroundColor: getAlphaColor(customColor, '25', 15),
              borderColor: getAlphaColor(customColor, '50', 30),
              color: customColor,
            }}
          >
            <MessageSquare className="w-4 h-4" />
          </div>
        )}

        <div className="flex flex-col justify-center min-w-0 flex-1">
          {title && <span className="text-[11px] font-bold text-slate-400 font-mono">{title}</span>}
          <p className="text-xs text-slate-100 font-medium leading-snug line-clamp-2 break-words mt-0.5">
            {message}
          </p>
        </div>
      </div>

      {isReplying && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1.5 pt-2 border-t border-slate-800/80 mt-1 shrink-0 animate-in fade-in slide-in-from-top-1"
        >
          <MockpitInput
            value={replyText}
            onChange={setReplyText}
            onSubmit={(val) => handleSendReply(val)}
            onCancel={handleCancelReply}
            placeholder={`Reply to ${title || avatarName || 'message'}...`}
            componentId={component.id}
            wrapperClassName="flex-1 min-w-0"
            autoFocus
          />
          <button
            onClick={() => handleSendReply(replyText)}
            disabled={!replyText.trim()}
            className={`p-2 rounded-xl transition-all shrink-0 cursor-pointer ${
              replyText.trim()
                ? 'bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold shadow-md'
                : 'bg-slate-800 text-slate-600 border border-slate-700/50 cursor-not-allowed'
            }`}
            title="Send reply"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

export const renderNotificationIcon = (
  iconName: string = 'alert-triangle',
  className: string = 'w-6 h-6'
) => {
  const norm = iconName.toLowerCase().trim();
  switch (norm) {
    case 'door-open':
    case 'door':
      return <AlertTriangle className={className} />;
    case 'battery-warning':
    case 'battery':
      return <Battery className={className} />;
    case 'thermometer':
    case 'temp':
    case 'temperature':
      return <Thermometer className={className} />;
    case 'tire':
    case 'tpms':
    case 'circle-dot':
      return <CircleDot className={className} />;
    case 'zap':
    case 'charging':
      return <Zap className={className} />;
    case 'gauge':
    case 'speed':
      return <Gauge className={className} />;
    case 'bell':
      return <Bell className={className} />;
    case 'shield-alert':
    case 'shield':
      return <ShieldAlert className={className} />;
    case 'wrench':
    case 'service':
      return <Wrench className={className} />;
    case 'lock':
      return <Lock className={className} />;
    case 'key':
      return <Key className={className} />;
    case 'info':
      return <Info className={className} />;
    case 'fan':
      return <Fan className={className} />;
    case 'message-square':
    case 'message':
    case 'text':
    case 'chat':
    case 'sms':
      return <MessageSquare className={className} />;
    case 'alert-triangle':
    default:
      return <AlertTriangle className={className} />;
  }
};

const customPinIcon = L.divIcon({
  className: 'custom-map-pin',
  html: `<div style="background-color: var(--color-primary, #38bdf8); width: 14px; height: 14px; border-radius: 50%; border: 3px solid #0f172a; box-shadow: 0 0 10px var(--color-primary, #38bdf8);"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const MapResizer: React.FC = () => {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    if (!container) return;

    const observer = new ResizeObserver(() => {
      map.invalidateSize();
    });

    observer.observe(container);

    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 100);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [map]);

  return null;
};

const NavHomeWidget: React.FC<{
  component: ComponentInstance;
  resolved: Record<string, any>;
  isSelected?: boolean;
  customColor: string;
  baseOpacity: string;
  styleOpacity?: number;
}> = ({ component, resolved, isSelected, customColor, baseOpacity, styleOpacity }) => {
  const initialAddress = resolved.address || component.staticProps?.address || 'San Jose, CA';
  const [address, setAddress] = React.useState(initialAddress);
  const [homeLat, setHomeLat] = React.useState(resolved.lat || component.staticProps?.lat || '37.3861');
  const [homeLng, setHomeLng] = React.useState(resolved.lng || component.staticProps?.lng || '-122.0839');
  const headerLabel = resolved.label || component.staticProps?.label || DEFAULT_COMPONENT_LABELS.navHome;
  const startTripGuidance = useMockpitStore((s) => s.startTripGuidance);

  return (
    <div
      id={`component-${component.type}`}
      data-component-type="navHome"
      className={`w-full h-full rounded-2xl bg-slate-900/90 border border-slate-800 p-3.5 flex flex-col justify-between shadow-lg backdrop-blur-md transition-all duration-300 ${baseOpacity}`}
      style={{ borderColor: isSelected ? customColor : undefined, opacity: styleOpacity }}
    >
      <ComponentHeader
        type="navHome"
        label={headerLabel}
        customColor={customColor}
        rightElement={
          <span className="text-[0.5625rem] font-mono px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700/60 font-semibold">
            SAVED
          </span>
        }
      />

      <div className="flex-1 min-h-0 my-1.5 flex flex-col justify-center">
        <AddressGeocodeInput
          value={address}
          onChange={setAddress}
          onResolved={(lat, lng, displayName) => {
            setHomeLat(lat.toString());
            setHomeLng(lng.toString());
            if (displayName) setAddress(displayName);
          }}
          placeholder="Enter Home city or address..."
          componentId={component.id}
          keyboardSlideDirection={component.staticProps?.keyboardSlideDirection as any}
          icon={<MapPin className="w-3.5 h-3.5 text-slate-400" />}
        />
      </div>

      <button
        onClick={() => {
          startTripGuidance({
            destinationName: address || 'Home',
            destLat: Number(homeLat) || 37.3861,
            destLng: Number(homeLng) || -122.0839,
            destGeocoded: true,
            stops: [],
          });
        }}
        className="w-full py-1.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold font-mono transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700"
      >
        <Navigation className="w-3.5 h-3.5 text-slate-400" /> Navigate Home
      </button>
    </div>
  );
};

const NavFavoritesWidget: React.FC<{
  component: ComponentInstance;
  resolved: Record<string, any>;
  isSelected?: boolean;
  customColor: string;
  baseOpacity: string;
  styleOpacity?: number;
}> = ({ component, resolved, isSelected, customColor, baseOpacity, styleOpacity }) => {
  const favorites = useMockpitStore((s) => s.favorites) || [];
  const recents = useMockpitStore((s) => s.recents) || [];
  const addFavorite = useMockpitStore((s) => s.addFavorite);
  const removeFavorite = useMockpitStore((s) => s.removeFavorite);
  const promoteRecentToFavorite = useMockpitStore((s) => s.promoteRecentToFavorite);
  const startTripGuidance = useMockpitStore((s) => s.startTripGuidance);
  const updateComponentSize = useMockpitStore((s) => s.updateComponentSize);

  const [isAdding, setIsAdding] = React.useState(false);
  const [newLabel, setNewLabel] = React.useState('');
  const [newAddress, setNewAddress] = React.useState('');
  const [newLat, setNewLat] = React.useState<number | null>(null);
  const [newLng, setNewLng] = React.useState<number | null>(null);

  const containerRef = React.useRef<HTMLDivElement>(null);
  const headerLabel = resolved.label || component.staticProps?.label || DEFAULT_COMPONENT_LABELS.navFavorites;

  // Dynamic height adjustment when adding form opens/closes or list length changes
  React.useEffect(() => {
    const totalCount = favorites.length + recents.length;
    const baseHeight = 220;
    const itemHeight = 36;
    const addFormExtra = isAdding ? 110 : 0;
    const targetHeight = Math.min(Math.max(baseHeight + Math.min(totalCount, 6) * itemHeight + addFormExtra, 260), 600);
    if (Math.abs(component.height - targetHeight) > 20) {
      updateComponentSize(component.id, component.width, targetHeight);
    }
  }, [favorites.length, recents.length, isAdding, component.id, component.width, component.height, updateComponentSize]);

  const handleSaveFavorite = () => {
    if (!newAddress.trim() || newLat === null || newLng === null) return;
    addFavorite({
      label: newLabel.trim() || newAddress.split(',')[0] || 'Favorite',
      address: newAddress,
      lat: newLat,
      lng: newLng,
      geocoded: true,
    });
    setNewLabel('');
    setNewAddress('');
    setNewLat(null);
    setNewLng(null);
    setIsAdding(false);
  };

  return (
    <div
      ref={containerRef}
      id={`component-${component.type}`}
      data-component-type="navFavorites"
      className={`w-full h-full rounded-2xl bg-slate-900/90 border border-slate-800 p-3.5 flex flex-col justify-between shadow-lg backdrop-blur-md transition-all duration-300 ${baseOpacity}`}
      style={{ borderColor: isSelected ? customColor : undefined, opacity: styleOpacity }}
    >
      <ComponentHeader
        type="navFavorites"
        label={headerLabel}
        customColor={customColor}
      />

      <div className="flex-1 min-h-0 my-2 space-y-2 overflow-y-auto pr-1 custom-scrollbar">
        {/* Favorites Section */}
        <div className="space-y-1">
          <span className="text-[0.5625rem] font-mono text-slate-500 uppercase tracking-wider font-semibold block px-1">
            SAVED PLACES
          </span>
          {favorites.length === 0 ? (
            <div className="text-[0.6875rem] text-slate-500 font-mono italic px-2 py-1">
              No saved favorite locations.
            </div>
          ) : (
            favorites.map((fav) => (
              <div
                key={fav.id}
                onClick={() => {
                  startTripGuidance({
                    destinationName: fav.label || fav.address,
                    destLat: fav.lat,
                    destLng: fav.lng,
                    destGeocoded: fav.geocoded !== false,
                    stops: [],
                  });
                }}
                className="group p-2 rounded-xl bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/80 flex items-center justify-between cursor-pointer transition-all min-h-[44px]"
              >
                <div className="min-w-0 pr-2 flex items-center gap-2">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[0.75rem] font-bold text-slate-200 truncate">{fav.label}</div>
                    <div className="text-[0.625rem] text-slate-400 truncate">{fav.address}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFavorite(fav.id);
                    }}
                    className="p-1.5 rounded-lg hover:bg-slate-700/80 text-slate-500 hover:text-rose-400 transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center cursor-pointer"
                    title="Delete Favorite"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Inline Add Favorite Form */}
        {isAdding ? (
          <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 space-y-2">
            <div className="text-[0.625rem] font-mono text-slate-300 font-bold uppercase">Add New Favorite</div>
            <MockpitInput
              value={newLabel}
              onChange={setNewLabel}
              placeholder="Label (e.g. Gym, Mom's House)..."
              componentId={component.id}
              keyboardSlideDirection={component.staticProps?.keyboardSlideDirection as any}
              className="min-h-[36px] text-xs"
            />
            <AddressGeocodeInput
              value={newAddress}
              onChange={setNewAddress}
              onResolved={(lat, lng, displayName) => {
                setNewLat(lat);
                setNewLng(lng);
                if (displayName) setNewAddress(displayName);
              }}
              placeholder="Enter city or landmark..."
              componentId={component.id}
              keyboardSlideDirection={component.staticProps?.keyboardSlideDirection as any}
              icon={<MapPin className="w-3.5 h-3.5 text-slate-400" />}
            />
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => {
                  setIsAdding(false);
                  setNewLabel('');
                  setNewAddress('');
                  setNewLat(null);
                  setNewLng(null);
                }}
                className="flex-1 py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs font-mono font-bold transition-colors cursor-pointer border border-slate-700 min-h-[36px]"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveFavorite}
                disabled={!newAddress.trim() || newLat === null}
                className="flex-1 py-1.5 px-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-mono font-bold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed min-h-[36px]"
              >
                Save Favorite
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="w-full py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700 min-h-[44px]"
          >
            <Plus className="w-4 h-4 text-slate-400" /> Add Favorite
          </button>
        )}

        {/* Recents Section */}
        {recents.length > 0 && (
          <div className="space-y-1 pt-2 border-t border-slate-800/80">
            <span className="text-[0.5625rem] font-mono text-slate-500 uppercase tracking-wider font-semibold block px-1">
              RECENT DESTINATIONS
            </span>
            {recents.map((recent) => (
              <div
                key={recent.id}
                onClick={() => {
                  startTripGuidance({
                    destinationName: recent.label || recent.address,
                    destLat: recent.lat,
                    destLng: recent.lng,
                    destGeocoded: recent.geocoded !== false,
                    stops: [],
                  });
                }}
                className="group p-2 rounded-xl bg-slate-950/40 hover:bg-slate-800/60 border border-slate-800/60 flex items-center justify-between cursor-pointer transition-all min-h-[44px]"
              >
                <div className="min-w-0 pr-2 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[0.6875rem] font-bold text-slate-300 truncate">{recent.label}</div>
                    <div className="text-[0.5625rem] text-slate-500 truncate">{recent.address}</div>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    promoteRecentToFavorite(recent.id, recent.label);
                  }}
                  className="p-1.5 rounded-lg hover:bg-slate-700/80 text-slate-400 hover:text-amber-300 transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center cursor-pointer"
                  title="Save as Favorite"
                >
                  <Star className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const NavDestinationWidget: React.FC<{
  component: ComponentInstance;
  resolved: Record<string, any>;
  vehicleState: VehicleState;
  isSelected?: boolean;
  customColor: string;
  baseOpacity: string;
  styleOpacity?: number;
}> = ({ component, resolved, vehicleState, isSelected, customColor, baseOpacity, styleOpacity }) => {
  const initialPrimaryDest = resolved.destination || component.staticProps?.destination || 'Yosemite National Park Valley';
  const initialDestLat = resolved.destLat || component.staticProps?.destLat || resolved.lat || component.staticProps?.lat || '37.7456';
  const initialDestLng = resolved.destLng || component.staticProps?.destLng || resolved.lng || component.staticProps?.lng || '-119.5936';

  const [primaryDest, setPrimaryDest] = React.useState(initialPrimaryDest);
  const [destLat, setDestLat] = React.useState(initialDestLat);
  const [destLng, setDestLng] = React.useState(initialDestLng);
  const [destState, setDestState] = React.useState<string | undefined>(
    resolved.destState || component.staticProps?.destState
  );
  const [showCancelConfirm, setShowCancelConfirm] = React.useState(false);

  const activeTrip = useMockpitStore((s) => s.activeTrip);
  const startTripGuidance = useMockpitStore((s) => s.startTripGuidance);
  const cancelTripGuidance = useMockpitStore((s) => s.cancelTripGuidance);
  const updateComponentSize = useMockpitStore((s) => s.updateComponentSize);

  // Parse waypoints / stops for draft mode
  const parseInitialStops = (): TripStop[] => {
    if (component.staticProps?.tripStops) {
      try {
        const parsed = JSON.parse(component.staticProps.tripStops);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        // fallback
      }
    }
    if (component.staticProps?.waypoints) {
      try {
        const parsed = JSON.parse(component.staticProps.waypoints);
        if (Array.isArray(parsed)) {
          return parsed.map((wp: string, i: number) => ({
            id: `stop-${i + 1}`,
            name: typeof wp === 'string' ? wp : (wp as any).name || `Stop ${i + 1}`,
            lat: (wp as any).lat || (i === 0 ? '37.3382' : '37.5512'),
            lng: (wp as any).lng || (i === 0 ? '-120.4829' : '-119.8523'),
          }));
        }
      } catch (e) {
        // fallback
      }
    }
    return [
      { id: 'stop-1', name: 'Merced, CA', lat: '37.3022', lng: '-120.4830' },
      { id: 'stop-2', name: 'Mariposa, CA', lat: '37.4849', lng: '-119.9663' },
    ];
  };

  const [draftStops, setDraftStops] = React.useState<TripStop[]>(parseInitialStops);
  const headerLabel = resolved.label || component.staticProps?.label || DEFAULT_COMPONENT_LABELS.navDestination;

  // Single source of truth: when activeTrip is active, read destination and stops directly from activeTrip
  const currentDestName = activeTrip ? activeTrip.destinationName : primaryDest;
  const currentStops = activeTrip ? activeTrip.stops : draftStops;

  const [destGeocoded, setDestGeocoded] = React.useState<boolean | undefined>(undefined);

  // Live estimate calculation for Active Mode & Stop Legs
  const originLat = typeof vehicleState.mapLat === 'number' ? vehicleState.mapLat : 37.7749;
  const originLng = typeof vehicleState.mapLng === 'number' ? vehicleState.mapLng : -122.4194;
  const consumptionRate = Number(resolved.consumptionRate || component.staticProps?.consumptionRate) || 0.32;

  const estimate = activeTrip
    ? calculateTripEstimate(originLat, originLng, activeTrip, consumptionRate, vehicleState.batteryPercent)
    : null;

  const stopLegs = calculateStopLegs(originLat, originLng, currentStops, 45, 1.3);

  // Unified auto-resize effect for stops and activeTrip metrics
  const CANVAS_HEIGHT = 1080;
  const CANVAS_EDGE_MARGIN = 100; // 84px Dock height + 16px visual gap
  const MIN_HEIGHT = 240; // matches DEFAULT_SIZES.navDestination.height

  const cardRef = React.useRef<HTMLDivElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const innerContentRef = React.useRef<HTMLDivElement>(null);

  React.useLayoutEffect(() => {
    const cardEl = cardRef.current;
    const contentEl = contentRef.current;
    if (!cardEl || !contentEl) return;

    // Measure the actual chrome (header + footer + margins) rather than hardcoding it,
    // so this stays correct if the header/footer ever change independently.
    const chromeHeight = cardEl.offsetHeight - contentEl.clientHeight;
    const naturalContentHeight = innerContentRef.current?.offsetHeight ?? contentEl.scrollHeight;
    const canvasLimit = CANVAS_HEIGHT - CANVAS_EDGE_MARGIN - (component.y ?? 0);

    const desiredHeight = Math.min(
      Math.max(chromeHeight + naturalContentHeight, MIN_HEIGHT),
      Math.max(canvasLimit, MIN_HEIGHT)
    );

    if (Math.abs(desiredHeight - component.height) > 0.5) {
      updateComponentSize(component.id, component.width, desiredHeight);
    }
  }, [
    currentStops.length,
    !!activeTrip,
    estimate?.isUnresolved,
    component.width,
    component.height,
    component.id,
    component.y,
    updateComponentSize,
  ]);

  const handleUpdateDestName = (name: string) => {
    if (activeTrip) {
      startTripGuidance({
        ...activeTrip,
        destinationName: name,
      });
    } else {
      setPrimaryDest(name);
    }
  };

  const handleUpdateDestCoords = (
    lat: number,
    lng: number,
    displayName?: string,
    geocode?: GeocodeResult
  ) => {
    setDestGeocoded(true);
    const destCity = geocode?.cityName || (displayName ? displayName.split(',')[0].trim() : primaryDest);
    const state = geocode?.state;
    const baseStops = activeTrip ? activeTrip.stops : draftStops;

    const { updatedStops, destName } = recomputeChainNames(
      baseStops,
      destCity,
      state
    );

    if (activeTrip) {
      startTripGuidance({
        ...activeTrip,
        destinationName: destName,
        destLat: lat,
        destLng: lng,
        destState: state,
        destGeocoded: true,
        stops: updatedStops,
      });
    } else {
      setDestLat(lat.toString());
      setDestLng(lng.toString());
      setDestState(state);
      setPrimaryDest(destName);
      setDraftStops(updatedStops);
    }
  };

  const handleDestUnresolved = () => {
    setDestGeocoded(false);
    if (activeTrip) {
      startTripGuidance({
        ...activeTrip,
        destGeocoded: false,
      });
    }
  };

  const handleUpdateStopName = (index: number, name: string) => {
    if (activeTrip) {
      const updated = [...activeTrip.stops];
      updated[index] = { ...updated[index], name };
      startTripGuidance({
        ...activeTrip,
        stops: updated,
      });
    } else {
      const updated = [...draftStops];
      updated[index] = { ...updated[index], name };
      setDraftStops(updated);
    }
  };

  const handleUpdateStopCoords = (
    index: number,
    lat: number,
    lng: number,
    displayName?: string,
    geocode?: GeocodeResult
  ) => {
    const cityName = geocode?.cityName || displayName || '';
    const state = geocode?.state;
    const baseStops = activeTrip ? activeTrip.stops : draftStops;
    const updatedRaw = [...baseStops];
    updatedRaw[index] = {
      ...updatedRaw[index],
      lat: lat.toString(),
      lng: lng.toString(),
      name: cityName,
      state,
      geocoded: true,
    };

    const { updatedStops, destName } = recomputeChainNames(
      updatedRaw,
      activeTrip ? activeTrip.destinationName : primaryDest,
      activeTrip ? activeTrip.destState : destState
    );

    if (activeTrip) {
      startTripGuidance({
        ...activeTrip,
        stops: updatedStops,
        destinationName: destName,
      });
    } else {
      setDraftStops(updatedStops);
      setPrimaryDest(destName);
    }
  };

  const handleStopUnresolved = (index: number) => {
    if (activeTrip) {
      const updated = [...activeTrip.stops];
      updated[index] = {
        ...updated[index],
        geocoded: false,
      };
      startTripGuidance({
        ...activeTrip,
        stops: updated,
      });
    } else {
      const updated = [...draftStops];
      updated[index] = {
        ...updated[index],
        geocoded: false,
      };
      setDraftStops(updated);
    }
  };

  const handleAddStop = () => {
    const newStop: TripStop = {
      id: `stop-${Date.now()}`,
      name: `Stop ${currentStops.length + 1}`,
      lat: '37.5000',
      lng: '-120.0000',
    };
    if (activeTrip) {
      startTripGuidance({
        ...activeTrip,
        stops: [...activeTrip.stops, newStop],
      });
    } else {
      setDraftStops([...draftStops, newStop]);
    }
  };

  const handleRemoveStop = (index: number) => {
    const baseStops = activeTrip ? activeTrip.stops : draftStops;
    const nextRawStops = baseStops.filter((_, i) => i !== index);
    const currentDest = activeTrip ? activeTrip.destinationName : primaryDest;
    const currentDState = activeTrip ? activeTrip.destState : destState;

    const { updatedStops, destName } = recomputeChainNames(
      nextRawStops,
      currentDest,
      currentDState
    );

    if (activeTrip) {
      startTripGuidance({
        ...activeTrip,
        stops: updatedStops,
        destinationName: destName,
      });
    } else {
      setDraftStops(updatedStops);
      setPrimaryDest(destName);
    }
  };

  return (
    <div
      ref={cardRef}
      id={`component-${component.type}`}
      data-component-type="navDestination"
      className={`w-full h-full rounded-2xl bg-slate-900/90 border border-slate-800 p-3.5 flex flex-col justify-between shadow-lg backdrop-blur-md transition-all duration-300 ${baseOpacity}`}
      style={{ borderColor: isSelected ? customColor : undefined, opacity: styleOpacity }}
    >
      <ComponentHeader
        type="navDestination"
        label={headerLabel}
        customColor={customColor}
      />

      <div ref={contentRef} className="flex-1 min-h-0 my-1.5 overflow-y-auto pr-1 custom-scrollbar">
        <div ref={innerContentRef} className="space-y-2">
          {/* Active Mode: Live Trip Estimate 2x2 Grid */}
          {activeTrip && estimate && (
            estimate.isUnresolved ? (
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2 text-amber-300">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                <span className="text-[0.6875rem] font-mono font-medium leading-tight">
                  {estimate.unresolvedMessage}
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-1.5 bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800/60 flex flex-col justify-between">
                  <span className="text-[0.5625rem] text-slate-400 block font-mono uppercase font-semibold leading-tight mb-0.5">
                    Distance
                  </span>
                  <span className="text-xs font-bold text-slate-100 font-mono leading-tight">
                    {estimate.formattedDistance}
                  </span>
                </div>

                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800/60 flex flex-col justify-between">
                  <span className="text-[0.5625rem] text-slate-400 block font-mono uppercase font-semibold leading-tight mb-0.5">
                    Estimated Time
                  </span>
                  <span className="text-xs font-bold text-slate-100 font-mono leading-tight">
                    {estimate.formattedDuration}
                  </span>
                </div>

                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800/60 flex flex-col justify-between">
                  <span className="text-[0.5625rem] text-slate-400 block font-mono uppercase font-semibold leading-tight mb-0.5">
                    Energy Required
                  </span>
                  <span className="text-[0.6875rem] font-bold text-slate-100 font-mono leading-tight">
                    {estimate.formattedEnergy}
                  </span>
                </div>

                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800/60 flex flex-col justify-between">
                  <span className="text-[0.5625rem] text-slate-400 block font-mono uppercase font-semibold leading-tight mb-0.5">
                    Arrival Charge
                  </span>
                  <span className={`text-[0.6875rem] font-bold font-mono leading-tight ${
                    estimate.isOutOfRange ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {estimate.formattedArrivalBattery}
                  </span>
                </div>
              </div>
            )
          )}

          {/* Destination with Name and Address Geocode */}
          <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[0.6875rem] font-bold text-slate-200 font-mono">
                <Flag className="w-3.5 h-3.5 text-sky-400" />
                <span>DESTINATION</span>
              </div>
              <button
                type="button"
                onClick={handleAddStop}
                className="min-h-[44px] px-2.5 rounded-lg bg-slate-950/40 hover:bg-slate-800/80 text-slate-300 hover:text-slate-100 text-[0.625rem] font-bold font-mono transition-colors flex items-center gap-1 cursor-pointer border border-dashed border-slate-700/80 hover:border-slate-600"
              >
                <Plus className="w-3.5 h-3.5 text-slate-400" />
                <span>Add Stop</span>
              </button>
            </div>
            <AddressGeocodeInput
              value={currentDestName}
              onChange={(val) => handleUpdateDestName(val)}
              onResolved={(lat, lng, displayName, geocode) => handleUpdateDestCoords(lat, lng, displayName, geocode)}
              onUnresolved={handleDestUnresolved}
              alreadyResolved={
                (activeTrip ? activeTrip.destGeocoded !== false : destGeocoded !== false) &&
                !isNaN(Number(activeTrip ? activeTrip.destLat : destLat)) &&
                !isNaN(Number(activeTrip ? activeTrip.destLng : destLng))
              }
              placeholder="Destination address or city..."
              componentId={component.id}
              keyboardSlideDirection={component.staticProps?.keyboardSlideDirection as any}
            />
          </div>

          {/* Waypoint / Trip Stops with Address Geocode */}
          {currentStops.map((stop, i) => (
            <div
              key={stop.id || i}
              className="p-2 rounded-xl bg-slate-950/40 border border-slate-800/80 space-y-1.5 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[0.6875rem] font-bold text-slate-300 font-mono">
                  <span className="w-4 h-4 rounded-full bg-slate-800 text-[0.5625rem] font-bold font-mono flex items-center justify-center text-slate-300 shrink-0 border border-slate-700">
                    {i + 1}
                  </span>
                  <span>STOP {i + 1}</span>
                </div>
                <button
                  onClick={() => handleRemoveStop(i)}
                  aria-label={`Remove stop ${i + 1}`}
                  title="Remove Stop"
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-500 hover:text-rose-400 transition-colors cursor-pointer rounded-lg hover:bg-slate-900"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <AddressGeocodeInput
                value={stop.name}
                onChange={(val) => handleUpdateStopName(i, val)}
                onResolved={(lat, lng, displayName, geocode) => handleUpdateStopCoords(i, lat, lng, displayName, geocode)}
                onUnresolved={() => handleStopUnresolved(i)}
                alreadyResolved={stop.geocoded !== false && !isNaN(Number(stop.lat)) && !isNaN(Number(stop.lng))}
                placeholder={`Stop ${i + 1} address or city...`}
                componentId={component.id}
                keyboardSlideDirection={component.staticProps?.keyboardSlideDirection as any}
              />
              {stopLegs[i] && (
                <div className="text-[0.5625rem] font-mono text-slate-400 pl-0.5">
                  {stopLegs[i].isUnresolved
                    ? '--'
                    : `${stopLegs[i].formattedDistance} · est. ${stopLegs[i].formattedDuration}`}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1 border-t border-slate-800/60">
        {activeTrip ? (
          showCancelConfirm ? (
            <div className="w-full flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 min-h-[44px] py-1.5 px-3 rounded-xl border border-slate-800 bg-slate-950/80 hover:bg-slate-900 text-slate-400 hover:text-slate-200 text-xs font-mono font-bold transition-all cursor-pointer shadow-sm"
              >
                Keep Trip
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCancelConfirm(false);
                  cancelTripGuidance();
                }}
                className="flex-1 min-h-[44px] py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 text-xs font-mono font-bold transition-all cursor-pointer shadow-sm"
              >
                Confirm Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowCancelConfirm(true)}
              className="w-full min-h-[44px] py-1.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold font-mono transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700"
            >
              <XCircle className="w-3.5 h-3.5 text-slate-400" /> Cancel Guidance
            </button>
          )
        ) : (
          <button
            onClick={() =>
              startTripGuidance({
                destinationName: primaryDest,
                destLat: Number(destLat) || 37.7456,
                destLng: Number(destLng) || -119.5936,
                destState: destState,
                stops: draftStops,
                destGeocoded: destGeocoded,
              })
            }
            className="w-full min-h-[44px] py-1.5 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold font-mono transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700"
          >
            <Navigation className="w-3.5 h-3.5 text-slate-400" /> Start Guidance
          </button>
        )}
      </div>
    </div>
  );
};

const NavSearchWidget: React.FC<{
  component: ComponentInstance;
  resolved: Record<string, any>;
  isSelected?: boolean;
  customColor: string;
  baseOpacity: string;
  styleOpacity?: number;
}> = ({ component, resolved, isSelected, customColor, baseOpacity, styleOpacity }) => {
  const [query, setQuery] = React.useState('');
  const [isFocused, setIsFocused] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [poiResults, setPoiResults] = React.useState<Array<{
    name: string;
    status: string;
    dist: string;
    lat: number;
    lng: number;
    category?: string;
  }>>([]);

  const headerLabel = resolved.label || component.staticProps?.label || DEFAULT_COMPONENT_LABELS.navSearch;
  const startTripGuidance = useMockpitStore((s) => s.startTripGuidance);
  const setSearchResults = useMockpitStore((s) => s.setSearchResults);
  const vehicleState = useMockpitStore((s) => s.vehicleState);
  const updateComponentSize = useMockpitStore((s) => s.updateComponentSize);

  const resultsPanelRef = React.useRef<HTMLDivElement>(null);
  const isExpanded = isFocused || query.trim().length > 0;
  const prevExpandedRef = React.useRef<boolean>(isExpanded);
  const lastSearchDeltaRef = React.useRef<number>(140);

  const originLat = typeof vehicleState.mapLat === 'number' ? vehicleState.mapLat : 37.7749;
  const originLng = typeof vehicleState.mapLng === 'number' ? vehicleState.mapLng : -122.4194;

  const defaultPOIs = React.useMemo(() => [
    { name: 'Tesla Supercharger - 250kW', status: '8/12 Open', dist: '1.2 mi', lat: originLat + 0.008, lng: originLng + 0.003, category: 'charging_station' },
    { name: 'Electrify America - 350kW', status: '4/6 Open', dist: '2.4 mi', lat: originLat + 0.015, lng: originLng - 0.019, category: 'charging_station' },
    { name: 'Starbucks Coffee Drive-thru', status: 'Open Now', dist: '0.8 mi', lat: originLat + 0.001, lng: originLng + 0.001, category: 'cafe' },
  ], [originLat, originLng]);

  // Handle dynamic measured resize on expand/collapse (v3.0.1)
  React.useEffect(() => {
    const wasExpanded = prevExpandedRef.current;
    if (wasExpanded !== isExpanded) {
      if (isExpanded) {
        // Measure results panel or use a bounded height (capped at 160px for ~4-5 results before scrolling)
        const measured = resultsPanelRef.current?.offsetHeight || 140;
        const delta = Math.min(Math.max(measured, 120), 160);
        lastSearchDeltaRef.current = delta;
        const newHeight = component.height + delta;
        updateComponentSize(component.id, component.width, newHeight);
      } else {
        const delta = lastSearchDeltaRef.current || 140;
        const newHeight = Math.max(component.height - delta, 160);
        updateComponentSize(component.id, component.width, newHeight);
      }
    }
    prevExpandedRef.current = isExpanded;
  }, [isExpanded, component.id, component.width, component.height, updateComponentSize]);

  // Debounced live Overpass POI search
  React.useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setPoiResults([]);
      setLoading(false);
      setSearchResults([]);
      return;
    }

    setLoading(true);
    const timeout = setTimeout(async () => {
      try {
        const pois = await searchNearbyPOIs(trimmed, originLat, originLng, 8000);
        if (pois && pois.length > 0) {
          const mapped = pois.map((p) => {
            const miles = haversineMiles(originLat, originLng, p.lat, p.lng);
            return {
              name: p.name,
              status: p.category === 'charging_station' ? 'EV Charger' : p.category === 'cafe' ? 'Cafe / Food' : 'Location',
              dist: `${miles.toFixed(1)} mi`,
              lat: p.lat,
              lng: p.lng,
              category: p.category,
            };
          });
          setPoiResults(mapped);
          setSearchResults(pois);
        } else {
          // Fallback to local filtering of sample POIs
          const filtered = defaultPOIs.filter((p) => p.name.toLowerCase().includes(trimmed.toLowerCase()));
          setPoiResults(filtered);
        }
      } catch (err) {
        const filtered = defaultPOIs.filter((p) => p.name.toLowerCase().includes(trimmed.toLowerCase()));
        setPoiResults(filtered);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [query, originLat, originLng, defaultPOIs, setSearchResults]);

  const displayedPOIs = query.trim() ? poiResults : defaultPOIs;

  return (
    <div
      id={`component-${component.type}`}
      data-component-type="navSearch"
      className={`w-full h-full rounded-2xl bg-slate-900/90 border border-slate-800 p-3.5 flex flex-col justify-between shadow-lg backdrop-blur-md transition-all duration-300 ${baseOpacity}`}
      style={{ borderColor: isSelected ? customColor : undefined, opacity: styleOpacity }}
    >
      <ComponentHeader
        type="navSearch"
        label={headerLabel}
        customColor={customColor}
        rightElement={
          <span className="text-[0.5625rem] font-mono text-slate-400">NEARBY</span>
        }
      />

      <div className="my-1">
        <MockpitInput
          value={query}
          onChange={setQuery}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setTimeout(() => setIsFocused(false), 200);
          }}
          placeholder="Search EV chargers, food, parking..."
          componentId={component.id}
          keyboardSlideDirection={component.staticProps?.keyboardSlideDirection as any}
          icon={<Search className="w-3.5 h-3.5 text-slate-500" />}
          className="min-h-[44px]"
        />
      </div>

      {isExpanded ? (
        <div ref={resultsPanelRef} className="flex-1 min-h-0 flex flex-col justify-between">
          <div className="flex-1 min-h-0 my-1 space-y-1 overflow-y-auto pr-1 custom-scrollbar max-h-[180px]">
            {loading ? (
              <div className="text-[0.6875rem] text-slate-400 font-mono italic p-2 text-center animate-pulse">
                Searching nearby...
              </div>
            ) : displayedPOIs.length === 0 ? (
              <div className="text-[0.6875rem] text-slate-500 italic p-1">No matching results</div>
            ) : (
              displayedPOIs.map((poi, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    startTripGuidance({
                      destinationName: poi.name,
                      destLat: poi.lat,
                      destLng: poi.lng,
                      destGeocoded: true,
                      stops: [],
                    });
                  }}
                  className="p-1.5 rounded-lg bg-slate-950/50 hover:bg-slate-800/80 border border-slate-800/80 flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div className="min-w-0 pr-1">
                    <div className="text-[0.6875rem] font-bold text-slate-200 truncate">{poi.name}</div>
                    <div className="text-[0.5625rem] text-emerald-400 font-mono">{poi.status}</div>
                  </div>
                  <span className="text-[0.625rem] font-mono text-slate-400 shrink-0 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                    {poi.dist}
                  </span>
                </div>
              ))
            )}
          </div>
          <div className="text-[0.5625rem] text-slate-500 font-mono text-center pt-1 border-t border-slate-800/60">
            {query.trim() ? 'LIVE POI SEARCH RESULTS' : 'POPULAR NEARBY'}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-[0.625rem] text-slate-600 font-mono">
          Focus search to view nearby points of interest
        </div>
      )}
    </div>
  );
};

interface TirePressureWidgetProps {
  component: ComponentInstance;
  resolved: Record<string, any>;
  isSelected?: boolean;
  customColor: string;
  baseOpacity: string;
  styleOpacity: number;
}

const TirePressureWidget: React.FC<TirePressureWidgetProps> = ({
  component,
  resolved,
  isSelected,
  customColor,
  baseOpacity,
  styleOpacity,
}) => {
  const tirePressureWarning = useMockpitStore((s) => s.vehicleState.tirePressureWarning ?? false);

  const headerLabel = resolved.label || component.staticProps?.label || DEFAULT_COMPONENT_LABELS.tirePressure;

  const warningThresh = Number(component.staticProps?.warningThreshold) || 31;
  const criticalThresh = Number(component.staticProps?.criticalThreshold) || 27;

  const parsePsi = (val: string) => {
    const num = parseFloat(String(val).replace(/[^0-9.]/g, ''));
    return isNaN(num) ? 35 : num;
  };

  const rawFlStr = resolved.frontLeft || component.staticProps?.frontLeft || '35 PSI';
  const rawFrStr = resolved.frontRight || component.staticProps?.frontRight || '35 PSI';
  const rawRlStr = resolved.rearLeft || component.staticProps?.rearLeft || '36 PSI';
  const rawRrStr = resolved.rearRight || component.staticProps?.rearRight || '36 PSI';

  let flStr = rawFlStr;
  let frStr = rawFrStr;
  let rlStr = rawRlStr;
  let rrStr = rawRrStr;

  if (tirePressureWarning) {
    // If all configured values are > warningThresh (e.g. default 35/35/36/36 without custom low tire), show 28 PSI on FL
    const flPsi = parsePsi(rawFlStr);
    const frPsi = parsePsi(rawFrStr);
    const rlPsi = parsePsi(rawRlStr);
    const rrPsi = parsePsi(rawRrStr);
    if (flPsi > warningThresh && frPsi > warningThresh && rlPsi > warningThresh && rrPsi > warningThresh) {
      flStr = '28 PSI';
    }
  } else {
    // When preset is OFF, all tire pressure settings should be normal
    const flPsi = parsePsi(rawFlStr);
    const frPsi = parsePsi(rawFrStr);
    const rlPsi = parsePsi(rawRlStr);
    const rrPsi = parsePsi(rawRrStr);
    flStr = flPsi <= warningThresh ? '35 PSI' : rawFlStr;
    frStr = frPsi <= warningThresh ? '35 PSI' : rawFrStr;
    rlStr = rlPsi <= warningThresh ? '36 PSI' : rawRlStr;
    rrStr = rrPsi <= warningThresh ? '36 PSI' : rawRrStr;
  }

  const tires = [
    { code: 'FL', label: 'Front Left', str: flStr, psi: parsePsi(flStr) },
    { code: 'FR', label: 'Front Right', str: frStr, psi: parsePsi(frStr) },
    { code: 'RL', label: 'Rear Left', str: rlStr, psi: parsePsi(rlStr) },
    { code: 'RR', label: 'Rear Right', str: rrStr, psi: parsePsi(rrStr) },
  ];

  const getStatus = (psi: number) => {
    if (!tirePressureWarning) return 'normal';
    if (psi <= criticalThresh) return 'critical';
    if (psi <= warningThresh) return 'warning';
    return 'normal';
  };

  const gridContainerRef = useRef<HTMLDivElement>(null);
  const measureContainerRef = useRef<HTMLDivElement>(null);
  const [useAbbreviation, setUseAbbreviation] = useState(false);

  // Measure if the longest full label fits within the tile's available width
  const checkFit = () => {
    if (!gridContainerRef.current) return;
    const gridWidth = gridContainerRef.current.clientWidth;
    const tileWidth = (gridWidth - 8) / 2;
    const availableTextWidth = tileWidth - 24; // 16px tile padding + 8px safety/dot margin

    if (measureContainerRef.current) {
      const neededWidth = measureContainerRef.current.scrollWidth;
      setUseAbbreviation(neededWidth > availableTextWidth || availableTextWidth < 68);
    } else {
      setUseAbbreviation(tileWidth < 96);
    }
  };

  useLayoutEffect(() => {
    checkFit();
  }, [component.width]);

  useEffect(() => {
    const el = gridContainerRef.current;
    if (!el) return;

    checkFit();
    const observer = new ResizeObserver(() => {
      checkFit();
    });

    observer.observe(el);
    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div
      className={`w-full h-full rounded-2xl bg-slate-900/90 border border-slate-800 p-3.5 flex flex-col justify-between shadow-lg backdrop-blur-md transition-all duration-300 ${baseOpacity}`}
      style={{ borderColor: isSelected ? customColor : undefined, opacity: styleOpacity }}
    >
      <ComponentHeader
        type="tirePressure"
        label={headerLabel}
        customColor={customColor}
      />

      {/* Hidden offscreen measurement element to measure unconstrained width of full label */}
      <div
        ref={measureContainerRef}
        aria-hidden="true"
        className="absolute -top-9999 left-0 pointer-events-none opacity-0 invisible whitespace-nowrap text-[0.625rem] font-mono font-bold"
      >
        Front Right
      </div>

      <div
        ref={gridContainerRef}
        className="flex-1 min-h-0 grid grid-cols-2 gap-2 my-1 text-center items-center"
      >
        {tires.map((tire) => {
          const status = getStatus(tire.psi);
          let containerClasses = 'p-2 rounded-xl border transition-all duration-300 flex flex-col justify-center items-center min-w-0';
          let labelClasses = 'text-[0.625rem] block font-mono font-bold truncate whitespace-nowrap';
          let valClasses = 'text-xs font-black font-mono';

          if (status === 'critical') {
            containerClasses += ' bg-red-950/60 border-red-500/80 shadow-[0_0_12px_rgba(239,68,68,0.3)] animate-pulse';
            labelClasses += ' text-red-400';
            valClasses += ' text-red-300';
          } else if (status === 'warning') {
            containerClasses += ' bg-amber-950/50 border-amber-500/80 shadow-[0_0_10px_rgba(245,158,11,0.2)]';
            labelClasses += ' text-amber-400';
            valClasses += ' text-amber-300';
          } else {
            containerClasses += ' bg-slate-950/60 border-slate-800/80';
            labelClasses += ' text-slate-500';
            valClasses += ' text-slate-100';
          }

          const displayedLabel = useAbbreviation ? tire.code : tire.label;

          return (
            <div key={tire.code} className={containerClasses}>
              <div className="flex items-center gap-1 justify-center max-w-full px-0.5">
                <span className={labelClasses} title={tire.label}>
                  {displayedLabel}
                </span>
                {status !== 'normal' && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      status === 'critical' ? 'bg-red-500 animate-ping' : 'bg-amber-400'
                    }`}
                  />
                )}
              </div>
              <span className={valClasses}>{tire.str}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface TripSummaryWidgetProps {
  component: ComponentInstance;
  resolved: Record<string, any>;
  isSelected?: boolean;
  customColor: string;
  baseOpacity: string;
  styleOpacity?: number;
  isPresentation?: boolean;
}

const TripSummaryWidget: React.FC<TripSummaryWidgetProps> = ({
  component,
  resolved,
  isSelected,
  customColor,
  baseOpacity,
  styleOpacity,
  isPresentation = false,
}) => {
  const activeTrip = useMockpitStore((s) => s.activeTrip);
  const vehicleState = useMockpitStore((s) => s.vehicleState);
  const setActiveView = useMockpitStore((s) => s.setActiveView);

  const headerLabel =
    resolved.label || component.staticProps?.label || DEFAULT_COMPONENT_LABELS.navTripSummary;

  // Fit check: rather than truncating the destination name, switch to a stacked layout
  // (name on its own row, stats below) when the name + stats block can't both fit on one
  // row. Mirrors TirePressureWidget's hidden-measurement pattern in this same file.
  const nameRowRef = React.useRef<HTMLDivElement>(null);
  const nameMeasureRef = React.useRef<HTMLSpanElement>(null);
  const statBlockRef = React.useRef<HTMLDivElement>(null);
  const [stackedLayout, setStackedLayout] = React.useState(false);

  const checkNameFit = React.useCallback(() => {
    const rowEl = nameRowRef.current;
    const nameEl = nameMeasureRef.current;
    const statEl = statBlockRef.current;
    if (!rowEl || !nameEl || !statEl) return;
    const gap = 8; // matches gap-2
    const available = rowEl.clientWidth - statEl.offsetWidth - gap;
    setStackedLayout(nameEl.scrollWidth > available);
  }, []);

  React.useLayoutEffect(() => {
    checkNameFit();
  }, [activeTrip?.destinationName, checkNameFit]);

  React.useEffect(() => {
    const el = nameRowRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => checkNameFit());
    observer.observe(el);
    return () => observer.disconnect();
  }, [checkNameFit]);

  const goToTripPlanner = () => {
    setActiveView('navigation');
    setTimeout(() => {
      const el =
        document.getElementById('component-navDestination') ||
        document.querySelector('[data-component-type="navDestination"]');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 50);
  };

  const wrapperClasses = `w-full h-full rounded-2xl bg-slate-900/90 border border-slate-800 p-3.5 flex flex-col justify-between shadow-lg backdrop-blur-md transition-all duration-300 ${baseOpacity}`;
  const wrapperStyle = { borderColor: isSelected ? customColor : undefined, opacity: styleOpacity };

  if (!activeTrip) {
    if (isPresentation) {
      return null; // Auto-hidden: nothing to show in presentation until a trip starts
    }

    // Editor mode: unchanged from v1 — this real "Set Destination" card is already a
    // useful, functional placeholder for positioning; no ghost overlay needed.
    return (
      <div className={wrapperClasses} style={wrapperStyle}>
        <ComponentHeader type="navTripSummary" label={headerLabel} customColor={customColor} />
        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center p-3 my-auto">
          <span className="text-xs font-mono text-slate-400">No active trip.</span>
          <button
            onClick={goToTripPlanner}
            className="min-h-[44px] min-w-[44px] px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold border border-slate-700 cursor-pointer transition-colors shadow-sm"
          >
            Set Destination
          </button>
        </div>
      </div>
    );
  }

  const originLat = typeof vehicleState.mapLat === 'number' ? vehicleState.mapLat : 37.7749;
  const originLng = typeof vehicleState.mapLng === 'number' ? vehicleState.mapLng : -122.4194;
  const consumptionRate = Number(resolved.consumptionRate || component.staticProps?.consumptionRate) || 0.32;
  const estimate = calculateTripEstimate(originLat, originLng, activeTrip, consumptionRate, vehicleState.batteryPercent);
  const stopCount = activeTrip.stops?.length || 0;

  // Whole-number miles for this glance card only — calculateTripEstimate's shared
  // `formattedDistance` (1 decimal, "total"/"est." phrasing) stays untouched everywhere
  // else it's used (navTripEstimate, active-trip metrics grid on navDestination).
  const roundedDistance = `${Math.round(estimate.distanceMiles)} miles`;

  return (
    <div className={wrapperClasses} style={wrapperStyle}>
      <ComponentHeader type="navTripSummary" label={headerLabel} customColor={customColor} />

      {/* Hidden offscreen measurement element — same convention as TirePressureWidget */}
      <span
        ref={nameMeasureRef}
        aria-hidden="true"
        className="absolute -top-9999 left-0 pointer-events-none opacity-0 invisible whitespace-nowrap text-sm font-bold font-mono"
      >
        {activeTrip.destinationName}
      </span>

      <div
        ref={nameRowRef}
        className={`px-0.5 gap-2 ${stackedLayout ? 'flex flex-col' : 'flex items-center justify-between'}`}
      >
        <span className="text-sm font-bold text-slate-100 font-mono whitespace-nowrap">
          {activeTrip.destinationName}
        </span>
        {estimate.isUnresolved ? (
          <span
            ref={statBlockRef as any}
            className={`self-start text-[0.625rem] font-mono text-amber-300 shrink-0 ${stackedLayout ? '' : 'text-right'}`}
          >
            {estimate.unresolvedMessage}
          </span>
        ) : (
          <div
            ref={statBlockRef}
            className={`self-start shrink-0 leading-tight ${stackedLayout ? 'text-left' : 'text-right'}`}
          >
            <div className="text-xs font-bold text-slate-100 font-mono">{estimate.formattedDuration}</div>
            <div className="text-[0.625rem] text-slate-400 font-mono">{roundedDistance}</div>
          </div>
        )}
      </div>

      <div className="flex items-center pt-1 border-t border-slate-800/60">
        <button
          onClick={goToTripPlanner}
          className="shrink-0 min-h-[36px] px-2.5 rounded-lg bg-slate-950/40 hover:bg-slate-800/80 text-slate-300 hover:text-slate-100 text-[0.625rem] font-bold font-mono border border-slate-700/60 flex items-center gap-1 transition-colors cursor-pointer"
        >
          {stopCount === 0 ? (
            <>
              <Plus className="w-3 h-3 text-slate-400" />
              <span>Add Stop</span>
            </>
          ) : (
            <>
              <MapPin className="w-3 h-3 text-slate-400" />
              <span>{stopCount} Stop{stopCount > 1 ? 's' : ''}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export const ComponentRenderer: React.FC<ComponentRendererProps> = ({
  component,
  vehicleState,
  isSelected,
  isPresentation,
  onMinimize,
}) => {
  const setVehicleState = useMockpitStore((s) => s.setVehicleState);
  const activePalette = useMockpitStore((s) => s.activePalette);
  const activeTrip = useMockpitStore((s) => s.activeTrip);
  const primaryColor = activePalette?.primary || '#38bdf8';
  const resolved = getResolvedProps(component, vehicleState);

  // Visibility logic
  const isVisible = resolved.visible !== 'false' && resolved.visible !== '0';

  if (!isVisible && isPresentation) {
    return null;
  }

  // Parse configured opacity (if present in staticProps or resolved props)
  let configuredOpacity: number | undefined = undefined;
  if (resolved.opacity !== undefined) {
    const parsed = parseFloat(String(resolved.opacity).replace('%', ''));
    if (!isNaN(parsed)) {
      configuredOpacity = parsed > 1 ? parsed / 100 : parsed;
    }
  } else if (component.staticProps?.opacity !== undefined) {
    const parsed = parseFloat(String(component.staticProps.opacity).replace('%', ''));
    if (!isNaN(parsed)) {
      configuredOpacity = parsed > 1 ? parsed / 100 : parsed;
    }
  }

  // Editor mode: force 100% opacity (opacity: 1) regardless of state, bindings, or configured opacity.
  // Presentation mode: use configured opacity if present, otherwise 1.
  const styleOpacity = isPresentation
    ? (configuredOpacity !== undefined ? configuredOpacity : 1)
    : 1;

  const baseOpacity = 'opacity-100';
  // If color is not customized or is set to default/palette placeholder, use active theme palette primary color
  const defaultTypeColor = COMPONENT_META[component.type]?.defaultColor;
  const isDefaultOrPresetColor = !resolved.color || 
    resolved.color === 'var(--color-primary)' || 
    resolved.color === '#38bdf8' || 
    resolved.color === defaultTypeColor ||
    ['#22c55e', '#f8fafc', '#06b6d4', '#eab308', '#f59e0b', '#10b981', '#a855f7', '#ec4899', '#f97316', '#ef4444'].includes(resolved.color);

  const customColor = isDefaultOrPresetColor ? primaryColor : resolved.color;

  switch (component.type) {
    case 'battery': {
      const percent = vehicleState.batteryPercent;
      const roundedPercent = Math.round(percent);
      const textVal = resolved.text
        ? resolved.text.replace(/(\d+\.\d+)%/g, (_, num) => `${Math.round(parseFloat(num))}%`)
        : `${roundedPercent}%`;
      const headerLabel = resolved.label || component.staticProps?.label || DEFAULT_COMPONENT_LABELS.battery;

      const maxRangeMiles = Number(component.staticProps?.maxRange) || 350;
      const liveRange = Math.round((percent / 100) * maxRangeMiles);

      const targetPercent = Math.min(100, Math.max(1, Number(component.staticProps?.targetChargePercent) || 80));
      const chargeRateKw = Number(component.staticProps?.chargeRateKw) || 350;

      let chargingInfoText = '';
      if (vehicleState.isCharging) {
        if (roundedPercent >= targetPercent) {
          chargingInfoText = targetPercent === 100 ? 'Fully Charged' : `Target ${targetPercent}% Reached`;
        } else {
          const remainingPercent = targetPercent - roundedPercent;
          const remainingKwh = (remainingPercent / 100) * 75;
          const remainingHours = remainingKwh / chargeRateKw;
          const remainingMins = Math.max(1, Math.round(remainingHours * 60));
          chargingInfoText = `~${remainingMins} min${remainingMins === 1 ? '' : 's'} to ${targetPercent}%`;
        }
      }

      return (
        <div
          className={`w-full h-full rounded-2xl bg-slate-900/90 border border-slate-800 p-3.5 flex flex-col justify-between shadow-lg backdrop-blur-md transition-all duration-300 ${baseOpacity}`}
          style={{ borderColor: isSelected ? customColor : undefined, opacity: styleOpacity }}
        >
          <ComponentHeader
            type="battery"
            label={headerLabel}
            customColor={customColor}
            rightElement={
              vehicleState.isCharging ? (
                <span className="flex items-center gap-1 text-emerald-400 font-bold text-[0.625rem] bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <Zap className="w-3 h-3 fill-emerald-400" />
                  CHARGING
                </span>
              ) : (
                <span className="text-[0.625rem] font-mono font-bold text-slate-400 uppercase">
                  {liveRange} MILE RANGE
                </span>
              )
            }
          />

          <div className="flex items-baseline justify-between my-1">
            <div className="text-3xl font-black tracking-tight" style={{ color: customColor }}>
              {textVal}
            </div>
            {vehicleState.isCharging && (
              <div className="text-xs text-slate-400 font-mono">
                {chargingInfoText}
              </div>
            )}
          </div>

          {/* Battery Level Progress Bar */}
          <div className="w-full bg-slate-800/80 h-3 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${Math.min(100, Math.max(0, percent))}%`,
                backgroundColor: customColor,
                boxShadow: `0 0 12px ${getAlphaColor(customColor, '80', 50)}`,
              }}
            />
          </div>
        </div>
      );
    }

    case 'gear': {
      return (
        <GearWidget
          component={component}
          resolved={resolved}
          isSelected={isSelected}
          isPresentation={isPresentation}
          customColor={customColor}
          baseOpacity={baseOpacity}
          styleOpacity={styleOpacity}
        />
      );
    }

    case 'speed': {
      return (
        <SpeedometerWidget
          component={component}
          resolved={resolved}
          isSelected={isSelected}
          isPresentation={isPresentation}
          customColor={customColor}
          baseOpacity={baseOpacity}
          styleOpacity={styleOpacity}
        />
      );
    }

    case 'warning': {
      const message = component.staticProps?.body || resolved.message || resolved.text || component.staticProps?.message || 'WARNING';
      const details = resolved.details || component.staticProps?.details || '';
      const title = component.staticProps?.title;
      const avatarName = component.staticProps?.avatarName || title;
      const threadId = component.staticProps?.threadId;

      const isMessageToast = !!threadId || !!avatarName;

      let iconKey = resolved.icon || component.staticProps?.icon;
      if (isMessageToast) {
        if (!iconKey || iconKey === 'alert-triangle') {
          iconKey = 'message-square';
        }
      } else if (!iconKey || iconKey === 'alert-triangle') {
        const normMsg = message.toUpperCase();
        if (normMsg.includes('DOOR') || component.id.includes('door')) {
          iconKey = 'door-open';
        } else if (normMsg.includes('BATTERY') || component.id.includes('battery')) {
          iconKey = 'battery-warning';
        } else if (normMsg.includes('CRUISE') || component.id.includes('cruise')) {
          iconKey = 'gauge';
        } else if (normMsg.includes('TIRE') || component.id.includes('tpms') || component.id.includes('tire')) {
          iconKey = 'tire';
        } else {
          iconKey = iconKey || 'alert-triangle';
        }
      }

      let headerLabel = resolved.label || component.staticProps?.label;
      if (isMessageToast) {
        headerLabel = 'TEXT MESSAGE';
      } else if (!headerLabel || headerLabel === DEFAULT_COMPONENT_LABELS.warning) {
        const normMsg = message.toUpperCase();
        if (iconKey === 'door-open' || normMsg.includes('DOOR') || component.id.includes('door')) {
          headerLabel = 'DOOR ALERT';
        } else if (iconKey === 'battery-warning' || normMsg.includes('BATTERY') || component.id.includes('battery')) {
          headerLabel = 'BATTERY ALERT';
        } else if (iconKey === 'gauge' || normMsg.includes('CRUISE') || component.id.includes('cruise')) {
          headerLabel = 'CRUISE CONTROL';
        } else if (iconKey === 'tire' || normMsg.includes('TIRE') || component.id.includes('tpms') || component.id.includes('tire')) {
          headerLabel = 'TIRE PRESSURE ALERT';
        } else {
          headerLabel = DEFAULT_COMPONENT_LABELS.warning;
        }
      }

      if (threadId) {
        return (
          <MessageToastCard
            component={component}
            headerLabel={headerLabel}
            customColor={customColor}
            iconKey={iconKey}
            message={message}
            title={title}
            avatarName={avatarName}
            threadId={threadId}
            baseOpacity={baseOpacity}
            isVisible={isVisible}
            styleOpacity={styleOpacity}
            onMinimize={onMinimize}
          />
        );
      }

      return (
        <div
          className={`w-full h-full rounded-2xl bg-slate-950/95 border-2 p-3.5 flex flex-col justify-center shadow-2xl backdrop-blur-xl transition-all duration-300 relative overflow-hidden ${baseOpacity}`}
          style={{
            borderColor: customColor,
            boxShadow: isVisible ? `0 0 25px ${getAlphaColor(customColor, '40', 25)}` : undefined,
            opacity: styleOpacity,
          }}
        >
          <ComponentHeader
            type="warning"
            label={headerLabel}
            customColor={customColor}
            iconKey={iconKey}
            rightElement={
              onMinimize ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onMinimize();
                  }}
                  className="p-1 rounded bg-slate-900/90 border border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                  title="Minimize Alert (X)"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : undefined
            }
          />

          <div className="flex items-center gap-3.5 min-w-0 w-full pr-8">
            <div
              className="p-2.5 rounded-xl shrink-0 flex items-center justify-center border"
              style={{
                backgroundColor: getAlphaColor(customColor, '25', 15),
                borderColor: getAlphaColor(customColor, '50', 30),
                color: customColor,
              }}
            >
              {renderNotificationIcon(iconKey, 'w-5 h-5')}
            </div>

            <div className="flex flex-col justify-center min-w-0 flex-1">
              <span className="text-sm font-extrabold tracking-tight text-slate-100 leading-snug">
                {message}
              </span>
              {details ? (
                <>
                  <div className="w-full h-px bg-slate-800 my-1.5" />
                  <span className="text-xs text-slate-300 font-normal leading-relaxed">
                    {details}
                  </span>
                </>
              ) : null}
            </div>
          </div>
        </div>
      );
    }

    case 'map': {
      const lat = Number(resolved.lat) || 37.7749;
      const lng = Number(resolved.lng) || -122.4194;
      const zoom = Number(resolved.zoom) || 13;
      const headerLabel = resolved.label || component.staticProps?.label || DEFAULT_COMPONENT_LABELS.map;
      const searchResults = useMockpitStore.getState().searchResults || [];

      return (
        <div
          className={`w-full h-full rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col shadow-lg backdrop-blur-md transition-all duration-300 relative overflow-hidden ${baseOpacity}`}
          style={{ borderColor: isSelected ? customColor : undefined, opacity: styleOpacity }}
        >
          <ComponentHeader
            type="map"
            label={headerLabel}
            customColor={customColor}
            className="px-3 pt-3"
            rightElement={
              <span className="text-[0.5625rem] font-mono text-slate-500">
                {lat.toFixed(2)}°, {lng.toFixed(2)}°
              </span>
            }
          />

          <div className="flex-1 w-full overflow-hidden relative z-0">
            <MapContainer
              center={[lat, lng]}
              zoom={zoom}
              scrollWheelZoom={false}
              dragging={false}
              zoomControl={false}
              doubleClickZoom={false}
              touchZoom={false}
              attributionControl={false}
              className="w-full h-full"
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={[lat, lng]} icon={customPinIcon} />

              {/* Active Trip Destination Pin */}
              {activeTrip && !isNaN(activeTrip.destLat) && !isNaN(activeTrip.destLng) && (
                <Marker
                  position={[activeTrip.destLat, activeTrip.destLng]}
                  icon={L.divIcon({
                    className: 'custom-dest-pin',
                    html: `<div style="background-color: #f59e0b; width: 14px; height: 14px; border-radius: 50%; border: 3px solid #0f172a; box-shadow: 0 0 10px #f59e0b;"></div>`,
                    iconSize: [14, 14],
                    iconAnchor: [7, 7],
                  })}
                />
              )}

              {/* Search Result POI Pins */}
              {searchResults.slice(0, 10).map((poi) => (
                <Marker
                  key={poi.id}
                  position={[poi.lat, poi.lng]}
                  icon={L.divIcon({
                    className: 'custom-poi-pin',
                    html: `<div style="background-color: #10b981; width: 10px; height: 10px; border-radius: 50%; border: 2px solid #0f172a; box-shadow: 0 0 8px #10b981;"></div>`,
                    iconSize: [10, 10],
                    iconAnchor: [5, 5],
                  })}
                />
              ))}

              <MapResizer />
            </MapContainer>
          </div>
        </div>
      );
    }

    // Scaffolded disabled-by-default infotainment shells
    case 'media': {
      const headerLabel = resolved.label || component.staticProps?.label || DEFAULT_COMPONENT_LABELS.media;

      return (
        <MusicMediaPlayer
          component={component}
          isSelected={isSelected}
          customColor={customColor}
          styleOpacity={styleOpacity}
          headerLabel={headerLabel}
        />
      );
    }

    case 'nowPlaying': {
      return (
        <NowPlayingWidget
          component={component}
          resolved={resolved}
          isSelected={isSelected}
          customColor={customColor}
          baseOpacity={baseOpacity}
          styleOpacity={styleOpacity}
          isPresentation={isPresentation}
        />
      );
    }

    case 'mediaPlaylists': {
      const headerLabel =
        resolved.label ||
        component.staticProps?.label ||
        DEFAULT_COMPONENT_LABELS.mediaPlaylists ||
        'Playlists';
      return (
        <MediaPlaylistsWidget
          component={component}
          isSelected={isSelected}
          customColor={customColor}
          styleOpacity={styleOpacity}
          headerLabel={headerLabel}
        />
      );
    }

    case 'mediaDiscovery': {
      const headerLabel =
        resolved.label ||
        component.staticProps?.label ||
        DEFAULT_COMPONENT_LABELS.mediaDiscovery ||
        'Discovery';
      return (
        <MediaDiscoveryWidget
          component={component}
          isSelected={isSelected}
          customColor={customColor}
          styleOpacity={styleOpacity}
          headerLabel={headerLabel}
        />
      );
    }

    case 'mediaSearch': {
      return (
        <MusicSearchWidget
          component={component}
          resolved={resolved}
          isSelected={isSelected}
          customColor={customColor}
          baseOpacity={baseOpacity}
          styleOpacity={styleOpacity}
        />
      );
    }

    case 'climate': {
      return (
        <CompactClimateWidget
          component={component}
          resolved={resolved}
          isSelected={isSelected}
          customColor={customColor}
          baseOpacity={baseOpacity}
          styleOpacity={styleOpacity}
        />
      );
    }

    case 'phone': {
      const contact = resolved.contact || 'Alex Morgan';
      const number = resolved.number || '+1 (555) 019-2834';
      const headerLabel = resolved.label || component.staticProps?.label || DEFAULT_COMPONENT_LABELS.phone;

      return (
        <div
          className={`w-full h-full rounded-2xl bg-slate-900/90 border border-slate-800 p-3.5 flex flex-col justify-between shadow-lg backdrop-blur-md transition-all duration-300 ${baseOpacity}`}
          style={{ borderColor: isSelected ? customColor : undefined, opacity: styleOpacity }}
        >
          <ComponentHeader
            type="phone"
            label={headerLabel}
            customColor={customColor}
            rightElement={
              <span className="text-[0.5625rem] text-emerald-400 font-mono">CONNECTED</span>
            }
          />

          <div className="flex-1 min-h-0 my-1 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-200 font-bold text-xs shrink-0">
              {contact.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-slate-100 truncate">{contact}</div>
              <div className="text-xs text-slate-400 font-mono truncate">{number}</div>
            </div>
          </div>

          <div className="text-[0.625rem] text-slate-500 font-mono pt-1 border-t border-slate-800/60">
            Hands-free calling ready
          </div>
        </div>
      );
    }

    case 'driveMode': {
      return (
        <DriveModeWidget
          component={component}
          resolved={resolved}
          isSelected={isSelected}
          isPresentation={isPresentation}
          customColor={customColor}
          baseOpacity={baseOpacity}
          styleOpacity={styleOpacity}
        />
      );
    }

    case 'tirePressure': {
      return (
        <TirePressureWidget
          component={component}
          resolved={resolved}
          isSelected={isSelected}
          customColor={customColor}
          baseOpacity={baseOpacity}
          styleOpacity={styleOpacity}
        />
      );
    }

    case 'navHome': {
      return (
        <NavHomeWidget
          component={component}
          resolved={resolved}
          isSelected={isSelected}
          customColor={customColor}
          baseOpacity={baseOpacity}
          styleOpacity={styleOpacity}
        />
      );
    }

    case 'navFavorites': {
      return (
        <NavFavoritesWidget
          component={component}
          resolved={resolved}
          isSelected={isSelected}
          customColor={customColor}
          baseOpacity={baseOpacity}
          styleOpacity={styleOpacity}
        />
      );
    }

    case 'navDestination': {
      return (
        <NavDestinationWidget
          component={component}
          resolved={resolved}
          vehicleState={vehicleState}
          isSelected={isSelected}
          customColor={customColor}
          baseOpacity={baseOpacity}
          styleOpacity={styleOpacity}
        />
      );
    }

    case 'navSearch': {
      return (
        <NavSearchWidget
          component={component}
          resolved={resolved}
          isSelected={isSelected}
          customColor={customColor}
          baseOpacity={baseOpacity}
          styleOpacity={styleOpacity}
        />
      );
    }

    case 'navTripEstimate': {
      const headerLabel = resolved.label || component.staticProps?.label || DEFAULT_COMPONENT_LABELS.navTripEstimate;

      // Labels: customizable from staticProps / bindings, defaulting to full words
      const distanceLabel = resolved.distanceLabel || component.staticProps?.distanceLabel || 'Distance';
      const estimatedTimeLabel = resolved.estimatedTimeLabel || component.staticProps?.estimatedTimeLabel || 'Estimated Time';
      const energyRequiredLabel = resolved.energyRequiredLabel || component.staticProps?.energyRequiredLabel || 'Energy Required';
      const arrivalChargeLabel = resolved.arrivalChargeLabel || component.staticProps?.arrivalChargeLabel || 'Arrival Charge';

      if (!activeTrip) {
        return (
          <div
            id={`component-${component.type}`}
            data-component-type="navTripEstimate"
            className={`w-full min-h-full rounded-2xl bg-slate-900/90 border border-slate-800 p-3.5 flex flex-col justify-between gap-2.5 shadow-lg backdrop-blur-md transition-all duration-300 ${baseOpacity}`}
            style={{ borderColor: isSelected ? customColor : undefined, opacity: styleOpacity }}
          >
            <ComponentHeader
              type="navTripEstimate"
              label={headerLabel}
              customColor={customColor}
            />

            <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center p-3 my-auto">
              <span className="text-xs font-mono text-slate-400">No active trip.</span>
              <button
                onClick={() => {
                  const el = document.getElementById('component-navDestination') || document.querySelector('[data-component-type="navDestination"]');
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                }}
                className="min-h-[44px] min-w-[44px] px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold border border-slate-700 cursor-pointer transition-colors shadow-sm"
              >
                Set Destination
              </button>
            </div>
          </div>
        );
      }

      const originLat = typeof vehicleState.mapLat === 'number' ? vehicleState.mapLat : 37.7749;
      const originLng = typeof vehicleState.mapLng === 'number' ? vehicleState.mapLng : -122.4194;
      const consumptionRate = Number(resolved.consumptionRate || component.staticProps?.consumptionRate) || 0.32;

      const estimate = calculateTripEstimate(
        originLat,
        originLng,
        activeTrip,
        consumptionRate,
        vehicleState.batteryPercent
      );

      return (
        <div
          id={`component-${component.type}`}
          data-component-type="navTripEstimate"
          className={`w-full min-h-full rounded-2xl bg-slate-900/90 border border-slate-800 p-3.5 flex flex-col justify-between gap-2.5 shadow-lg backdrop-blur-md transition-all duration-300 ${baseOpacity}`}
          style={{ borderColor: isSelected ? customColor : undefined, opacity: styleOpacity }}
        >
          <ComponentHeader
            type="navTripEstimate"
            label={headerLabel}
            customColor={customColor}
          />

          <div className="grid grid-cols-2 gap-2 my-auto">
            <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800 flex flex-col justify-between">
              <span className="text-[0.5625rem] text-slate-400 block font-mono uppercase font-semibold leading-tight mb-1">
                {distanceLabel}
              </span>
              <span className="text-xs font-bold text-slate-100 font-mono leading-tight">{estimate.formattedDistance}</span>
            </div>

            <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800 flex flex-col justify-between">
              <span className="text-[0.5625rem] text-slate-400 block font-mono uppercase font-semibold leading-tight mb-1">
                {estimatedTimeLabel}
              </span>
              <span className="text-xs font-bold text-slate-100 font-mono leading-tight">{estimate.formattedDuration}</span>
            </div>

            <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800 flex flex-col justify-between">
              <span className="text-[0.5625rem] text-slate-400 block font-mono uppercase font-semibold leading-tight mb-1">
                {energyRequiredLabel}
              </span>
              <span className="text-[0.6875rem] font-bold text-slate-100 font-mono leading-tight">{estimate.formattedEnergy}</span>
            </div>

            <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800 flex flex-col justify-between">
              <span className="text-[0.5625rem] text-slate-400 block font-mono uppercase font-semibold leading-tight mb-1">
                {arrivalChargeLabel}
              </span>
              <span className={`text-[0.6875rem] font-bold font-mono leading-tight ${
                estimate.isOutOfRange ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {estimate.formattedArrivalBattery}
              </span>
            </div>
          </div>
        </div>
      );
    }

    case 'navTripSummary': {
      return (
        <TripSummaryWidget
          component={component}
          resolved={resolved}
          isSelected={isSelected}
          customColor={customColor}
          baseOpacity={baseOpacity}
          styleOpacity={styleOpacity}
          isPresentation={isPresentation}
        />
      );
    }

    case 'overheadVisualization': {
      return (
        <div
          className={`w-full h-full rounded-2xl bg-slate-950 border border-slate-800 flex flex-col overflow-hidden shadow-xl ${baseOpacity}`}
          style={{ borderColor: isSelected ? customColor : undefined, opacity: styleOpacity }}
        >
          <OverheadDrivingVisualization
            component={component}
            vehicleState={vehicleState}
            isSelected={isSelected}
            isPresentation={isPresentation}
          />
        </div>
      );
    }

    case 'miniNav': {
      return (
        <div
          className={`w-full h-full rounded-2xl overflow-hidden ${baseOpacity}`}
          style={{ borderColor: isSelected ? customColor : undefined, opacity: styleOpacity }}
        >
          <MiniNav
            highwayName={resolved.highwayName}
            nextExit={resolved.nextExit}
            distanceToManeuver={resolved.distanceToManeuver}
            maneuverType={resolved.maneuverType as any}
            laneCount={resolved.laneCount}
            showManeuverDirection={resolved.showManeuverDirection ?? true}
            showGuideLane={resolved.showGuideLane ?? true}
            arrowColor={resolved.arrowColor || component.staticProps?.arrowColor}
            horizonColor={resolved.horizonColor || component.staticProps?.horizonColor}
            guideLaneColor={resolved.guideLaneColor || component.staticProps?.guideLaneColor}
            highwayBadgeColor={resolved.highwayBadgeColor || component.staticProps?.highwayBadgeColor}
            groundColor={resolved.groundColor || component.staticProps?.groundColor}
            skyColor={resolved.skyColor || component.staticProps?.skyColor}
            horizonGlowColor={resolved.horizonGlowColor || component.staticProps?.horizonGlowColor}
            horizonGlowIntensity={resolved.horizonGlowIntensity ?? component.staticProps?.horizonGlowIntensity}
            horizonGlowSpread={resolved.horizonGlowSpread ?? component.staticProps?.horizonGlowSpread}
            horizonGlowBalance={resolved.horizonGlowBalance ?? component.staticProps?.horizonGlowBalance}
            horizonBoundaryColor={resolved.horizonBoundaryColor || component.staticProps?.horizonBoundaryColor}
            horizonBoundaryOpacity={resolved.horizonBoundaryOpacity ?? component.staticProps?.horizonBoundaryOpacity}
            roadColor={resolved.roadColor || component.staticProps?.roadColor}
            highwayBadgeTextColor={resolved.highwayBadgeTextColor || component.staticProps?.highwayBadgeTextColor}
            streetTitleColor={resolved.streetTitleColor || component.staticProps?.streetTitleColor}
            instructionTextColor={resolved.instructionTextColor || component.staticProps?.instructionTextColor}
            distanceTextColor={resolved.distanceTextColor || component.staticProps?.distanceTextColor}
            backgroundColor={resolved.backgroundColor || component.staticProps?.backgroundColor}
            width={component.width}
            height={component.height}
          />
        </div>
      );
    }

    case 'phoneContacts': {
      return (
        <PhoneContactsWidget
          component={component}
          resolved={resolved}
          isSelected={isSelected}
          customColor={customColor}
          baseOpacity={baseOpacity}
          styleOpacity={styleOpacity}
        />
      );
    }

    case 'phoneDialPad': {
      return (
        <PhoneDialPadWidget
          component={component}
          resolved={resolved}
          isSelected={isSelected}
          customColor={customColor}
          baseOpacity={baseOpacity}
          styleOpacity={styleOpacity}
        />
      );
    }

    case 'phoneMessaging': {
      return (
        <PhoneMessagingWidget
          component={component}
          resolved={resolved}
          isSelected={isSelected}
          customColor={customColor}
          baseOpacity={baseOpacity}
          styleOpacity={styleOpacity}
        />
      );
    }

    case 'climateVent': {
      return (
        <ClimateVentWidget
          component={component}
          resolved={resolved}
          isSelected={isSelected}
          customColor={customColor}
          baseOpacity={baseOpacity}
          styleOpacity={styleOpacity}
        />
      );
    }

    case 'climateTemp': {
      return (
        <ClimateTempWidget
          component={component}
          resolved={resolved}
          isSelected={isSelected}
          customColor={customColor}
          baseOpacity={baseOpacity}
          styleOpacity={styleOpacity}
        />
      );
    }

    case 'climateSeats': {
      return (
        <ClimateSeatsWidget
          component={component}
          resolved={resolved}
          isSelected={isSelected}
          customColor={customColor}
          baseOpacity={baseOpacity}
          styleOpacity={styleOpacity}
        />
      );
    }

    case 'vehicleExplodedView': {
      return (
        <VehicleExplodedViewWidget
          component={component}
          resolved={resolved}
          isSelected={isSelected}
          isPresentation={isPresentation}
          customColor={customColor}
          baseOpacity={baseOpacity}
          styleOpacity={styleOpacity}
        />
      );
    }

    case 'vehicleStatusCallout': {
      return (
        <VehicleStatusCalloutWidget
          component={component}
          resolved={resolved}
          isSelected={isSelected}
          isPresentation={isPresentation}
          customColor={customColor}
          baseOpacity={baseOpacity}
          styleOpacity={styleOpacity}
          onSelectAnchor={(anchor) => {
            const currentConnector = component.connector;
            if (currentConnector) {
              useMockpitStore.getState().updateComponentConnector(component.id, {
                ...currentConnector,
                sourceAnchor: anchor,
              });
            } else {
              // If there's an exploded view on the canvas, connect to the first one by default
              const screenComponents = useMockpitStore.getState().components;
              const exploded = screenComponents.find((c) => c.type === 'vehicleExplodedView');
              if (exploded) {
                useMockpitStore.getState().updateComponentConnector(component.id, {
                  sourceAnchor: anchor,
                  targetComponentId: exploded.id,
                  targetX: 0.5,
                  targetY: 0.5,
                });
              }
            }
          }}
        />
      );
    }

    case 'sendToServiceCenter': {
      return (
        <SendToServiceWidget
          component={component}
          resolved={resolved}
          isSelected={isSelected}
          isPresentation={isPresentation}
          customColor={customColor}
          baseOpacity={baseOpacity}
          styleOpacity={styleOpacity}
        />
      );
    }

    default:
      return (
        <div
          className={`w-full h-full rounded-2xl bg-slate-900 border border-slate-800 p-4 text-white ${baseOpacity}`}
          style={{ opacity: styleOpacity }}
        >
          {component.type}
        </div>
      );
  }
};
