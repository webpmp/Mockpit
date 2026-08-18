import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ComponentInstance, ConnectorAnchor, VehicleStatusConnector } from '../../types';
import { useMockpitStore } from '../../store/useMockpitStore';
import { getImageContentRect, getCachedNaturalDimensions, NaturalDimensions } from '../../utils/imageContentRect';
import { DEFAULT_EXPLODED_VEHICLE_IMAGE } from '../../data/defaultExplodedVehicle';
import { Crosshair } from 'lucide-react';

interface ConnectorLayerProps {
  components: ComponentInstance[];
  selectedComponentId: string | null;
  isPresentation: boolean;
  activeView: string;
  onSelectComponent?: (id: string) => void;
  offset?: { x: number; y: number };
}

export function resolveComponentBox<T extends { x: number; y: number; width: number; height: number }>(
  comp: T,
  offset: { x: number; y: number } = { x: 0, y: 0 }
): T {
  return {
    ...comp,
    x: comp.x + (offset.x || 0),
    y: comp.y + (offset.y || 0),
  };
}

export function getAnchorCanvasCoords(
  comp: { x: number; y: number; width: number; height: number },
  anchor: ConnectorAnchor
): { x: number; y: number } {
  const { x, y, width: w, height: h } = comp;
  switch (anchor) {
    case 'top-left':
      return { x, y };
    case 'top-center':
      return { x: x + w / 2, y };
    case 'top-right':
      return { x: x + w, y };
    case 'left-center':
      return { x, y: y + h / 2 };
    case 'right-center':
      return { x: x + w, y: y + h / 2 };
    case 'bottom-left':
      return { x, y: y + h };
    case 'bottom-center':
      return { x: x + w / 2, y: y + h };
    case 'bottom-right':
      return { x: x + w, y: y + h };
    default:
      return { x: x + w / 2, y: y + h / 2 };
  }
}

export function getTargetCanvasCoords(
  targetComp: { x: number; y: number; width: number; height: number; staticProps?: Record<string, string> },
  targetX: number,
  targetY: number,
  naturalSize?: NaturalDimensions | null
): { x: number; y: number } {
  const imageSrc = targetComp.staticProps?.imageUrl || DEFAULT_EXPLODED_VEHICLE_IMAGE;
  const natural = naturalSize || getCachedNaturalDimensions(imageSrc);
  const rect = getImageContentRect(targetComp, natural, 4);

  return {
    x: rect.x + Math.max(0, Math.min(1, targetX)) * rect.width,
    y: rect.y + Math.max(0, Math.min(1, targetY)) * rect.height,
  };
}

export const ConnectorLayer: React.FC<ConnectorLayerProps> = ({
  components,
  selectedComponentId,
  isPresentation,
  activeView,
  onSelectComponent,
  offset = { x: 0, y: 0 },
}) => {
  const updateComponentConnector = useMockpitStore((s) => s.updateComponentConnector);

  // State for dragging an existing target endpoint handle
  const [draggingTarget, setDraggingTarget] = useState<{
    calloutId: string;
    targetComponentId: string;
  } | null>(null);

  // State for active dragging from an anchor to connect to an exploded view
  const [activeConnecting, setActiveConnecting] = useState<{
    calloutId: string;
    sourceAnchor: ConnectorAnchor;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Map of components by ID on the active canvas, with offset applied to on-screen box dimensions
  const componentMap = React.useMemo(() => {
    const map = new Map<string, ComponentInstance>();
    components.forEach((c) => {
      map.set(c.id, resolveComponentBox(c, offset));
    });
    return map;
  }, [components, offset]);

  // All status callouts with connectors (using pre-offset resolved boxes)
  const callouts = React.useMemo(() => {
    return components
      .filter((c) => c.type === 'vehicleStatusCallout' && c.connector && c.connector.targetComponentId)
      .map((c) => resolveComponentBox(c, offset));
  }, [components, offset]);

  // Handle dragging target endpoint
  const handleTargetMouseDown = (
    e: React.MouseEvent,
    calloutId: string,
    targetComponentId: string
  ) => {
    e.stopPropagation();
    e.preventDefault();
    setDraggingTarget({ calloutId, targetComponentId });
  };

  // Global mouse move & up listeners for drag operations
  useEffect(() => {
    if (!draggingTarget && !activeConnecting) return;

    const handleMouseMove = (e: MouseEvent) => {
      const container = containerRef.current?.closest('.canvas-coordinate-space') || containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const scaleX = 1920 / rect.width;
      const scaleY = 1080 / rect.height;
      const canvasX = (e.clientX - rect.left) * scaleX;
      const canvasY = (e.clientY - rect.top) * scaleY;

      if (draggingTarget) {
        const targetComp = componentMap.get(draggingTarget.targetComponentId);
        if (targetComp) {
          const imageSrc = targetComp.staticProps?.imageUrl || DEFAULT_EXPLODED_VEHICLE_IMAGE;
          const natural = getCachedNaturalDimensions(imageSrc);
          const contentRect = getImageContentRect(targetComp, natural, 4);

          const relX = Math.max(0, Math.min(1, (canvasX - contentRect.x) / contentRect.width));
          const relY = Math.max(0, Math.min(1, (canvasY - contentRect.y) / contentRect.height));

          const calloutComp = componentMap.get(draggingTarget.calloutId);
          if (calloutComp && calloutComp.connector) {
            updateComponentConnector(draggingTarget.calloutId, {
              ...calloutComp.connector,
              targetX: relX,
              targetY: relY,
            });
          }
        }
      } else if (activeConnecting) {
        setActiveConnecting((prev) => (prev ? { ...prev, currentX: canvasX, currentY: canvasY } : null));
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (activeConnecting) {
        const container = containerRef.current?.closest('.canvas-coordinate-space') || containerRef.current;
        if (container) {
          const rect = container.getBoundingClientRect();
          const scaleX = 1920 / rect.width;
          const scaleY = 1080 / rect.height;
          const canvasX = (e.clientX - rect.left) * scaleX;
          const canvasY = (e.clientY - rect.top) * scaleY;

          // Find if dropped on any vehicleExplodedView component
          const explodedViews = components.filter((c) => c.type === 'vehicleExplodedView');
          const hitTarget = explodedViews.find(
            (ev) =>
              canvasX >= ev.x &&
              canvasX <= ev.x + ev.width &&
              canvasY >= ev.y &&
              canvasY <= ev.y + ev.height
          );

          if (hitTarget) {
            const imageSrc = hitTarget.staticProps?.imageUrl || DEFAULT_EXPLODED_VEHICLE_IMAGE;
            const natural = getCachedNaturalDimensions(imageSrc);
            const contentRect = getImageContentRect(hitTarget, natural, 4);

            const relX = Math.max(0, Math.min(1, (canvasX - contentRect.x) / contentRect.width));
            const relY = Math.max(0, Math.min(1, (canvasY - contentRect.y) / contentRect.height));

            updateComponentConnector(activeConnecting.calloutId, {
              sourceAnchor: activeConnecting.sourceAnchor,
              targetComponentId: hitTarget.id,
              targetX: relX,
              targetY: relY,
            });
          }
        }
      }

      setDraggingTarget(null);
      setActiveConnecting(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingTarget, activeConnecting, componentMap, components, updateComponentConnector]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none z-30 overflow-visible"
      style={{ width: 1920, height: 1080 }}
    >
      <svg
        className="w-full h-full overflow-visible pointer-events-none"
        viewBox="0 0 1920 1080"
        preserveAspectRatio="none"
      >
        <defs>
          <filter id="glow-sky" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Existing Connector Lines */}
        {callouts.map((callout) => {
          const connector = callout.connector!;
          const targetComp = componentMap.get(connector.targetComponentId);

          // If target component doesn't exist on this screen, do not draw line
          if (!targetComp) return null;

          const sourcePt = getAnchorCanvasCoords(callout, connector.sourceAnchor);
          const targetPt = getTargetCanvasCoords(targetComp, connector.targetX, connector.targetY);

          const isSelected = selectedComponentId === callout.id || selectedComponentId === targetComp.id;
          const strokeColor = isSelected ? '#38bdf8' : '#0284c7';
          const strokeWidth = isSelected ? 2.5 : 1.75;
          const strokeOpacity = isSelected ? 0.95 : 0.75;

          return (
            <g key={`conn-${callout.id}`}>
              {/* Minimal Straight Connector Line */}
              <line
                x1={sourcePt.x}
                y1={sourcePt.y}
                x2={targetPt.x}
                y2={targetPt.y}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                strokeOpacity={strokeOpacity}
                strokeLinecap="round"
              />

              {/* Source Anchor Dot */}
              <circle
                cx={sourcePt.x}
                cy={sourcePt.y}
                r={isSelected ? 4 : 3}
                fill="#38bdf8"
                stroke="#0f172a"
                strokeWidth={1.5}
              />

              {/* Target Hub Reticle Rings */}
              <circle
                cx={targetPt.x}
                cy={targetPt.y}
                r={isSelected ? 7 : 5}
                fill="none"
                stroke={strokeColor}
                strokeWidth={1.5}
                strokeOpacity={0.8}
              />
              <circle
                cx={targetPt.x}
                cy={targetPt.y}
                r={2.5}
                fill="#38bdf8"
              />
            </g>
          );
        })}

        {/* Active Drag-to-Connect Preview Line */}
        {activeConnecting && (
          <g>
            <line
              x1={activeConnecting.startX}
              y1={activeConnecting.startY}
              x2={activeConnecting.currentX}
              y2={activeConnecting.currentY}
              stroke="#38bdf8"
              strokeWidth={2}
              strokeDasharray="4 3"
              strokeOpacity={0.9}
            />
            <circle
              cx={activeConnecting.startX}
              cy={activeConnecting.startY}
              r={4}
              fill="#38bdf8"
            />
            <circle
              cx={activeConnecting.currentX}
              cy={activeConnecting.currentY}
              r={6}
              fill="none"
              stroke="#38bdf8"
              strokeWidth={1.5}
            />
            <circle
              cx={activeConnecting.currentX}
              cy={activeConnecting.currentY}
              r={2}
              fill="#38bdf8"
            />
          </g>
        )}
      </svg>

      {/* Interactive Draggable Target Endpoint Handles (Rendered in HTML for reliable 44x44 tap target) */}
      {!isPresentation &&
        callouts.map((callout) => {
          const connector = callout.connector!;
          const targetComp = componentMap.get(connector.targetComponentId);
          if (!targetComp) return null;

          const isSelected = selectedComponentId === callout.id || selectedComponentId === targetComp.id;
          const targetPt = getTargetCanvasCoords(targetComp, connector.targetX, connector.targetY);

          return (
            <div
              key={`target-handle-${callout.id}`}
              className="absolute w-[44px] h-[44px] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-auto cursor-move group/target"
              style={{
                left: targetPt.x,
                top: targetPt.y,
              }}
              title={`Target Point for "${callout.staticProps.title || 'Callout'}" (Drag to reposition)`}
              onMouseDown={(e) => handleTargetMouseDown(e, callout.id, targetComp.id)}
              onClick={(e) => {
                e.stopPropagation();
                onSelectComponent?.(callout.id);
              }}
            >
              {/* 44x44px Hit Area with 14x14px visual reticle */}
              <div
                className={`w-4 h-4 rounded-full border-2 transition-all flex items-center justify-center ${
                  isSelected
                    ? 'bg-sky-400/30 border-sky-400 shadow-[0_0_12px_#38bdf8] scale-125'
                    : 'bg-slate-900/80 border-sky-500/80 group-hover/target:border-sky-400 group-hover/target:scale-125'
                }`}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-sky-400" />
              </div>
            </div>
          );
        })}
    </div>
  );
};
