import React, { useState, useEffect } from 'react';
import {
  Battery,
  Gauge,
  MapPin,
  Plus,
  Zap,
  Music,
  Thermometer,
  Phone,
  Compass,
  CircleDot,
  Bell,
  ChevronDown,
  ChevronUp,
  Trash2,
  AlertTriangle,
  LayoutGrid,
} from 'lucide-react';
import { useMockpitStore } from '../store/useMockpitStore';
import { ComponentType, NotificationStackPosition } from '../types';
import { COMPONENT_FLAGS } from '../config/componentFlags';

interface ComponentLibraryItem {
  type: ComponentType;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  defaultBindingDesc: string;
}

const NOTIFICATION_LIBRARY_ITEMS: ComponentLibraryItem[] = [
  {
    type: 'warning',
    title: 'Warning / Alert Overlay',
    description: 'Pop-up warning overlay on critical event',
    icon: AlertTriangle,
    color: '#f59e0b',
    defaultBindingDesc: 'visible → true when speed > 85 mph',
  },
];

const HOME_WIDGET_ITEMS: ComponentLibraryItem[] = [
  {
    type: 'battery',
    title: 'Battery Indicator',
    description: 'High voltage EV battery level gauge',
    icon: Battery,
    color: '#22c55e',
    defaultBindingDesc: 'color → red when battery < 15%',
  },
  {
    type: 'gear',
    title: 'Gear Indicator',
    description: 'Drive mode gear selector (P/R/N/D)',
    icon: Gauge,
    color: '#f8fafc',
    defaultBindingDesc: 'text → current gear state (P/R/N/D)',
  },
  {
    type: 'speed',
    title: 'Speed Readout',
    description: 'Digital velocity display in mph or km/h',
    icon: Gauge,
    color: '#38bdf8',
    defaultBindingDesc: 'text → bound live to speed',
  },
  {
    type: 'subnav',
    title: 'Sub-Navigation Bar',
    description: 'Dynamic tab row for switching child screens',
    icon: LayoutGrid,
    color: '#38bdf8',
    defaultBindingDesc: 'Dynamic tabs for current screen children',
  },
  {
    type: 'charging',
    title: 'Charging Badge',
    description: 'Active EV charging status pill',
    icon: Zap,
    color: '#3b82f6',
    defaultBindingDesc: 'visible → true when isCharging === true',
  },
  ...(COMPONENT_FLAGS.climate
    ? [
        {
          type: 'climate' as ComponentType,
          title: 'Climate Control',
          description: 'Cabin temp display & fan speed controls',
          icon: Thermometer,
          color: '#f97316',
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
          icon: Compass,
          color: '#06b6d4',
          defaultBindingDesc: 'drive mode selection shell',
        },
      ]
    : []),
  ...(COMPONENT_FLAGS.tirePressure
    ? [
        {
          type: 'tirePressure' as ComponentType,
          title: 'Tire Pressure Display',
          description: '4-wheel TPMS PSI pressure layout',
          icon: CircleDot,
          color: '#eab308',
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
    icon: MapPin,
    color: '#38bdf8',
    defaultBindingDesc: 'static geolocation map display',
  },
  {
    type: 'navHome',
    title: 'Home Address',
    description: 'Stored home location text & Lat/Lng coordinates',
    icon: MapPin,
    color: '#38bdf8',
    defaultBindingDesc: 'Stored text & lat-lng location card',
  },
  {
    type: 'navDestination',
    title: 'Destination & Waypoints',
    description: 'Destination input with ordered multi-stop trip list',
    icon: Compass,
    color: '#f59e0b',
    defaultBindingDesc: 'Multi-stop trip waypoint manager',
  },
  {
    type: 'navSearch',
    title: 'Search Map',
    description: 'POIs, chargers & restaurant search with mock results',
    icon: MapPin,
    color: '#10b981',
    defaultBindingDesc: 'Filtered static sample POI/charger search',
  },
  {
    type: 'navTripEstimate',
    title: 'Trip Estimate',
    description: 'Straight-line Haversine mileage & battery consumption',
    icon: Zap,
    color: '#a855f7',
    defaultBindingDesc: 'Straight-line distance & battery estimate',
  },
];

const MEDIA_WIDGET_ITEMS: ComponentLibraryItem[] = [
  ...(COMPONENT_FLAGS.media
    ? [
        {
          type: 'media' as ComponentType,
          title: 'Media Player',
          description: 'Audio track playback & media controls',
          icon: Music,
          color: '#ec4899',
          defaultBindingDesc: 'media track & controls shell',
        },
      ]
    : []),
];

const PHONE_WIDGET_ITEMS: ComponentLibraryItem[] = [
  ...(COMPONENT_FLAGS.phone
    ? [
        {
          type: 'phone' as ComponentType,
          title: 'Phone / Contacts',
          description: 'Active phone call & contact display',
          icon: Phone,
          color: '#a855f7',
          defaultBindingDesc: 'phone connection status shell',
        },
      ]
    : []),
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

  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>(() => ({
    notifications: false,
    home: activeView === 'home',
    navigation: activeView === 'navigation',
    media: activeView === 'media',
    phone: activeView === 'phone',
  }));

  // Default expand/collapse state follows the active screen view
  useEffect(() => {
    setOpenCategories({
      notifications: false,
      home: activeView === 'home',
      navigation: activeView === 'navigation',
      media: activeView === 'media',
      phone: activeView === 'phone',
    });
  }, [activeView]);

  const toggleCategory = (catKey: string) => {
    setOpenCategories((prev) => ({
      ...prev,
      [catKey]: !prev[catKey],
    }));
  };

  const handleDragStart = (e: React.DragEvent, type: ComponentType) => {
    e.dataTransfer.setData('application/mockpit-component-type', type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleAddNotification = () => {
    const id = addComponent('warning');
    selectComponent(id);
    setOpenCategories((prev) => ({ ...prev, notifications: true }));
  };

  const totalComponentsCount =
    HOME_WIDGET_ITEMS.length +
    NAVIGATION_WIDGET_ITEMS.length +
    MEDIA_WIDGET_ITEMS.length +
    PHONE_WIDGET_ITEMS.length +
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
      <div className="border-b border-slate-800 shrink-0">
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
            {openCategories.notifications ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>

        {/* Notifications Expanded Content */}
        {openCategories.notifications && (
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
              const Icon = item.icon;
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
                        style={{ color: item.color }}
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

                  {/* Pre-wired Binding Hint */}
                  <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                    <span className="truncate">{item.defaultBindingDesc}</span>
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
        const isOpen = !!openCategories[category.key];

        return (
          <div key={category.key} className="border-b border-slate-800 shrink-0">
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
                    const Icon = item.icon;
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
                              style={{ color: item.color }}
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

                        {/* Pre-wired Binding Hint */}
                        <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                          <span className="truncate">{item.defaultBindingDesc}</span>
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

      {/* Footer Info */}
      <div className="mt-auto p-3 border-t border-slate-800/80 bg-slate-950/60 text-[11px] text-slate-400 text-center font-mono shrink-0">
        {totalComponentsCount} Canvas Components Available
      </div>
    </div>
  );
};


