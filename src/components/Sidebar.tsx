import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  ChevronDown,
  ChevronUp,
  Trash2,
  LayoutGrid,
  Bell,
  MapPin,
  Music,
  Phone,
  Thermometer,
  Car,
} from 'lucide-react';
import { useMockpitStore } from '../store/useMockpitStore';
import { ComponentType, NotificationStackPosition } from '../types';
import { COMPONENT_FLAGS } from '../config/componentFlags';
import { COMPONENT_META } from '../config/componentMeta';

interface ComponentLibraryItem {
  type: ComponentType;
  title: string;
  description: string;
  defaultBindingDesc: string;
}

const NOTIFICATION_LIBRARY_ITEMS: ComponentLibraryItem[] = [
  {
    type: 'warning',
    title: 'Warning Alert Overlay',
    description: 'Pop-up warning overlay on critical event',
    defaultBindingDesc: 'visible → true when speed > 85 mph',
  },
];

const HOME_WIDGET_ITEMS: ComponentLibraryItem[] = [
  {
    type: 'battery',
    title: 'Battery Indicator',
    description: 'High voltage EV battery level gauge',
    defaultBindingDesc: 'color → red when battery < 15%',
  },
  {
    type: 'gear',
    title: 'Gear Indicator',
    description: 'Drive mode gear selector (P/R/N/D)',
    defaultBindingDesc: 'text → current gear state (P/R/N/D)',
  },
  {
    type: 'speed',
    title: 'Speedometer',
    description: 'Digital velocity display in mph or km/h',
    defaultBindingDesc: 'text → bound live to speed',
  },
  ...(COMPONENT_FLAGS.climate
    ? [
        {
          type: 'climate' as ComponentType,
          title: 'Climate Control',
          description: 'Cabin temp display & fan speed controls',
          defaultBindingDesc: 'climate HVAC temperature shell',
        },
      ]
    : []),
  ...(COMPONENT_FLAGS.driveMode
    ? [
        {
          type: 'driveMode' as ComponentType,
          title: 'Drive Mode Selector',
          description: 'Vehicle dynamics mode (Eco/Normal/Sport)',
          defaultBindingDesc: 'drive mode selection shell',
        },
      ]
    : []),
  ...(COMPONENT_FLAGS.tirePressure
    ? [
        {
          type: 'tirePressure' as ComponentType,
          title: 'Tire Pressure Monitor',
          description: '4-wheel TPMS PSI pressure layout',
          defaultBindingDesc: 'TPMS tire pressure monitor shell',
        },
      ]
    : []),
];

const NAVIGATION_WIDGET_ITEMS: ComponentLibraryItem[] = [
  {
    type: 'map',
    title: 'Navigation Map',
    description: 'Static center display map tile with pin',
    defaultBindingDesc: 'static geolocation map display',
  },
  {
    type: 'navFavorites',
    title: 'Favorites',
    description: 'Saved favorite places & recent destinations with one-tap routing',
    defaultBindingDesc: 'Favorites & recents list with one-tap guidance',
  },
  {
    type: 'navDestination',
    title: 'Trip Planner',
    description: 'Destination & multi-stop trip planning, with live distance, time, energy and arrival charge once guidance starts',
    defaultBindingDesc: 'Multi-stop trip planner with live trip estimate sync',
  },
  {
    type: 'navSearch',
    title: 'Navigation Search',
    description: 'POIs, chargers & restaurant search with mock results',
    defaultBindingDesc: 'Filtered static sample POI/charger search',
  },
  {
    type: 'overheadVisualization',
    title: 'Overhead Driving Visualization',
    description: 'Top-down ADAS driving environment & spatial visualization',
    defaultBindingDesc: 'Spatial top-down ADAS road & traffic visualization',
  },
  {
    type: 'miniNav',
    title: 'Mini Nav',
    description: 'First-person perspective road with bold glanceable maneuver arrow',
    defaultBindingDesc: 'Perspective road maneuver guide linked to journey state',
  },
];

const MEDIA_WIDGET_ITEMS: ComponentLibraryItem[] = [
  ...(COMPONENT_FLAGS.media
    ? [
        {
          type: 'media' as ComponentType,
          title: 'Music Media Player',
          description: 'Multi-service music player with library, search & playback',
          defaultBindingDesc: 'Self-contained music player UI',
        },
        {
          type: 'nowPlaying' as ComponentType,
          title: 'Now Playing',
          description: 'Compact now playing card with cover art, playback controls & auto-dismiss',
          defaultBindingDesc: 'Media now playing playback widget',
        },
        {
          type: 'mediaPlaylists' as ComponentType,
          title: 'Playlists',
          description: 'Provider-synchronized playlist grid with art thumbnails & track counts',
          defaultBindingDesc: 'Streaming service playlists simulation',
        },
        {
          type: 'mediaDiscovery' as ComponentType,
          title: 'Discovery',
          description: 'Visual album-art discovery with Trending ranks and For You suggestions',
          defaultBindingDesc: 'Trending and curated suggestions discovery',
        },
        {
          type: 'mediaSearch' as ComponentType,
          title: 'Music Search',
          description: 'Resizable cross-source music, podcast & audiobook search simulating NLU lookup, voice input & ambient recognition',
          defaultBindingDesc: 'Simulated cross-source catalog search & mocked NLU lookup',
        },
      ]
    : []),
];

const PHONE_WIDGET_ITEMS: ComponentLibraryItem[] = [
  {
    type: 'phoneContacts',
    title: 'Contacts',
    description: 'Search, favorites strip, A-Z index & call/message detail',
    defaultBindingDesc: 'Alphabetical contacts list with favorites rail',
  },
  {
    type: 'phoneDialPad',
    title: 'Dial Pad',
    description: '3x4 keypad, contact lookup, hold-clear & in-call timer',
    defaultBindingDesc: 'Phone dialer keypad & recent call logs',
  },
  {
    type: 'phoneMessaging',
    title: 'Messaging',
    description: 'Conversation threads, quick reply chips & voice mic',
    defaultBindingDesc: 'SMS messaging inbox & thread view',
  },
];

const CLIMATE_WIDGET_ITEMS: ComponentLibraryItem[] = [
  {
    type: 'climateVent',
    title: 'Vent Dashboard',
    description: 'Spatial vents with drag-to-aim 8-preset snapping & airflow',
    defaultBindingDesc: 'Dashboard vent direction & slat controls',
  },
  {
    type: 'climateTemp',
    title: 'Temperature',
    description: 'Vertical slider with mercury fill gradient & color-shifting puck',
    defaultBindingDesc: 'Temperature slider control',
  },
  {
    type: 'climateSeats',
    title: 'Seat Climate',
    description: 'Independent Heat/Cool controls per seat with stacked icons',
    defaultBindingDesc: 'Driver & Passenger seat heating/cooling',
  },
];

const VEHICLE_WIDGET_ITEMS: ComponentLibraryItem[] = [
  {
    type: 'vehicleExplodedView',
    title: 'Exploded View',
    description: 'Interactive vehicle exploded chassis & component diagram',
    defaultBindingDesc: 'Diagnostic vehicle exploded view layer',
  },
  {
    type: 'vehicleStatusCallout',
    title: 'Status Callout',
    description: 'System health card with connector line to vehicle diagram',
    defaultBindingDesc: 'Diagnostic callout & target anchor line',
  },
  {
    type: 'sendToServiceCenter',
    title: 'Send Vehicle Diagnostics',
    description: 'Dispatches active diagnostic status & generates real exportable JSON report',
    defaultBindingDesc: 'Simulated send & real JSON file export',
  },
];

const CATEGORIES = [
  {
    key: 'home',
    title: 'Dashboard',
    icon: LayoutGrid,
    iconColorClass: 'text-sky-400',
    items: HOME_WIDGET_ITEMS,
  },
  {
    key: 'navigation',
    title: 'Navigation',
    icon: MapPin,
    iconColorClass: 'text-emerald-400',
    items: NAVIGATION_WIDGET_ITEMS,
  },
  {
    key: 'vehicle',
    title: 'Vehicle',
    icon: Car,
    iconColorClass: 'text-cyan-400',
    items: VEHICLE_WIDGET_ITEMS,
  },
  {
    key: 'media',
    title: 'Media',
    icon: Music,
    iconColorClass: 'text-pink-400',
    items: MEDIA_WIDGET_ITEMS,
  },
  {
    key: 'phone',
    title: 'Phone',
    icon: Phone,
    iconColorClass: 'text-purple-400',
    items: PHONE_WIDGET_ITEMS,
  },
  {
    key: 'climate',
    title: 'Climate',
    icon: Thermometer,
    iconColorClass: 'text-orange-400',
    items: CLIMATE_WIDGET_ITEMS,
  },
];

export const Sidebar: React.FC = () => {
  const addComponent = useMockpitStore((s) => s.addComponent);
  const activeView = useMockpitStore((s) => s.activeView);
  const notificationComponents = useMockpitStore((s) => s.notificationComponents);
  const notificationStackPosition = useMockpitStore((s) => s.notificationStackPosition);
  const setNotificationStackPosition = useMockpitStore((s) => s.setNotificationStackPosition);
  const reorderNotificationComponent = useMockpitStore((s) => s.reorderNotificationComponent);
  const deleteComponent = useMockpitStore((s) => s.deleteComponent);
  const selectComponent = useMockpitStore((s) => s.selectComponent);
  const selectedComponentId = useMockpitStore((s) => s.selectedComponentId);

  const categoryHeaderRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const [activeCategory, setActiveCategory] = useState<string | null>(() => {
    if (activeView === 'home') return 'home';
    if (activeView === 'navigation') return 'navigation';
    if (activeView === 'media') return 'media';
    if (activeView === 'phone') return 'phone';
    return null;
  });

  // Default expand/collapse state follows the active screen view
  useEffect(() => {
    if (activeView === 'home') setActiveCategory('home');
    else if (activeView === 'navigation') setActiveCategory('navigation');
    else if (activeView === 'media') setActiveCategory('media');
    else if (activeView === 'phone') setActiveCategory('phone');
  }, [activeView]);

  const toggleCategory = (catKey: string) => {
    setActiveCategory((prev) => {
      const next = prev === catKey ? null : catKey;
      if (next) {
        setTimeout(() => {
          categoryHeaderRefs.current[next]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 0);
      }
      return next;
    });
  };

  const handleDragStart = (e: React.DragEvent, type: ComponentType) => {
    e.dataTransfer.setData('application/mockpit-component-type', type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleAddNotification = () => {
    const id = addComponent('warning');
    selectComponent(id);
    setActiveCategory('notifications');
    setTimeout(() => {
      categoryHeaderRefs.current['notifications']?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  };

  const totalComponentsCount =
    CATEGORIES.reduce((acc, cat) => acc + cat.items.length, 0) +
    NOTIFICATION_LIBRARY_ITEMS.length;

  return (
    <div className="w-80 h-full bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 overflow-y-auto custom-scrollbar">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40 shrink-0 select-none">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-sky-400">
            COMPONENTS
          </span>
          <h2 className="text-sm font-bold text-slate-100 font-mono">
            Component Library
          </h2>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-sky-300 border border-slate-700">
          {totalComponentsCount} items
        </span>
      </div>

      {/* Notifications Category */}
      <div
        ref={(el) => { categoryHeaderRefs.current['notifications'] = el; }}
        className="border-b border-slate-800 shrink-0"
      >
        <div
          onClick={() => toggleCategory('notifications')}
          className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-slate-800/50 transition-colors select-none bg-slate-900/90"
        >
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-slate-800 border border-slate-700/80 text-amber-400">
              <Bell className="w-4 h-4" />
            </div>
            <h2 className="text-xs font-bold text-slate-200 tracking-wider uppercase font-mono">
              Notifications
            </h2>
          </div>

          <div className="text-slate-400 hover:text-slate-200 transition-colors">
            {activeCategory === 'notifications' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>

        {/* Notifications Expanded Content */}
        {activeCategory === 'notifications' && (
          <div className="p-3 space-y-3 bg-slate-950/40 border-t border-slate-800/60">
            {/* Global Stack Position Selector */}
            <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
              <label className="text-[10px] font-mono font-bold text-slate-400 uppercase block mb-1.5">
                Global Stack Position
              </label>
              <div className="grid grid-cols-3 gap-1">
                {(
                  [
                    { id: 'top-center', label: 'Top Ctr' },
                    { id: 'top-right', label: 'Top R' },
                    { id: 'bottom-center', label: 'Btm Ctr' },
                  ] as const
                ).map((pos) => (
                  <button
                    key={pos.id}
                    onClick={() => setNotificationStackPosition(pos.id as NotificationStackPosition)}
                    className={`py-1 px-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer truncate ${
                      notificationStackPosition === pos.id
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    {pos.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Component Template Cards for Notifications */}
            {NOTIFICATION_LIBRARY_ITEMS.map((item) => {
              const Icon = COMPONENT_META[item.type]?.icon || LayoutGrid;
              const color = COMPONENT_META[item.type]?.defaultColor || '#f59e0b';
              return (
                <div
                  key={item.type}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item.type)}
                  className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 hover:border-amber-500/50 hover:bg-slate-800 transition-all cursor-grab active:cursor-grabbing group shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="p-2 rounded-lg bg-slate-900 border border-slate-700/80 group-hover:scale-105 transition-transform"
                        style={{ color }}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-200 group-hover:text-amber-400 transition-colors">
                          {item.title}
                        </h3>
                        <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleAddNotification()}
                      className="p-1.5 rounded-lg bg-slate-700/60 text-slate-300 hover:bg-amber-500 hover:text-slate-950 transition-colors shrink-0 cursor-pointer"
                      title="Add notification"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}

            {/* List of Configured Notification Instances */}
            {notificationComponents.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider px-1">
                  Active Stack ({notificationComponents.length})
                </div>
                {notificationComponents.map((comp, idx) => {
                  const isSelected = selectedComponentId === comp.id;
                  const primaryBinding = comp.bindings[0];
                  let summaryText = 'Condition-bound (no binding)';
                  if (comp.staticProps?.triggerMode === 'event') {
                    summaryText = `Event: ${comp.staticProps?.triggerEvent || 'transition'}`;
                  } else if (primaryBinding) {
                    summaryText = `If ${primaryBinding.stateField} ${primaryBinding.condition} ${primaryBinding.value} → ${primaryBinding.targetProp}`;
                    if (comp.bindings.length > 1) {
                      summaryText += ` (+${comp.bindings.length - 1})`;
                    }
                  }

                  return (
                    <div
                      key={comp.id}
                      onClick={() => selectComponent(comp.id)}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer text-xs ${
                        isSelected
                          ? 'bg-slate-800/90 border-sky-400 ring-1 ring-sky-400/30 shadow-md'
                          : 'bg-slate-800/40 border-slate-700/60 hover:border-slate-600 hover:bg-slate-800/70'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 shrink-0">
                            #{idx + 1}
                          </span>
                          <span className="font-bold text-slate-200 truncate">
                            {comp.staticProps.message || 'VEHICLE ALERT'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            disabled={idx === 0}
                            onClick={() => reorderNotificationComponent(comp.id, 'up')}
                            className="p-1 rounded bg-slate-900 text-slate-400 hover:text-sky-400 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                            title="Move Up"
                          >
                            <ChevronUp className="w-3 h-3" />
                          </button>
                          <button
                            disabled={idx === notificationComponents.length - 1}
                            onClick={() => reorderNotificationComponent(comp.id, 'down')}
                            className="p-1 rounded bg-slate-900 text-slate-400 hover:text-sky-400 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                            title="Move Down"
                          >
                            <ChevronDown className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => deleteComponent(comp.id)}
                            className="p-1 rounded bg-slate-900 text-rose-400 hover:bg-rose-500 hover:text-white transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-1.5 pt-1.5 border-t border-slate-700/40 flex items-center justify-between text-[10px] font-mono">
                        <span className="truncate text-slate-400">{summaryText}</span>
                        <span className="text-sky-400 shrink-0 font-semibold hover:underline">Edit &rarr;</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Screen Widget Categories (All visible on every screen) */}
      {CATEGORIES.map((category) => {
        const CategoryIcon = category.icon;
        const isOpen = activeCategory === category.key;

        return (
          <div
            key={category.key}
            ref={(el) => { categoryHeaderRefs.current[category.key] = el; }}
            className="border-b border-slate-800 shrink-0"
          >
            <div
              onClick={() => toggleCategory(category.key)}
              className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-slate-800/50 transition-colors select-none bg-slate-900/90"
            >
              <div className="flex items-center gap-2.5">
                <div className={`p-1.5 rounded-lg bg-slate-800 border border-slate-700/80 ${category.iconColorClass}`}>
                  <CategoryIcon className="w-4 h-4" />
                </div>
                <h2 className="text-xs font-bold text-slate-200 tracking-wider uppercase font-mono">
                  {category.title}
                </h2>
              </div>

              <div className="text-slate-400 hover:text-slate-200 transition-colors">
                {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </div>

            {/* Category Components List */}
            {isOpen && (
              <div className="p-3 space-y-3 bg-slate-950/20">
                {category.items.length === 0 ? (
                  <p className="text-xs text-slate-500 italic px-1 py-1">No components available.</p>
                ) : (
                  category.items.map((item) => {
                    const Icon = COMPONENT_META[item.type]?.icon || LayoutGrid;
                    const color = COMPONENT_META[item.type]?.defaultColor || '#38bdf8';
                    return (
                      <div
                        key={item.type}
                        draggable
                        onDragStart={(e) => handleDragStart(e, item.type)}
                        className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 hover:border-sky-500/50 hover:bg-slate-800 transition-all cursor-grab active:cursor-grabbing group shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="p-2 rounded-lg bg-slate-900 border border-slate-700/80 group-hover:scale-105 transition-transform"
                              style={{ color }}
                            >
                              <Icon className="w-5 h-5" />
                            </div>
                            <div>
                              <h3 className="text-sm font-bold text-slate-200 group-hover:text-sky-400 transition-colors">
                                {item.title}
                              </h3>
                              <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                                {item.description}
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={() => addComponent(item.type)}
                            className="p-1.5 rounded-lg bg-slate-700/60 text-slate-300 hover:bg-sky-500 hover:text-slate-950 transition-colors shrink-0 cursor-pointer"
                            title="Add to canvas"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        );
      })}

    </div>
  );
};


