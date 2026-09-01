import React, { useRef, useState, useEffect } from 'react';
import { ComponentRenderer, renderNotificationIcon } from './ComponentRenderer';
import { BottomDock } from './BottomDock';
import { VehicleBackground } from './VehicleBackground';
import { VirtualKeyboard } from './VirtualKeyboard';
import { ConnectorLayer } from './vehicle/ConnectorLayer';
import { useMockpitStore } from '../store/useMockpitStore';
import { ActiveView, ComponentInstance, NotificationStackPosition, TransitionStyle, TEXT_SCALE_FACTORS } from '../types';
import { COMPONENT_FLAGS } from '../config/componentFlags';
import { CANVAS_WIDTH, CANVAS_HEIGHT, FOCUSED_APP_RECT } from '../config/constants';
import { getResolvedProps } from '../lib/bindingEvaluator';
import { ContactAvatar } from './ContactAvatar';
import { WeatherForecastScreen } from './weather/WeatherForecastScreen';
import { WeatherRadarScreen } from './weather/WeatherRadarScreen';
import { useWeatherStore } from '../store/useWeatherStore';
import { Move, Maximize2, Trash2, LayoutGrid, MapPin, Music, Phone, Layout, MessageSquare, Battery, Zap } from 'lucide-react';

const getTransitionClasses = (style: TransitionStyle = 'fade', isActive: boolean) => {
  if (!isActive) {
    switch (style) {
      case 'slideUp':
        return 'opacity-0 translate-y-16 scale-100 pointer-events-none';
      case 'slideDown':
        return 'opacity-0 -translate-y-16 scale-100 pointer-events-none';
      case 'slideLeft':
        return 'opacity-0 translate-x-16 scale-100 pointer-events-none';
      case 'slideRight':
        return 'opacity-0 -translate-x-16 scale-100 pointer-events-none';
      case 'fade':
      default:
        return 'opacity-0 scale-95 pointer-events-none';
    }
  }

  switch (style) {
    case 'slideUp':
    case 'slideDown':
      return 'opacity-100 translate-y-0 scale-100 pointer-events-auto';
    case 'slideLeft':
    case 'slideRight':
      return 'opacity-100 translate-x-0 scale-100 pointer-events-auto';
    case 'fade':
    default:
      return 'opacity-100 scale-100 pointer-events-auto';
  }
};

interface FocusedAppScreenProps {
  activeView: string;
  screens: any[];
  focusedAppComponents: ComponentInstance[];
  vehicleState: any;
}

const FocusedAppScreen: React.FC<FocusedAppScreenProps> = ({
  activeView,
  screens,
  focusedAppComponents,
  vehicleState,
}) => {
  const [isActive, setIsActive] = useState(false);
  const activeScreenDef = screens.find((s) => s.id === activeView);
  const transitionStyle = activeScreenDef?.transitionStyle || 'fade';
  const isHomeScreen = activeView === 'home';

  useEffect(() => {
    // Initial mount is inactive (exit/entry state), then transition to resting active state on next frame
    let animFrame2: number;
    const animFrame1 = requestAnimationFrame(() => {
      animFrame2 = requestAnimationFrame(() => {
        setIsActive(true);
      });
    });
    return () => {
      cancelAnimationFrame(animFrame1);
      cancelAnimationFrame(animFrame2);
    };
  }, []);

  const transitionClasses = getTransitionClasses(transitionStyle, isActive);
  const setActiveView = useMockpitStore((s) => s.setActiveView);

  // Preserve Home screen's full canvas footprint vs non-Home focused apps (FOCUSED_APP_RECT)
  const containerStyle = isHomeScreen
    ? {
        left: 0,
        top: 0,
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
      }
    : {
        left: FOCUSED_APP_RECT.x,
        top: FOCUSED_APP_RECT.y,
        width: FOCUSED_APP_RECT.width,
        height: FOCUSED_APP_RECT.height,
      };

  if (activeView === 'weather') {
    return (
      <div
        key={activeView}
        className={`absolute transition-all duration-300 ease-out z-20 overflow-hidden ${transitionClasses}`}
        style={containerStyle}
      >
        <WeatherForecastScreen
          onBack={() => {
            const prev = useMockpitStore.getState().previousView;
            setActiveView(prev && prev !== 'weather' ? prev : 'home');
          }}
        />
      </div>
    );
  }

  if (activeView === 'weather-radar') {
    return (
      <div
        key={activeView}
        className={`absolute transition-all duration-300 ease-out z-20 overflow-hidden ${transitionClasses}`}
        style={containerStyle}
      >
        <WeatherRadarScreen
          onBack={() => {
            setActiveView('weather');
          }}
        />
      </div>
    );
  }

  return (
    <div
      key={activeView}
      className={`absolute transition-all duration-300 ease-out z-10 overflow-hidden ${transitionClasses}`}
      style={containerStyle}
    >
      {focusedAppComponents.length > 0 ? (
        <div className="relative w-full h-full overflow-hidden">
          {[...focusedAppComponents]
            .sort((a, b) => {
              const zA = a.zIndex !== undefined ? a.zIndex : (a.type === 'map' ? 0 : a.type === 'nowPlaying' ? 20 : 10);
              const zB = b.zIndex !== undefined ? b.zIndex : (b.type === 'map' ? 0 : b.type === 'nowPlaying' ? 20 : 10);
              if (zA !== zB) return zA - zB;
              return focusedAppComponents.indexOf(a) - focusedAppComponents.indexOf(b);
            })
            .map((comp) => {
              const baseZ = comp.zIndex !== undefined ? comp.zIndex : (comp.type === 'map' ? 0 : comp.type === 'nowPlaying' ? 20 : 10);
              const offsetX = isHomeScreen ? 0 : FOCUSED_APP_RECT.x;
              const offsetY = isHomeScreen ? 0 : FOCUSED_APP_RECT.y;
              return (
                <div
                  key={comp.id}
                  className="absolute pointer-events-auto"
                  style={{
                    left: comp.x - offsetX,
                    top: comp.y - offsetY,
                    width: comp.width,
                    height: comp.height,
                    zIndex: baseZ,
                  }}
                >
                  <ComponentRenderer
                    component={comp}
                    vehicleState={vehicleState}
                    isSelected={false}
                    isPresentation={true}
                  />
                </div>
              );
            })}
        </div>
      ) : (
        /* Note: App screens start empty on reset until authored */
        <div className="w-full h-full rounded-2xl bg-slate-900/90 border border-slate-800/80 backdrop-blur-md p-8 flex flex-col items-center justify-center text-slate-400">
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-sky-400 mb-3">
            {activeView === 'navigation' && <MapPin className="w-10 h-10" />}
            {activeView === 'media' && <Music className="w-10 h-10" />}
            {activeView === 'phone' && <Phone className="w-10 h-10" />}
            {activeView !== 'navigation' && activeView !== 'media' && activeView !== 'phone' && (
              <Layout className="w-10 h-10" />
            )}
          </div>
          <h3 className="text-base font-bold text-slate-200 tracking-wider uppercase font-mono">
            {(activeScreenDef?.name || activeView).toUpperCase()} SCREEN IS EMPTY
          </h3>
          <p className="text-xs text-slate-500 max-w-sm text-center mt-1.5 font-mono">
            This screen starts empty until authored. Switch to Editor Mode and select this screen tab to add components.
          </p>
        </div>
      )}
    </div>
  );
};

// Default timeout for auto-minimizing full notification cards to small icons in header
export const AUTO_MINIMIZE_TIMEOUT_MS = 6000;

export const getSeverityRank = (severity?: string): number => {
  const s = (severity || '').toLowerCase();
  if (s === 'critical') return 3;
  if (s === 'warning') return 2;
  if (s === 'info') return 1;
  return 2;
};

const sortNotificationsBySeverity = (list: ComponentInstance[], vehicleState: any) => {
  return [...list].sort((a, b) => {
    const resA = getResolvedProps(a, vehicleState);
    const resB = getResolvedProps(b, vehicleState);
    const sevA = resA.severity || a.staticProps?.severity || 'warning';
    const sevB = resB.severity || b.staticProps?.severity || 'warning';
    const diff = getSeverityRank(sevB) - getSeverityRank(sevA);
    if (diff !== 0) return diff;
    return 0;
  });
};

function hexToRgba(hex: string, opacityPercent: number): string {
  let clean = (hex || '#38bdf8').replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  const num = parseInt(clean, 16);
  if (isNaN(num) || clean.length !== 6) {
    return `rgba(56, 189, 248, ${(opacityPercent ?? 20) / 100})`;
  }
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  const a = Math.max(0, Math.min(100, opacityPercent)) / 100;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

export const Canvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number>(0.6);

  const screens = useMockpitStore((s) => s.screens);
  const components = useMockpitStore((s) => s.components);
  const componentsByScreen = useMockpitStore((s) => s.componentsByScreen);
  const notificationComponents = useMockpitStore((s) => s.notificationComponents);
  const transientNotifications = useMockpitStore((s) => s.transientNotifications || []);
  const activeEventNotifIds = useMockpitStore((s) => s.activeEventNotifIds || []);
  const clearTransientNotification = useMockpitStore((s) => s.clearTransientNotification);
  const clearEventNotification = useMockpitStore((s) => s.clearEventNotification);
  const notificationStackPosition = useMockpitStore((s) => s.notificationStackPosition);
  const vehicleState = useMockpitStore((s) => s.vehicleState);
  const selectedComponentId = useMockpitStore((s) => s.selectedComponentId);
  const screenMode = useMockpitStore((s) => s.screenMode);
  const activeView = useMockpitStore((s) => s.activeView);
  const gridConfig = useMockpitStore((s) => s.gridConfig);
  const textScale = useMockpitStore((s) => s.textScale);
  const conversations = useMockpitStore((s) => s.conversations);
  const weatherCurrent = useWeatherStore((s) => s.current);
  const weatherUnit = useWeatherStore((s) => s.unit);

  const totalUnread = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
  const [batteryDisplayMode, setBatteryDisplayMode] = useState<'percent' | 'range'>('percent');

  const selectComponent = useMockpitStore((s) => s.selectComponent);
  const setActiveView = useMockpitStore((s) => s.setActiveView);
  const updateComponentPosition = useMockpitStore((s) => s.updateComponentPosition);
  const updateComponentSize = useMockpitStore((s) => s.updateComponentSize);
  const addComponent = useMockpitStore((s) => s.addComponent);
  const deleteComponent = useMockpitStore((s) => s.deleteComponent);

  const isPresentation = screenMode === 'presentation';

  const activeScreenDef = screens.find((s) => s.id === activeView);
  const activeScreenDisplayName = activeScreenDef ? activeScreenDef.name : activeView;

  // v0.11 Ambient simulation ticker in Presentation mode
  useEffect(() => {
    if (screenMode !== 'presentation') return;

    const interval = setInterval(() => {
      useMockpitStore.getState().ambientTick();
    }, 1500);

    return () => clearInterval(interval);
  }, [screenMode]);

  // Track minimized notifications by ID
  const [minimizedNotifIds, setMinimizedNotifIds] = useState<Record<string, boolean>>({});
  const autoMinimizeTimersRef = useRef<Record<string, NodeJS.Timeout>>({});

  // Active notifications evaluated against current vehicleState conditions + event notifications + transient notifications
  const activePersistentNotifications = notificationComponents.filter((comp) => {
    if (comp.staticProps?.triggerMode === 'event') {
      return activeEventNotifIds.includes(comp.id);
    }
    const resolved = getResolvedProps(comp, vehicleState);
    return resolved.visible !== 'false' && resolved.visible !== '0';
  });

  const activeNotifications = [...activePersistentNotifications, ...transientNotifications];

  const activeNotifIdsKey = activeNotifications.map((c) => c.id).sort().join(',');

  // Notification lifecycle: auto-minimize/auto-clear timer + cleanup on condition resolve
  useEffect(() => {
    if (!isPresentation) return;

    const activeIdsSet = new Set(activeNotifications.map((c) => c.id));

    // Clear timers for inactive notifications
    Object.keys(autoMinimizeTimersRef.current).forEach((id) => {
      if (!activeIdsSet.has(id)) {
        clearTimeout(autoMinimizeTimersRef.current[id]);
        delete autoMinimizeTimersRef.current[id];
      }
    });

    // Remove minimized state for resolved conditions
    setMinimizedNotifIds((prev) => {
      let changed = false;
      const next = { ...prev };
      Object.keys(next).forEach((id) => {
        if (!activeIdsSet.has(id)) {
          delete next[id];
          changed = true;
        }
      });
      return changed ? next : prev;
    });

    // Start auto-minimize / clear timer for newly active full notifications
    activeNotifications.forEach((comp) => {
      const isMinimized = !!minimizedNotifIds[comp.id];
      const hasTimer = !!autoMinimizeTimersRef.current[comp.id];

      if (!isMinimized && !hasTimer) {
        autoMinimizeTimersRef.current[comp.id] = setTimeout(() => {
          if (useMockpitStore.getState().isKeyboardVisible) {
            delete autoMinimizeTimersRef.current[comp.id];
            return;
          }
          if (comp.staticProps?.triggerMode === 'event') {
            clearEventNotification(comp.id);
          } else if (comp.isTransient) {
            if (comp.staticProps?.showBadgeOnMinimize === 'true') {
              setMinimizedNotifIds((prev) => ({ ...prev, [comp.id]: true }));
            } else {
              clearTransientNotification(comp.id);
            }
          } else {
            setMinimizedNotifIds((prev) => ({ ...prev, [comp.id]: true }));
          }
          delete autoMinimizeTimersRef.current[comp.id];
        }, AUTO_MINIMIZE_TIMEOUT_MS);
      }
    });
  }, [isPresentation, activeNotifIdsKey, minimizedNotifIds, clearTransientNotification, clearEventNotification]);

  const handleMinimizeNotification = (id: string) => {
    if (autoMinimizeTimersRef.current[id]) {
      clearTimeout(autoMinimizeTimersRef.current[id]);
      delete autoMinimizeTimersRef.current[id];
    }
    const comp = activeNotifications.find((c) => c.id === id);
    if (comp?.staticProps?.triggerMode === 'event') {
      clearEventNotification(id);
    } else if (comp?.isTransient) {
      if (comp?.staticProps?.showBadgeOnMinimize === 'true') {
        setMinimizedNotifIds((prev) => ({ ...prev, [id]: true }));
      } else {
        clearTransientNotification(id);
      }
    } else {
      setMinimizedNotifIds((prev) => ({ ...prev, [id]: true }));
    }
  };

  const handleExpandNotification = (id: string) => {
    if (autoMinimizeTimersRef.current[id]) {
      clearTimeout(autoMinimizeTimersRef.current[id]);
      delete autoMinimizeTimersRef.current[id];
    }
    setMinimizedNotifIds((prev) => ({ ...prev, [id]: false }));
    // Restart 6s timer when expanded back to full card
    autoMinimizeTimersRef.current[id] = setTimeout(() => {
      setMinimizedNotifIds((prev) => ({ ...prev, [id]: true }));
      delete autoMinimizeTimersRef.current[id];
    }, AUTO_MINIMIZE_TIMEOUT_MS);
  };

  // Dragging state
  const [dragInfo, setDragInfo] = useState<{
    id: string;
    startX: number;
    startY: number;
    initialCompX: number;
    initialCompY: number;
  } | null>(null);

  // Resizing state
  const [resizeInfo, setResizeInfo] = useState<{
    id: string;
    startX: number;
    startY: number;
    initialW: number;
    initialH: number;
  } | null>(null);

  // Compute container scaling
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const paddingX = isPresentation ? 32 : 48;
      const paddingY = isPresentation ? 32 : 64;

      const availWidth = rect.width - paddingX;
      const availHeight = rect.height - paddingY;

      const scaleX = availWidth / CANVAS_WIDTH;
      const scaleY = availHeight / CANVAS_HEIGHT;
      const fitScale = Math.min(scaleX, scaleY, isPresentation ? 1.0 : 0.85);

      setScale(Math.max(0.2, fitScale));
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const observer = new ResizeObserver(handleResize);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
    };
  }, [isPresentation]);

  // Handle Drag Move
  const handleMouseDown = (e: React.MouseEvent, id: string, compX: number, compY: number) => {
    if (isPresentation) return;
    e.stopPropagation();
    selectComponent(id);

    setDragInfo({
      id,
      startX: e.clientX,
      startY: e.clientY,
      initialCompX: compX,
      initialCompY: compY,
    });
  };

  // Handle Resize Move
  const handleResizeMouseDown = (e: React.MouseEvent, id: string, initialW: number, initialH: number) => {
    if (isPresentation) return;
    e.stopPropagation();
    selectComponent(id);

    setResizeInfo({
      id,
      startX: e.clientX,
      startY: e.clientY,
      initialW,
      initialH,
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (dragInfo) {
        const deltaX = (e.clientX - dragInfo.startX) / scale;
        const deltaY = (e.clientY - dragInfo.startY) / scale;

        const rawX = dragInfo.initialCompX + deltaX;
        const rawY = dragInfo.initialCompY + deltaY;

        let newX: number;
        let newY: number;

        if (gridConfig.snapToGrid && gridConfig.size > 0) {
          newX = Math.round(rawX / gridConfig.size) * gridConfig.size;
          newY = Math.round(rawY / gridConfig.size) * gridConfig.size;
        } else {
          newX = Math.round(rawX);
          newY = Math.round(rawY);
        }

        const currentComps = useMockpitStore.getState().components;
        const comp = currentComps.find((c) => c.id === dragInfo.id);
        const compW = comp?.width || 100;
        const compH = comp?.height || 50;

        newX = Math.max(0, Math.min(CANVAS_WIDTH - compW, newX));
        newY = Math.max(0, Math.min(CANVAS_HEIGHT - compH, newY));

        updateComponentPosition(dragInfo.id, newX, newY);
      }

      if (resizeInfo) {
        const deltaX = (e.clientX - resizeInfo.startX) / scale;
        const deltaY = (e.clientY - resizeInfo.startY) / scale;

        const rawW = resizeInfo.initialW + deltaX;
        const rawH = resizeInfo.initialH + deltaY;

        const currentComps = useMockpitStore.getState().components;
        const comp = currentComps.find((c) => c.id === resizeInfo.id);
        const compX = comp?.x ?? 0;
        const compY = comp?.y ?? 0;

        const maxW = Math.max(40, CANVAS_WIDTH - compX);
        const maxH = Math.max(40, CANVAS_HEIGHT - compY);

        let newW: number;
        let newH: number;

        if (gridConfig.snapToGrid && gridConfig.size > 0) {
          newW = Math.round(rawW / gridConfig.size) * gridConfig.size;
          newH = Math.round(rawH / gridConfig.size) * gridConfig.size;
          const minSize = Math.max(gridConfig.size, 40);
          newW = Math.max(minSize, Math.min(maxW, newW));
          newH = Math.max(minSize, Math.min(maxH, newH));
        } else {
          newW = Math.round(Math.max(40, Math.min(maxW, rawW)));
          newH = Math.round(Math.max(40, Math.min(maxH, rawH)));
        }

        updateComponentSize(resizeInfo.id, newW, newH);
      }
    };

    const handleMouseUp = () => {
      setDragInfo(null);
      setResizeInfo(null);
    };

    if (dragInfo || resizeInfo) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragInfo, resizeInfo, scale, gridConfig, updateComponentPosition, updateComponentSize]);

  // Handle HTML5 Drag and Drop from Sidebar
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (isPresentation) return;

    const type = e.dataTransfer.getData('application/mockpit-component-type');
    if (!type) return;

    const canvasRect = e.currentTarget.getBoundingClientRect();
    const rawX = (e.clientX - canvasRect.left) / scale - 140;
    const rawY = (e.clientY - canvasRect.top) / scale - 70;

    let x: number;
    let y: number;

    if (gridConfig.snapToGrid && gridConfig.size > 0) {
      x = Math.round(rawX / gridConfig.size) * gridConfig.size;
      y = Math.round(rawY / gridConfig.size) * gridConfig.size;
    } else {
      x = Math.round(rawX);
      y = Math.round(rawY);
    }

    x = Math.max(0, Math.min(CANVAS_WIDTH - 280, x));
    y = Math.max(0, Math.min(CANVAS_HEIGHT - 140, y));

    addComponent(type as any, x, y);
  };

  // Determine active presentation app screen components
  const focusedAppComponents = componentsByScreen[activeView] || [];

  return (
    <div
      ref={containerRef}
      className={`w-full h-full flex flex-col items-center justify-center relative overflow-hidden select-none bg-slate-950 ${
        isPresentation ? 'p-0' : 'p-4 gap-3'
      }`}
      onClick={() => selectComponent(null)}
    >
      {/* Outer Vehicle Center Display Frame */}
      <div
        className="relative bg-slate-950 border-8 border-slate-900 rounded-[32px] shadow-[0_0_50px_rgba(0,0,0,0.8)] flex-shrink-0 transition-all duration-300 overflow-hidden"
        style={{
          width: `${CANVAS_WIDTH * scale}px`,
          height: `${CANVAS_HEIGHT * scale}px`,
          minWidth: `${CANVAS_WIDTH * scale}px`,
          maxWidth: `${CANVAS_WIDTH * scale}px`,
          minHeight: `${CANVAS_HEIGHT * scale}px`,
          maxHeight: `${CANVAS_HEIGHT * scale}px`,
        }}
      >
        {/* Scaled Inner Canvas */}
        <div
          className="vehicle-hmi-canvas canvas-coordinate-space absolute inset-0 origin-top-left overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"
          style={{
            width: `${CANVAS_WIDTH}px`,
            height: `${CANVAS_HEIGHT}px`,
            minWidth: `${CANVAS_WIDTH}px`,
            maxWidth: `${CANVAS_WIDTH}px`,
            minHeight: `${CANVAS_HEIGHT}px`,
            maxHeight: `${CANVAS_HEIGHT}px`,
            transform: `scale(${scale})`,
            '--text-scale': TEXT_SCALE_FACTORS[textScale] || 1,
          } as React.CSSProperties}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {/* Custom Canvas Background Image */}
          {gridConfig.bgImage && (
            <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
              <img
                src={gridConfig.bgImage}
                alt="Canvas Background"
                className="w-full h-full object-cover"
                style={{ opacity: (gridConfig.bgOpacity ?? 40) / 100 }}
              />
            </div>
          )}

          {/* Global Vehicle Background Silhouette Layer */}
          <VehicleBackground />

          {/* Figma-Style Uniform Canvas Grid Overlay */}
          {!isPresentation && gridConfig.visible && (() => {
            // Map user opacity setting (0% - 100%) to actual alpha % (3% - 18%)
            // 0% setting -> 3% alpha (barely visible trace)
            // 50% setting -> 10.5% alpha (clearly visible)
            // 100% setting -> 18% alpha (full grid)
            const userOpacity = typeof gridConfig.opacity === 'number' ? gridConfig.opacity : 20;
            const alphaPercent = 3 + (Math.max(0, Math.min(100, userOpacity)) / 100) * 15;

            return (
              <div
                className="absolute inset-0 pointer-events-none z-[2]"
                style={{
                  backgroundImage: `
                    linear-gradient(to right, ${hexToRgba(gridConfig.color, alphaPercent)} 1px, transparent 1px),
                    linear-gradient(to bottom, ${hexToRgba(gridConfig.color, alphaPercent)} 1px, transparent 1px)
                  `,
                  backgroundSize: `${gridConfig.size}px ${gridConfig.size}px`,
                }}
              />
            );
          })()}

          {/* Infotainment Dashboard Header Bar */}
          <div className="absolute top-0 left-0 right-0 h-11 px-8 bg-slate-950/90 backdrop-blur border-b border-slate-800/60 flex items-center justify-between text-sm font-mono text-slate-400 z-30 pointer-events-auto">
            <div className="flex items-center gap-4">
              {/* Minimized Notifications Row */}
              {isPresentation && (() => {
                const minimizedNotifs = sortNotificationsBySeverity(
                  activeNotifications.filter(
                    (comp) =>
                      comp.staticProps?.triggerMode !== 'event' &&
                      (!comp.isTransient || comp.staticProps?.showBadgeOnMinimize === 'true') &&
                      !!minimizedNotifIds[comp.id]
                  ),
                  vehicleState
                );
                if (minimizedNotifs.length === 0) return null;

                return (
                  <div className="flex items-center gap-2">
                    {minimizedNotifs.map((comp) => {
                      const resolved = getResolvedProps(comp, vehicleState);
                      const iconKey = resolved.icon || comp.staticProps?.icon || 'alert-triangle';
                      const color = resolved.color || comp.staticProps?.color || '#f59e0b';
                      const title = comp.staticProps?.title;
                      const message = title || resolved.message || resolved.text || 'ALERT';
                      const avatarName = comp.staticProps?.avatarName || title;

                      return (
                        <button
                          key={comp.id}
                          onClick={() => {
                            if (comp.staticProps?.threadId) {
                              useMockpitStore.getState().setActiveView('phone');
                              window.dispatchEvent(
                                new CustomEvent('mockpit-open-thread', { detail: { threadId: comp.staticProps.threadId } })
                              );
                            } else {
                              handleExpandNotification(comp.id);
                            }
                          }}
                          className="px-2.5 py-0.5 rounded-full bg-slate-900 border hover:bg-slate-800 text-slate-100 transition-all flex items-center gap-1.5 cursor-pointer shadow-md group hover:scale-105 active:scale-95 pointer-events-auto"
                          style={{ borderColor: `${color}90` }}
                          title={`Click to view: ${message}`}
                        >
                          <span style={{ color }}>
                            {avatarName ? (
                              <ContactAvatar
                                name={avatarName}
                                className="w-4 h-4"
                                fontSizeClassName="text-[9px] font-extrabold"
                              />
                            ) : (
                              renderNotificationIcon(iconKey, 'w-3.5 h-3.5')
                            )}
                          </span>
                          <span className="text-[10px] font-bold tracking-tight whitespace-nowrap">
                            {message}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
            <div className="flex items-center gap-8 shrink-0">
              {/* Aggregate Unread Messages Header Icon (only when unread > 0) */}
              {totalUnread > 0 && (
                <button
                  onClick={() => setActiveView('phone')}
                  className="relative flex items-center justify-center p-1.5 rounded-full hover:bg-slate-800 text-slate-300 hover:text-slate-100 transition-all cursor-pointer pointer-events-auto"
                  title={`Messages (${totalUnread} unread)`}
                >
                  <MessageSquare className="w-5 h-5" />
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-mono font-bold px-1 min-w-[16px] h-4 rounded-full flex items-center justify-center ring-2 ring-slate-950">
                    {totalUnread > 99 ? '99+' : totalUnread}
                  </span>
                </button>
              )}

              {/* Battery % / Range Toggle */}
              {(() => {
                const batteryPercent = Math.round(vehicleState.batteryPercent ?? 89);
                const batteryRange = Math.round((batteryPercent / 100) * 352);
                return (
                  <button
                    id="header-battery-btn"
                    onClick={() => setBatteryDisplayMode((prev) => (prev === 'percent' ? 'range' : 'percent'))}
                    className="flex items-center gap-1.5 font-normal text-slate-300 cursor-pointer pointer-events-auto hover:text-slate-100 transition-colors"
                    title={batteryDisplayMode === 'percent' ? 'Tap to switch to range' : 'Tap to switch to battery percentage'}
                  >
                    {vehicleState.isCharging ? (
                      <Zap className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400 animate-pulse" />
                    ) : (
                      <Battery className={`w-4 h-4 ${batteryPercent <= 15 ? 'text-rose-400' : 'text-slate-400'}`} />
                    )}
                    <span>
                      {batteryDisplayMode === 'percent' ? `${batteryPercent}%` : `${batteryRange} mi`}
                    </span>
                  </button>
                );
              })()}

              <button
                id="header-weather-temp-btn"
                onClick={() => setActiveView('weather')}
                className="font-normal text-slate-300 cursor-pointer pointer-events-auto hover:text-slate-100 transition-colors"
                title="Open Weather Forecast"
              >
                {weatherCurrent?.temperature !== undefined
                  ? `${Math.round(weatherCurrent.temperature)}°${weatherUnit}`
                  : '72°F'}
              </button>
              <span className="font-normal text-slate-300">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              {/* Animated 1-5 bar signal indicator (v0.11) */}
              <div
                className="flex items-center gap-1.5 font-mono text-emerald-400 pr-4 shrink-0"
                title={`Signal: ${vehicleState.signalBars ?? 4}/5 bars`}
              >
                <div className="flex items-end gap-0.5 h-3.5">
                  {[1, 2, 3, 4, 5].map((bar) => {
                    const activeSignal = vehicleState.signalBars ?? 4;
                    const isActive = bar <= activeSignal;
                    return (
                      <span
                        key={bar}
                        className={`w-1 rounded-xs transition-all duration-300 ${
                          isActive ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]' : 'bg-slate-800'
                        }`}
                        style={{ height: `${bar * 20}%` }}
                      />
                    );
                  })}
                </div>
                <span className="text-xs font-bold tracking-tight">5G</span>
              </div>
            </div>
          </div>

          {/* Weather Screen Full Takeover in Editor Mode */}
          {!isPresentation && activeView === 'weather' && (
            <div
              className="absolute z-20 overflow-hidden pointer-events-auto"
              style={{
                left: FOCUSED_APP_RECT.x,
                top: FOCUSED_APP_RECT.y,
                width: FOCUSED_APP_RECT.width,
                height: FOCUSED_APP_RECT.height,
              }}
            >
              <WeatherForecastScreen
                onBack={() => {
                  const prev = useMockpitStore.getState().previousView;
                  setActiveView(prev && prev !== 'weather' ? prev : 'home');
                }}
              />
            </div>
          )}

          {/* Weather Radar Child Screen Full Takeover in Editor Mode */}
          {!isPresentation && activeView === 'weather-radar' && (
            <div
              className="absolute z-20 overflow-hidden pointer-events-auto"
              style={{
                left: FOCUSED_APP_RECT.x,
                top: FOCUSED_APP_RECT.y,
                width: FOCUSED_APP_RECT.width,
                height: FOCUSED_APP_RECT.height,
              }}
            >
              <WeatherRadarScreen
                onBack={() => {
                  setActiveView('weather');
                }}
              />
            </div>
          )}

          {/* Empty Canvas Overlay in Editor Mode for Screen Views */}
          {!isPresentation && !['weather', 'weather-radar'].includes(activeView) && components.length === 0 && (
            <div className="absolute inset-x-16 inset-y-20 z-10 border-2 border-dashed border-slate-800/80 rounded-3xl flex flex-col items-center justify-center text-slate-500 bg-slate-900/20 pointer-events-none">
              <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 mb-3 text-sky-400">
                {activeView === 'navigation' && <MapPin className="w-8 h-8" />}
                {activeView === 'media' && <Music className="w-8 h-8" />}
                {activeView === 'phone' && <Phone className="w-8 h-8" />}
                {activeView === 'home' && <LayoutGrid className="w-8 h-8" />}
                {!['navigation', 'media', 'phone', 'home'].includes(activeView) && <Layout className="w-8 h-8" />}
              </div>
              <p className="text-sm font-bold text-slate-300 uppercase font-mono tracking-wider">
                {activeScreenDisplayName.toUpperCase()} SCREEN CANVAS EMPTY
              </p>
              <p className="text-xs text-slate-500 max-w-md text-center mt-1 font-mono">
                Drag components from the library on the left, or click the + icon next to a component to add it to this screen.
              </p>
            </div>
          )}

          {/* Editor Canvas for Screens (Active strictly in Editor Mode) */}
          {!isPresentation && (
            <div className="absolute inset-x-0 top-0 bottom-0 z-10">
              {[...components]
                .sort((a, b) => {
                  const zA = a.zIndex !== undefined ? a.zIndex : (a.type === 'map' ? 0 : a.type === 'nowPlaying' ? 20 : 10);
                  const zB = b.zIndex !== undefined ? b.zIndex : (b.type === 'map' ? 0 : b.type === 'nowPlaying' ? 20 : 10);
                  if (zA !== zB) return zA - zB;
                  return components.indexOf(a) - components.indexOf(b);
                })
                .map((comp) => {
                  const isSelected = comp.id === selectedComponentId;
                  const baseZ = comp.zIndex !== undefined ? comp.zIndex : (comp.type === 'map' ? 0 : comp.type === 'nowPlaying' ? 20 : 10);
                  const effectiveZ = isSelected ? baseZ + 100 : baseZ;

                  return (
                    <div
                      key={comp.id}
                      className={`absolute group cursor-pointer pointer-events-auto ${
                        dragInfo?.id === comp.id || resizeInfo?.id === comp.id
                          ? 'transition-none'
                          : 'transition-all duration-200 ease-out'
                      }`}
                      style={{
                        left: comp.x,
                        top: comp.y,
                        width: comp.width,
                        height: comp.height,
                        zIndex: effectiveZ,
                      }}
                      onMouseDown={(e) => {
                        handleMouseDown(e, comp.id, comp.x, comp.y);
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        selectComponent(comp.id);
                      }}
                    >
                    {/* Main Component Widget */}
                    <ComponentRenderer
                      component={comp}
                      vehicleState={vehicleState}
                      isSelected={isSelected}
                      isPresentation={false}
                    />

                    {/* Editor Selection Box Overlay */}
                    {isSelected && (
                      <div
                        className="absolute inset-0 border-2 rounded-2xl pointer-events-none"
                        style={{
                          borderColor: 'var(--color-primary, #38bdf8)',
                          boxShadow: '0 0 15px color-mix(in srgb, var(--color-primary, #38bdf8) 40%, transparent)',
                        }}
                      >
                        {/* Move Drag Handle */}
                        <div
                          className="absolute -top-3 left-1/2 -translate-x-1/2 text-slate-950 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 shadow-md cursor-move pointer-events-auto hover:brightness-110"
                          style={{ backgroundColor: 'var(--color-primary, #38bdf8)' }}
                          onMouseDown={(e) => handleMouseDown(e, comp.id, comp.x, comp.y)}
                        >
                          <Move className="w-3 h-3" /> Move ({comp.x}, {comp.y})
                        </div>

                        {/* Delete Quick Handle */}
                        <button
                          className="absolute -top-3 right-2 bg-rose-500 text-white p-1 rounded-full text-[10px] shadow-md cursor-pointer pointer-events-auto hover:bg-rose-400 transition-all"
                          title="Delete Component"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteComponent(comp.id);
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>

                        {/* Bottom-Right Resize Handle */}
                        <div
                          className="absolute -bottom-2 -right-2 w-6 h-6 rounded-full border-2 border-slate-900 cursor-nwse-resize pointer-events-auto flex items-center justify-center text-slate-950 hover:scale-125 transition-transform"
                          style={{ backgroundColor: 'var(--color-primary, #38bdf8)' }}
                          onMouseDown={(e) => handleResizeMouseDown(e, comp.id, comp.width, comp.height)}
                        >
                          <Maximize2 className="w-3 h-3" />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Status Callout & Exploded View Connector Lines in Editor Mode */}
              <ConnectorLayer
                components={components}
                selectedComponentId={selectedComponentId}
                isPresentation={false}
                activeView={activeView}
                onSelectComponent={selectComponent}
              />
            </div>
          )}

          {/* 
            * Presentation Mode Screen Container (Home and Focused Apps)
            * Animates every screen transition via the per-screen transitionStyle (slideUp/Down/Left/Right/fade).
          */}
          {isPresentation && (() => {
            return (
              <>
                <FocusedAppScreen
                  key={activeView}
                  activeView={activeView}
                  screens={screens}
                  focusedAppComponents={activeView === 'home' ? components : focusedAppComponents}
                  vehicleState={vehicleState}
                />
                <ConnectorLayer
                  components={activeView === 'home' ? components : focusedAppComponents}
                  selectedComponentId={null}
                  isPresentation={true}
                  activeView={activeView}
                />
              </>
            );
          })()}

          {/* Global Auto-Stacking Notification Layer in Presentation Mode */}
          {isPresentation && (() => {
            const fullNotifs = sortNotificationsBySeverity(
              activeNotifications.filter((comp) => !minimizedNotifIds[comp.id]),
              vehicleState
            );

            if (fullNotifs.length === 0) return null;

            let posStyles = 'top-12 left-1/2 -translate-x-1/2 flex-col items-center';
            if (notificationStackPosition === 'top-right') {
              posStyles = 'top-12 right-8 flex-col items-end';
            } else if (notificationStackPosition === 'bottom-center') {
              posStyles = 'bottom-[96px] left-1/2 -translate-x-1/2 flex-col-reverse items-center';
            }

            return (
              <div
                className={`absolute z-30 pointer-events-auto flex gap-3 transition-all duration-300 ease-out ${posStyles}`}
              >
                {fullNotifs.map((comp) => (
                  <div
                    key={comp.id}
                    className="transition-all duration-300 ease-out shadow-2xl animate-in fade-in slide-in-from-top-2"
                    style={{
                      width: comp.width,
                      height: comp.height,
                    }}
                  >
                    <ComponentRenderer
                      component={comp}
                      vehicleState={vehicleState}
                      isSelected={false}
                      isPresentation={true}
                      onMinimize={() => handleMinimizeNotification(comp.id)}
                    />
                  </div>
                ))}
              </div>
            );
          })()}

          {/* Bottom Dock Navigation - Permanent UI Chrome Layer (Always Topmost) */}
          <div
            className={`absolute bottom-0 left-0 right-0 h-[84px] z-[9999] ${
              !isPresentation
                ? 'border-t-2 border-dashed border-sky-400/60 bg-sky-950/20 backdrop-blur-[1px]'
                : ''
            } flex items-center justify-center pointer-events-none`}
          >
            <BottomDock />
          </div>


          {/* On-Screen Touch Virtual Keyboard anchored to vehicle canvas */}
          <VirtualKeyboard />
        </div>
      </div>
    </div>
  );
};
