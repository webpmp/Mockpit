import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ComponentInstance, VehicleState, EgoVehicleType } from '../types';
import { useMockpitStore } from '../store/useMockpitStore';
import { getEgoVehicleTypeFromAsset } from '../utils/vehicleAssets';

interface OverheadDrivingVisualizationProps {
  component: ComponentInstance;
  vehicleState: VehicleState;
  isSelected?: boolean;
  isPresentation?: boolean;
}

export type VehicleType =
  | 'sedan'
  | 'suv'
  | 'pickup'
  | 'van'
  | 'boxTruck'
  | 'semi'
  | 'bus'
  | 'motorcycle';

export type SceneObjectType =
  | 'pedestrian'
  | 'orangeCone'
  | 'constructionBarricade'
  | 'roadWorker';

export interface TrafficVehicle {
  id: string;
  type: VehicleType;
  lane: number; // Floating-point lane for smooth interpolation (1, 2, 3...)
  targetLane: number;
  isOpposing: boolean;
  isCrossTraffic?: boolean;
  x: number;
  y: number; // Relative Y position from ego vehicle (0 = ego height)
  speed: number; // Base speed in mph
  targetSpeed: number;
  phaseOffset: number;
  color: string;
}

export interface SceneObject {
  id: string;
  type: SceneObjectType;
  x: number;
  y: number;
}

/**
 * High-Fidelity SVG Vehicle Vector Graphic Renderer
 * Renders distinct top-down automotive silhouettes for all vehicle classes & ego vehicle silhouettes.
 */
const VehicleGraphic: React.FC<{
  type: VehicleType;
  w: number;
  l: number;
  color: string;
  isEgo?: boolean;
  egoType?: EgoVehicleType;
  accentColor?: string;
  headlightsOn?: boolean;
}> = ({ type, w, l, color, isEgo = false, egoType = 'midsizeSedan', accentColor = '#38bdf8', headlightsOn = false }) => {
  if (isEgo) {
    if (egoType === 'truck') {
      return (
        <g id="ego-truck-graphic">
          <rect x={-w / 2 + 3} y={-l / 2 + 4} width={w} height={l} rx="8" fill="#000000" opacity="0.65" />
          <rect x={-w / 2 - 3} y={-l * 0.35} width="4" height={l * 0.18} rx="1" fill="#0f172a" />
          <rect x={w / 2 - 1} y={-l * 0.35} width="4" height={l * 0.18} rx="1" fill="#0f172a" />
          <rect x={-w / 2 - 3} y={l * 0.22} width="4" height={l * 0.18} rx="1" fill="#0f172a" />
          <rect x={w / 2 - 1} y={l * 0.22} width="4" height={l * 0.18} rx="1" fill="#0f172a" />
          <rect x={-w / 2} y={-l / 2} width={w} height={l} rx="8" fill="#f8fafc" stroke={accentColor} strokeWidth="2.5" />
          <rect x={-w / 2 - 5} y={-l * 0.26} width="5" height="3" rx="1" fill="#94a3b8" />
          <rect x={w / 2} y={-l * 0.26} width="5" height="3" rx="1" fill="#94a3b8" />
          <rect x={-w * 0.42} y={-l * 0.46} width={w * 0.84} height={l * 0.48} rx="6" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
          <path d={`M -${w * 0.32} -${l * 0.38} L ${w * 0.32} -${l * 0.38}`} stroke="#cbd5e1" strokeWidth="2" opacity="0.7" />
          <rect x={-w * 0.38} y={l * 0.04} width={w * 0.76} height={l * 0.40} rx="3" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
          <line x1={-w * 0.3} y1={l * 0.14} x2={w * 0.3} y2={l * 0.14} stroke="#0f172a" strokeWidth="1.5" />
          <line x1={-w * 0.3} y1={l * 0.24} x2={w * 0.3} y2={l * 0.24} stroke="#0f172a" strokeWidth="1.5" />
          <line x1={-w * 0.3} y1={l * 0.34} x2={w * 0.3} y2={l * 0.34} stroke="#0f172a" strokeWidth="1.5" />
          <line x1={-w * 0.2} y1={l / 2 - 2} x2={w * 0.2} y2={l / 2 - 2} stroke={accentColor} strokeWidth="2" />
          <circle cx="0" cy={-l * 0.42} r="3" fill={accentColor} />
          <rect x={-w * 0.44} y={-l / 2 - 1.5} width={w * 0.28} height="3.5" fill={headlightsOn ? '#ffffff' : '#94a3b8'} filter={headlightsOn ? 'url(#ego-halo-glow)' : undefined} />
          <rect x={w * 0.16} y={-l / 2 - 1.5} width={w * 0.28} height="3.5" fill={headlightsOn ? '#ffffff' : '#94a3b8'} filter={headlightsOn ? 'url(#ego-halo-glow)' : undefined} />
          <rect x={-w * 0.42} y={l / 2 - 2.5} width={w * 0.24} height="3" fill="#ef4444" />
          <rect x={w * 0.18} y={l / 2 - 2.5} width={w * 0.24} height="3" fill="#ef4444" />
        </g>
      );
    } else if (egoType === 'coupe') {
      return (
        <g id="ego-coupe-graphic">
          <rect x={-w / 2 + 2} y={-l / 2 + 3} width={w} height={l} rx={w * 0.42} fill="#000000" opacity="0.65" />
          <rect x={-w / 2 - 2} y={-l * 0.32} width="3.5" height={l * 0.22} rx="1" fill="#0f172a" />
          <rect x={w / 2 - 1.5} y={-l * 0.32} width="3.5" height={l * 0.22} rx="1" fill="#0f172a" />
          <rect x={-w / 2 - 2} y={l * 0.18} width="3.5" height={l * 0.22} rx="1" fill="#0f172a" />
          <rect x={w / 2 - 1.5} y={l * 0.18} width="3.5" height={l * 0.22} rx="1" fill="#0f172a" />
          <rect x={-w / 2} y={-l / 2} width={w} height={l} rx={w * 0.42} fill="#f8fafc" stroke={accentColor} strokeWidth="2.5" />
          <rect x={-w / 2 - 4} y={-l * 0.20} width="4" height="2.5" rx="1" fill="#cbd5e1" />
          <rect x={w / 2} y={-l * 0.20} width="4" height="2.5" rx="1" fill="#cbd5e1" />
          <path d={`M -${w * 0.34} -${l * 0.22} L ${w * 0.34} -${l * 0.22} L ${w * 0.22} ${l * 0.28} L -${w * 0.22} ${l * 0.28} Z`} fill="#090d16" stroke="#334155" strokeWidth="1.5" />
          <line x1={-w * 0.25} y1={-l * 0.05} x2={w * 0.25} y2={-l * 0.05} stroke="#1e293b" strokeWidth="1" />
          <circle cx="0" cy={-l * 0.38} r="3" fill={accentColor} />
          <rect x={-w * 0.42} y={-l / 2 - 1.5} width={w * 0.28} height="3.5" fill={headlightsOn ? '#ffffff' : '#94a3b8'} filter={headlightsOn ? 'url(#ego-halo-glow)' : undefined} />
          <rect x={w * 0.14} y={-l / 2 - 1.5} width={w * 0.28} height="3.5" fill={headlightsOn ? '#ffffff' : '#94a3b8'} filter={headlightsOn ? 'url(#ego-halo-glow)' : undefined} />
          <rect x={-w * 0.42} y={l / 2 - 2.5} width={w * 0.84} height="3" rx="1" fill="#f43f5e" />
        </g>
      );
    } else if (egoType === 'compactSedan') {
      return (
        <g id="ego-compact-graphic">
          <rect x={-w / 2 + 2} y={-l / 2 + 3} width={w} height={l} rx={w * 0.38} fill="#000000" opacity="0.65" />
          <rect x={-w / 2 - 2} y={-l * 0.30} width="3.5" height={l * 0.22} rx="1" fill="#0f172a" />
          <rect x={w / 2 - 1.5} y={-l * 0.30} width="3.5" height={l * 0.22} rx="1" fill="#0f172a" />
          <rect x={-w / 2 - 2} y={l * 0.16} width="3.5" height={l * 0.22} rx="1" fill="#0f172a" />
          <rect x={w / 2 - 1.5} y={l * 0.16} width="3.5" height={l * 0.22} rx="1" fill="#0f172a" />
          <rect x={-w / 2} y={-l / 2} width={w} height={l} rx={w * 0.38} fill="#f8fafc" stroke={accentColor} strokeWidth="2.5" />
          <rect x={-w * 0.36} y={-l * 0.24} width={w * 0.72} height={l * 0.50} rx={w * 0.18} fill="#090d16" stroke="#334155" strokeWidth="1.5" />
          <circle cx="0" cy={-l * 0.38} r="3" fill={accentColor} />
          <rect x={-w * 0.42} y={-l / 2 - 1.5} width={w * 0.28} height="3.5" fill={headlightsOn ? '#ffffff' : '#94a3b8'} filter={headlightsOn ? 'url(#ego-halo-glow)' : undefined} />
          <rect x={w * 0.14} y={-l / 2 - 1.5} width={w * 0.28} height="3.5" fill={headlightsOn ? '#ffffff' : '#94a3b8'} filter={headlightsOn ? 'url(#ego-halo-glow)' : undefined} />
          <rect x={-w * 0.42} y={l / 2 - 2.5} width={w * 0.84} height="3" rx="1" fill="#f43f5e" />
        </g>
      );
    } else if (egoType === 'luxurySedan') {
      return (
        <g id="ego-luxury-graphic">
          <rect x={-w / 2 + 2} y={-l / 2 + 3} width={w} height={l} rx={w * 0.34} fill="#000000" opacity="0.65" />
          <rect x={-w / 2 - 2} y={-l * 0.32} width="3.5" height={l * 0.22} rx="1" fill="#0f172a" />
          <rect x={w / 2 - 1.5} y={-l * 0.32} width="3.5" height={l * 0.22} rx="1" fill="#0f172a" />
          <rect x={-w / 2 - 2} y={l * 0.18} width="3.5" height={l * 0.22} rx="1" fill="#0f172a" />
          <rect x={w / 2 - 1.5} y={l * 0.18} width="3.5" height={l * 0.22} rx="1" fill="#0f172a" />
          <rect x={-w / 2} y={-l / 2} width={w} height={l} rx={w * 0.34} fill="#f8fafc" stroke={accentColor} strokeWidth="2.5" />
          <rect x={-w / 2 - 4} y={-l * 0.22} width="4" height="2.5" rx="1" fill="#cbd5e1" />
          <rect x={w / 2} y={-l * 0.22} width="4" height="2.5" rx="1" fill="#cbd5e1" />
          <rect x={-w * 0.36} y={-l * 0.28} width={w * 0.72} height={l * 0.26} rx="4" fill="#090d16" stroke="#334155" strokeWidth="1.2" />
          <rect x={-w * 0.36} y={0} width={w * 0.72} height={l * 0.26} rx="4" fill="#090d16" stroke="#334155" strokeWidth="1.2" />
          <circle cx="0" cy={-l * 0.40} r="3" fill={accentColor} />
          <rect x={-w * 0.44} y={-l / 2 - 1.5} width={w * 0.32} height="3.5" fill={headlightsOn ? '#ffffff' : '#94a3b8'} filter={headlightsOn ? 'url(#ego-halo-glow)' : undefined} />
          <rect x={w * 0.12} y={-l / 2 - 1.5} width={w * 0.32} height="3.5" fill={headlightsOn ? '#ffffff' : '#94a3b8'} filter={headlightsOn ? 'url(#ego-halo-glow)' : undefined} />
          <rect x={-w * 0.44} y={l / 2 - 2.5} width={w * 0.88} height="3" rx="1" fill="#f43f5e" />
        </g>
      );
    } else {
      return (
        <g id="ego-midsize-graphic">
          <rect x={-w / 2 + 2} y={-l / 2 + 3} width={w} height={l} rx={w * 0.36} fill="#000000" opacity="0.65" />
          <rect x={-w / 2 - 2} y={-l * 0.32} width="3.5" height={l * 0.22} rx="1" fill="#0f172a" />
          <rect x={w / 2 - 1.5} y={-l * 0.32} width="3.5" height={l * 0.22} rx="1" fill="#0f172a" />
          <rect x={-w / 2 - 2} y={l * 0.16} width="3.5" height={l * 0.22} rx="1" fill="#0f172a" />
          <rect x={w / 2 - 1.5} y={l * 0.16} width="3.5" height={l * 0.22} rx="1" fill="#0f172a" />
          <rect x={-w / 2} y={-l / 2} width={w} height={l} rx={w * 0.36} fill="#f8fafc" stroke={accentColor} strokeWidth="2.5" />
          <rect x={-w / 2 - 4} y={-l * 0.22} width="4" height="2.5" rx="1" fill="#cbd5e1" />
          <rect x={w / 2} y={-l * 0.22} width="4" height="2.5" rx="1" fill="#cbd5e1" />
          <rect x={-w * 0.36} y={-l * 0.26} width={w * 0.72} height={l * 0.54} rx={w * 0.18} fill="#090d16" stroke="#334155" strokeWidth="1.5" />
          <line x1={-w * 0.3} y1={-l * 0.04} x2={w * 0.3} y2={-l * 0.04} stroke="#1e293b" strokeWidth="1" />
          <circle cx="0" cy={-l * 0.38} r="3" fill={accentColor} />
          <rect x={-w * 0.44} y={-l / 2 - 1.5} width={w * 0.3} height="3.5" fill={headlightsOn ? '#ffffff' : '#94a3b8'} filter={headlightsOn ? 'url(#ego-halo-glow)' : undefined} />
          <rect x={w * 0.14} y={-l / 2 - 1.5} width={w * 0.3} height="3.5" fill={headlightsOn ? '#ffffff' : '#94a3b8'} filter={headlightsOn ? 'url(#ego-halo-glow)' : undefined} />
          <rect x={-w * 0.44} y={l / 2 - 2.5} width={w * 0.88} height="3" rx="1" fill="#f43f5e" />
        </g>
      );
    }
  }

  // SUBORDINATE TRAFFIC VEHICLES - High-Fidelity Vector Automotive Silhouettes
  switch (type) {
    case 'sedan':
      return (
        <g>
          {/* Drop Shadow */}
          <rect x={-w / 2 + 2} y={-l / 2 + 3} width={w} height={l} rx={w * 0.35} fill="#000000" opacity="0.5" />
          {/* Wheels in arches */}
          <rect x={-w / 2 - 1.5} y={-l * 0.32} width="2.5" height={l * 0.22} rx="1" fill="#0f172a" />
          <rect x={w / 2 - 1} y={-l * 0.32} width="2.5" height={l * 0.22} rx="1" fill="#0f172a" />
          <rect x={-w / 2 - 1.5} y={l * 0.16} width="2.5" height={l * 0.22} rx="1" fill="#0f172a" />
          <rect x={w / 2 - 1} y={l * 0.16} width="2.5" height={l * 0.22} rx="1" fill="#0f172a" />
          {/* Aerodynamic Sedan Chassis */}
          <rect x={-w / 2} y={-l / 2} width={w} height={l} rx={w * 0.35} fill={color} stroke="#1e293b" strokeWidth="1.5" />
          {/* Side Mirrors */}
          <rect x={-w / 2 - 3} y={-l * 0.2} width="3" height="2" rx="0.8" fill={color} />
          <rect x={w / 2} y={-l * 0.2} width="3" height="2" rx="0.8" fill={color} />
          {/* Sloped Hood Lines */}
          <path d={`M -${w * 0.28} -${l * 0.44} Q 0 -${l * 0.47} ${w * 0.28} -${l * 0.44}`} fill="none" stroke="#ffffff" opacity="0.3" strokeWidth="1" />
          {/* Glasshouse Windshield & Cabin */}
          <path d={`M -${w * 0.35} -${l * 0.22} Q 0 -${l * 0.28} ${w * 0.35} -${l * 0.22} L ${w * 0.32} ${l * 0.22} Q 0 ${l * 0.26} -${w * 0.32} ${l * 0.22} Z`} fill="#0f172a" opacity="0.88" />
          {/* Rear Windshield & Trunk Deck */}
          <path d={`M -${w * 0.3} ${l * 0.18} Q 0 ${l * 0.15} ${w * 0.3} ${l * 0.18} L ${w * 0.28} ${l * 0.28} Q 0 ${l * 0.3} -${w * 0.28} ${l * 0.28} Z`} fill="#1e293b" opacity="0.9" />
          {/* Front Headlights & Rear Taillights */}
          <rect x={-w * 0.4} y={-l / 2 - 1} width={w * 0.25} height="2" fill="#fef08a" />
          <rect x={w * 0.15} y={-l / 2 - 1} width={w * 0.25} height="2" fill="#fef08a" />
          <rect x={-w * 0.4} y={l / 2 - 1} width={w * 0.25} height="2" fill="#ef4444" />
          <rect x={w * 0.15} y={l / 2 - 1} width={w * 0.25} height="2" fill="#ef4444" />
        </g>
      );

    case 'suv':
      return (
        <g>
          {/* Drop Shadow */}
          <rect x={-w / 2 + 2} y={-l / 2 + 3} width={w} height={l} rx={w * 0.28} fill="#000000" opacity="0.5" />
          {/* Beefier SUV Wheels */}
          <rect x={-w / 2 - 2} y={-l * 0.32} width="3" height={l * 0.22} rx="1" fill="#0f172a" />
          <rect x={w / 2 - 1} y={-l * 0.32} width="3" height={l * 0.22} rx="1" fill="#0f172a" />
          <rect x={-w / 2 - 2} y={l * 0.16} width="3" height={l * 0.22} rx="1" fill="#0f172a" />
          <rect x={w / 2 - 1} y={l * 0.16} width="3" height={l * 0.22} rx="1" fill="#0f172a" />
          {/* Body Chassis */}
          <rect x={-w / 2} y={-l / 2} width={w} height={l} rx={w * 0.28} fill={color} stroke="#0f172a" strokeWidth="1.5" />
          {/* Roof Rack Rails */}
          <line x1={-w * 0.38} y1={-l * 0.18} x2={-w * 0.38} y2={l * 0.28} stroke="#0f172a" strokeWidth="2" />
          <line x1={w * 0.38} y1={-l * 0.18} x2={w * 0.38} y2={l * 0.28} stroke="#0f172a" strokeWidth="2" />
          {/* Panoramic Roof & Windshield Glass */}
          <rect x={-w * 0.36} y={-l * 0.26} width={w * 0.72} height={l * 0.56} rx={w * 0.12} fill="#0f172a" opacity="0.88" />
          {/* Side Mirrors */}
          <rect x={-w / 2 - 3.5} y={-l * 0.22} width="3.5" height="2.5" rx="1" fill={color} />
          <rect x={w / 2} y={-l * 0.22} width="3.5" height="2.5" rx="1" fill={color} />
          {/* Tailgate window */}
          <rect x={-w * 0.34} y={l * 0.3} width={w * 0.68} height={l * 0.08} rx="1" fill="#334155" />
          {/* Headlights & Taillights */}
          <rect x={-w * 0.42} y={-l / 2 - 1} width={w * 0.28} height="2.5" fill="#fef08a" />
          <rect x={w * 0.14} y={-l / 2 - 1} width={w * 0.28} height="2.5" fill="#fef08a" />
          <rect x={-w * 0.42} y={l / 2 - 1} width={w * 0.28} height="2.5" fill="#ef4444" />
          <rect x={w * 0.14} y={l / 2 - 1} width={w * 0.28} height="2.5" fill="#ef4444" />
        </g>
      );

    case 'pickup':
      return (
        <g>
          {/* Drop Shadow */}
          <rect x={-w / 2 + 2} y={-l / 2 + 3} width={w} height={l} rx={w * 0.2} fill="#000000" opacity="0.5" />
          {/* Wheels */}
          <rect x={-w / 2 - 2} y={-l * 0.32} width="3" height={l * 0.2} rx="1" fill="#0f172a" />
          <rect x={w / 2 - 1} y={-l * 0.32} width="3" height={l * 0.2} rx="1" fill="#0f172a" />
          <rect x={-w / 2 - 2} y={l * 0.18} width="3" height={l * 0.2} rx="1" fill="#0f172a" />
          <rect x={w / 2 - 1} y={l * 0.18} width="3" height={l * 0.2} rx="1" fill="#0f172a" />
          {/* Outer Body Frame */}
          <rect x={-w / 2} y={-l / 2} width={w} height={l} rx={w * 0.2} fill={color} stroke="#1e293b" strokeWidth="1.5" />
          {/* Open Truck Bed (Recessed Dark Bed Liner Container) */}
          <rect x={-w * 0.4} y={0} width={w * 0.8} height={l * 0.44} rx="2" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
          {/* Cab Section */}
          <rect x={-w * 0.44} y={-l * 0.46} width={w * 0.88} height={l * 0.42} rx={w * 0.15} fill="#1e293b" />
          <rect x={-w * 0.38} y={-l * 0.42} width={w * 0.76} height={l * 0.18} rx="2" fill="#0284c7" opacity="0.6" />
          {/* Mirrors */}
          <rect x={-w / 2 - 4} y={-l * 0.3} width="4" height="3" rx="1" fill="#334155" />
          <rect x={w / 2} y={-l * 0.3} width="4" height="3" rx="1" fill="#334155" />
          {/* Lights */}
          <rect x={-w * 0.44} y={-l / 2 - 1} width={w * 0.28} height="2.5" fill="#fef08a" />
          <rect x={w * 0.16} y={-l / 2 - 1} width={w * 0.28} height="2.5" fill="#fef08a" />
          <rect x={-w * 0.44} y={l / 2 - 1} width={w * 0.28} height="2.5" fill="#ef4444" />
          <rect x={w * 0.16} y={l / 2 - 1} width={w * 0.28} height="2.5" fill="#ef4444" />
        </g>
      );

    case 'van':
      return (
        <g>
          {/* Drop Shadow */}
          <rect x={-w / 2 + 2} y={-l / 2 + 3} width={w} height={l} rx={w * 0.22} fill="#000000" opacity="0.5" />
          <rect x={-w / 2} y={-l / 2} width={w} height={l} rx={w * 0.22} fill={color} stroke="#1e293b" strokeWidth="1.5" />
          {/* Roof Slat Lines */}
          <line x1={-w * 0.2} y1={-l * 0.1} x2={-w * 0.2} y2={l * 0.38} stroke="#334155" strokeWidth="1" />
          <line x1={0} y1={-l * 0.1} x2={0} y2={l * 0.38} stroke="#334155" strokeWidth="1" />
          <line x1={w * 0.2} y1={-l * 0.1} x2={w * 0.2} y2={l * 0.38} stroke="#334155" strokeWidth="1" />
          {/* Aerodynamic Front Windshield */}
          <path d={`M -${w * 0.38} -${l * 0.38} L ${w * 0.38} -${l * 0.38} L ${w * 0.34} -${l * 0.2} L -${w * 0.34} -${l * 0.2} Z`} fill="#0f172a" />
          {/* Mirrors */}
          <rect x={-w / 2 - 3.5} y={-l * 0.3} width="3.5" height="2.5" rx="1" fill={color} />
          <rect x={w / 2} y={-l * 0.3} width="3.5" height="2.5" rx="1" fill={color} />
          {/* Split Rear Window */}
          <rect x={-w * 0.35} y={l * 0.42} width={w * 0.32} height={l * 0.05} fill="#1e293b" />
          <rect x={w * 0.03} y={l * 0.42} width={w * 0.32} height={l * 0.05} fill="#1e293b" />
          {/* Lights */}
          <rect x={-w * 0.42} y={-l / 2 - 1} width={w * 0.28} height="2" fill="#fef08a" />
          <rect x={w * 0.14} y={-l / 2 - 1} width={w * 0.28} height="2" fill="#fef08a" />
          <rect x={-w * 0.42} y={l / 2 - 1} width={w * 0.28} height="2" fill="#ef4444" />
          <rect x={w * 0.14} y={l / 2 - 1} width={w * 0.28} height="2" fill="#ef4444" />
        </g>
      );

    case 'boxTruck':
      return (
        <g>
          {/* Drop Shadow */}
          <rect x={-w / 2 + 2} y={-l / 2 + 3} width={w} height={l} rx="3" fill="#000000" opacity="0.5" />
          {/* Driver Cab */}
          <rect x={-w * 0.45} y={-l * 0.48} width={w * 0.9} height={l * 0.25} rx="3" fill="#0284c7" stroke="#0369a1" strokeWidth="1.5" />
          <rect x={-w * 0.38} y={-l * 0.44} width={w * 0.76} height={l * 0.1} rx="1" fill="#0f172a" />
          {/* Mirrors */}
          <rect x={-w / 2 - 4} y={-l * 0.42} width="4" height="3" rx="1" fill="#334155" />
          <rect x={w / 2} y={-l * 0.42} width="4" height="3" rx="1" fill="#334155" />
          {/* Large Cargo Box Container */}
          <rect x={-w / 2} y={-l * 0.2} width={w} height={l * 0.68} rx="2" fill="#f8fafc" stroke="#64748b" strokeWidth="1.5" />
          {/* Rear Roll-Up Door Frame Lines */}
          <line x1={-w * 0.42} y1={l * 0.44} x2={w * 0.42} y2={l * 0.44} stroke="#94a3b8" strokeWidth="1.5" />
          {/* Top Corner Amber Clearance Lights */}
          <circle cx={-w / 2 + 3} cy={-l * 0.18} r="1.5" fill="#f59e0b" />
          <circle cx={w / 2 - 3} cy={-l * 0.18} r="1.5" fill="#f59e0b" />
          {/* Lights */}
          <rect x={-w * 0.42} y={-l * 0.49} width={w * 0.25} height="2" fill="#fef08a" />
          <rect x={w * 0.17} y={-l * 0.49} width={w * 0.25} height="2" fill="#fef08a" />
          <rect x={-w * 0.45} y={l * 0.47} width={w * 0.25} height="2" fill="#ef4444" />
          <rect x={w * 0.2} y={l * 0.47} width={w * 0.25} height="2" fill="#ef4444" />
        </g>
      );

    case 'semi':
      return (
        <g>
          {/* Drop Shadow */}
          <rect x={-w / 2 + 2} y={-l / 2 + 3} width={w} height={l} rx="2" fill="#000000" opacity="0.5" />
          {/* Tractor Cab */}
          <rect x={-w * 0.42} y={-l * 0.48} width={w * 0.84} height={l * 0.26} rx="4" fill="#0d9488" stroke="#0f766e" strokeWidth="1.5" />
          {/* Chrome Exhaust Stack Tips */}
          <rect x={-w * 0.48} y={-l * 0.34} width="3" height="5" rx="1" fill="#cbd5e1" />
          <rect x={w * 0.48 - 3} y={-l * 0.34} width="3" height="5" rx="1" fill="#cbd5e1" />
          {/* Windshield */}
          <path d={`M -${w * 0.35} -${l * 0.44} L ${w * 0.35} -${l * 0.44} L ${w * 0.3} -${l * 0.34} L -${w * 0.3} -${l * 0.34} Z`} fill="#0f172a" />
          {/* Fifth Wheel Hitch Coupling Plate */}
          <circle cx="0" cy={-l * 0.18} r={w * 0.22} fill="#334155" />
          {/* Long Freight Trailer Container */}
          <rect x={-w / 2} y={-l * 0.15} width={w} height={l * 0.63} rx="2" fill="#e2e8f0" stroke="#475569" strokeWidth="1.5" />
          {/* Corrugated Wall Lines */}
          <line x1={-w * 0.42} y1={-l * 0.05} x2={-w * 0.42} y2={l * 0.42} stroke="#cbd5e1" strokeWidth="1.5" />
          <line x1={w * 0.42} y1={-l * 0.05} x2={w * 0.42} y2={l * 0.42} stroke="#cbd5e1" strokeWidth="1.5" />
          {/* Rear Cargo Doors & Bumper Guard */}
          <line x1={0} y1={-l * 0.15} x2={0} y2={l * 0.48} stroke="#94a3b8" strokeWidth="1" />
          <rect x={-w / 2} y={l * 0.46} width={w} height="2.5" fill="#0f172a" />
          {/* Lights */}
          <rect x={-w * 0.38} y={-l * 0.49} width={w * 0.25} height="2" fill="#fef08a" />
          <rect x={w * 0.13} y={-l * 0.49} width={w * 0.25} height="2" fill="#fef08a" />
          <rect x={-w * 0.42} y={l * 0.47} width={w * 0.25} height="2" fill="#ef4444" />
          <rect x={w * 0.17} y={l * 0.47} width={w * 0.25} height="2" fill="#ef4444" />
        </g>
      );

    case 'bus':
      return (
        <g>
          {/* Drop Shadow */}
          <rect x={-w / 2 + 2} y={-l / 2 + 3} width={w} height={l} rx={w * 0.2} fill="#000000" opacity="0.5" />
          {/* Long Coach Body */}
          <rect x={-w / 2} y={-l / 2} width={w} height={l} rx={w * 0.2} fill={color} stroke="#d97706" strokeWidth="1.5" />
          {/* Roof AC & Vent Pods */}
          <rect x={-w * 0.28} y={-l * 0.2} width={w * 0.56} height={l * 0.18} rx="2" fill="#1e293b" />
          <rect x={-w * 0.28} y={l * 0.1} width={w * 0.56} height={l * 0.18} rx="2" fill="#1e293b" />
          {/* Panoramic Windshield */}
          <path d={`M -${w * 0.4} -${l * 0.44} Q 0 -${l * 0.48} ${w * 0.4} -${l * 0.44} L ${w * 0.38} -${l * 0.35} Q 0 -${l * 0.38} -${w * 0.38} -${l * 0.35} Z`} fill="#0f172a" />
          {/* Side Passenger Windows */}
          <line x1={-w * 0.42} y1={-l * 0.3} x2={-w * 0.42} y2={l * 0.38} stroke="#0f172a" strokeWidth="2.5" />
          <line x1={w * 0.42} y1={-l * 0.3} x2={w * 0.42} y2={l * 0.38} stroke="#0f172a" strokeWidth="2.5" />
          {/* Mirrors */}
          <rect x={-w / 2 - 4} y={-l * 0.42} width="4" height="3" rx="1" fill="#334155" />
          <rect x={w / 2} y={-l * 0.42} width="4" height="3" rx="1" fill="#334155" />
          {/* Lights */}
          <rect x={-w * 0.42} y={-l / 2 - 1} width={w * 0.28} height="2.5" fill="#fef08a" />
          <rect x={w * 0.14} y={-l / 2 - 1} width={w * 0.28} height="2.5" fill="#fef08a" />
          <rect x={-w * 0.42} y={l / 2 - 1} width={w * 0.28} height="2.5" fill="#ef4444" />
          <rect x={w * 0.14} y={l / 2 - 1} width={w * 0.28} height="2.5" fill="#ef4444" />
        </g>
      );

    case 'motorcycle':
      return (
        <g>
          {/* Shadow */}
          <ellipse cx="0" cy="1" rx={w * 0.5} ry={l * 0.5} fill="#000000" opacity="0.5" />
          {/* Front & Rear Tires */}
          <rect x={-1.5} y={-l / 2} width="3" height={l * 0.25} rx="1" fill="#0f172a" />
          <rect x={-1.5} y={l / 2 - l * 0.25} width="3" height={l * 0.25} rx="1" fill="#0f172a" />
          {/* Bike Frame */}
          <rect x={-w * 0.3} y={-l * 0.3} width={w * 0.6} height={l * 0.6} rx={w * 0.25} fill={color} stroke="#0f172a" strokeWidth="1" />
          {/* Handlebars */}
          <line x1={-w * 0.5} y1={-l * 0.25} x2={w * 0.5} y2={-l * 0.25} stroke="#cbd5e1" strokeWidth="2" />
          {/* Rider Silhouette */}
          <circle cx="0" cy={-l * 0.05} r={w * 0.28} fill="#0284c7" />
          <ellipse cx="0" cy={l * 0.1} rx={w * 0.45} ry={l * 0.18} fill="#334155" />
          {/* Lights */}
          <circle cx="0" cy={-l / 2 + 1} r="2" fill="#fef08a" />
          <rect x="-2" y={l / 2 - 2} width="4" height="2" fill="#ef4444" />
        </g>
      );

    default:
      return null;
  }
};

export const OverheadDrivingVisualization: React.FC<OverheadDrivingVisualizationProps> = ({
  component,
  vehicleState,
  isSelected,
  isPresentation = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });

  // Responsive measurement using ResizeObserver
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect) {
          setDimensions({
            width: Math.max(220, Math.round(entry.contentRect.width)),
            height: Math.max(180, Math.round(entry.contentRect.height)),
          });
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const { width: viewW, height: viewH } = dimensions;

  // Responsive breakpoints
  const isCompact = viewW < 480 || viewH < 320;
  const isExpanded = viewW >= 700 && viewH >= 420;

  // Component configuration props
  const props = component.staticProps || {};
  const customAccentColor = props.color || '#38bdf8';

  // Speed Limit settings & Non-pulsating Edge-Triggered Flash State
  const speedLimitRaw = props.speedLimitValue || '65';
  const speedLimitVal = parseInt(speedLimitRaw, 10) || 65;
  const speedLimitVisible = props.speedLimitVisible !== 'false';
  const speedLimitPosition =
    props.speedLimitPosition === 'bottom-left' ? 'bottom-left' : 'bottom-right';
  const speedLimitStyle = props.speedLimitStyle || 'us_standard';

  // Drive Simulator Speed, Gear & Headlights - Canonical Ownership
  const currentSpeed = vehicleState?.speed ?? 0;
  const currentGear = vehicleState?.gear || 'D';
  const isReverse = currentGear === 'R';
  const isHeadlightsOn = vehicleState?.headlights === 'On';

  // Edge-triggered Speed Limit Warning Flash State
  const [isSpeedingFlash, setIsSpeedingFlash] = useState<boolean>(false);
  const wasSpeedingRef = useRef<boolean>(false);

  useEffect(() => {
    const isCurrentlySpeeding = currentSpeed > speedLimitVal;
    if (isCurrentlySpeeding && !wasSpeedingRef.current) {
      // Threshold crossed: trigger brief ~500ms red stroke transition
      setIsSpeedingFlash(true);
      const timer = setTimeout(() => {
        setIsSpeedingFlash(false);
      }, 500);
      wasSpeedingRef.current = true;
      return () => clearTimeout(timer);
    } else if (!isCurrentlySpeeding) {
      wasSpeedingRef.current = false;
      setIsSpeedingFlash(false);
    }
  }, [currentSpeed, speedLimitVal]);

  // ADAS Warning States
  const isBlindSpotWarningActive =
    vehicleState?.blindSpotWarning ??
    (props.blindSpotWarning === 'true' || props.leftBlindSpot === 'true' || props.rightBlindSpot === 'true');

  const isProximityWarningActive =
    vehicleState?.proximityWarning ?? (props.sensorWarning === 'true');

  const blindSpotColor = props.blindSpotColor || '#ef4444';
  const blindSpotOpacity = parseFloat(props.blindSpotOpacity || '0.65');
  const sensorColor = props.sensorColor || '#ef4444';
  const sensorOpacity = parseFloat(props.sensorOpacity || '0.65');

  // =========================================================================
  // EXPLICIT 4-LANE HIGHWAY GEOMETRY MODEL (966px SVG Viewport Base)
  // Total road width = 826px (from x=70 to x=896). Center = 483px.
  // 4 Driving Lanes (165.2px each) + 1 Center Median Zone (165.2px)
  // =========================================================================
  const ROAD_LEFT = 70;
  const ROAD_RIGHT = 896;
  const ROAD_WIDTH = 826;
  const LANE_WIDTH = 165.2;

  // The 4 Explicit Driving Lanes
  // Opposing 2 (outer): 70.0 -> 235.2 (centerX = 152.6)
  // Opposing 1 (inner): 235.2 -> 400.4 (centerX = 317.8)
  // Center Median:     400.4 -> 565.6 (centerX = 483.0) - NOT A DRIVING LANE
  // Ego 1 (inner):      565.6 -> 730.8 (centerX = 648.2)
  // Ego 2 (outer):      730.8 -> 896.0 (centerX = 813.4)

  // Helper to calculate lane center X position
  const getLaneX = (lane: number) => {
    if (lane < 0) {
      // Opposing lanes: -1 is inner opposing lane (317.8), -2 is outer (152.6)
      const absL = Math.abs(lane);
      return 317.8 - (absL - 1) * 165.2;
    } else {
      // Same-direction lanes: 1 is inner ego lane (648.2), 2 is outer (813.4)
      return 648.2 + (lane - 1) * 165.2;
    }
  };

  const storeVehicleBg = useMockpitStore((s) => s.vehicleBackground);
  const storeEgoVehicleType = useMockpitStore((s) => s.egoVehicleType);

  const activeEgoType = useMemo(() => {
    if (props.egoVehicleType && props.egoVehicleType !== 'auto') {
      return props.egoVehicleType as EgoVehicleType;
    }
    if (storeVehicleBg?.vehicle) {
      return getEgoVehicleTypeFromAsset(storeVehicleBg.vehicle);
    }
    return storeEgoVehicleType || 'midsizeSedan';
  }, [props.egoVehicleType, storeVehicleBg?.vehicle, storeEgoVehicleType]);

  const getEgoDims = (eType: EgoVehicleType) => {
    switch (eType) {
      case 'compactSedan':
        return { w: 52, l: 110 };
      case 'midsizeSedan':
        return { w: 60, l: 130 };
      case 'luxurySedan':
        return { w: 66, l: 148 };
      case 'truck':
        return { w: 68, l: 150 };
      case 'coupe':
        return { w: 56, l: 115 };
      default:
        return { w: 60, l: 130 };
    }
  };

  const { w: egoW, l: egoL } = getEgoDims(activeEgoType);

  // Anchor Ego Vehicle in Ego Lane 1 (Inner Ego Lane) near lower-middle of viewport
  const absEgoX = 648.2;
  const absEgoY = viewH * 0.68;

  // Vehicle Dimensions Helper Function (Strict 2.1-3.2 length-to-width ratios)
  const getVehicleDims = (type: VehicleType) => {
    switch (type) {
      case 'sedan':
        return { w: 58, l: 126 };
      case 'suv':
        return { w: 62, l: 134 };
      case 'pickup':
        return { w: 64, l: 142 };
      case 'van':
        return { w: 64, l: 138 };
      case 'boxTruck':
        return { w: 70, l: 180 };
      case 'semi':
        return { w: 74, l: 240 };
      case 'bus':
        return { w: 72, l: 210 };
      case 'motorcycle':
        return { w: 28, l: 62 };
      default:
        return { w: 58, l: 126 };
    }
  };

  // Automotive Color Palette & Vehicle Randomizer
  const AUTOMOTIVE_PALETTE = useMemo(
    () => [
      '#f8fafc', // White
      '#cbd5e1', // Silver
      '#64748b', // Slate Gray
      '#1e293b', // Midnight Black
      '#1e3a8a', // Dark Blue
      '#991b1b', // Crimson Red
      '#064e3b', // Emerald Green
      '#78350f', // Bronze / Champagne
    ],
    []
  );

  const RANDOM_VEHICLE_TYPES: VehicleType[] = useMemo(
    () => ['sedan', 'suv', 'pickup', 'van', 'boxTruck'],
    []
  );

  // Derive target traffic population from trafficDensity preset or static props
  const trafficDensity = (props.trafficDensity || 'low') as 'low' | 'medium' | 'high';

  const targetSameCount = useMemo(() => {
    if (props.sameDirCount !== undefined) return parseInt(props.sameDirCount, 10);
    return trafficDensity === 'high' ? 5 : trafficDensity === 'medium' ? 3 : 2;
  }, [props.sameDirCount, trafficDensity]);

  const targetOpposingCount = useMemo(() => {
    if (props.opposingDirCount !== undefined) return parseInt(props.opposingDirCount, 10);
    return trafficDensity === 'high' ? 4 : trafficDensity === 'medium' ? 3 : 1;
  }, [props.opposingDirCount, trafficDensity]);

  // Initial Base Traffic Setup
  const baseTraffic = useMemo<TrafficVehicle[]>(() => {
    if (props.trafficData) {
      try {
        return JSON.parse(props.trafficData);
      } catch (e) {
        console.error('Failed to parse trafficData JSON', e);
      }
    }

    const trafficList: TrafficVehicle[] = [];

    // Same-direction initial positions (Ego is at lane 1, y = 0)
    const sameConfigs = [
      { lane: 2, y: -viewH * 0.42, speed: 64, type: 'suv' as VehicleType, color: '#64748b' },
      { lane: 1, y: -viewH * 0.68, speed: 62, type: 'sedan' as VehicleType, color: '#cbd5e1' },
      { lane: 2, y: viewH * 0.22, speed: 58, type: 'pickup' as VehicleType, color: '#1e293b' },
      { lane: 1, y: viewH * 0.38, speed: 56, type: 'van' as VehicleType, color: '#1e3a8a' },
      { lane: 2, y: -viewH * 0.85, speed: 68, type: 'sedan' as VehicleType, color: '#991b1b' },
    ];

    for (let i = 0; i < Math.min(targetSameCount, sameConfigs.length); i++) {
      const cfg = sameConfigs[i];
      trafficList.push({
        id: `same-${i}`,
        type: cfg.type,
        lane: cfg.lane,
        targetLane: cfg.lane,
        isOpposing: false,
        x: 0,
        y: cfg.y,
        speed: cfg.speed,
        targetSpeed: cfg.speed,
        phaseOffset: 0,
        color: cfg.color,
      });
    }

    // Opposing initial positions (Lanes -1 and -2)
    const opposingConfigs = [
      { lane: -1, y: -viewH * 0.35, speed: 58, type: 'sedan' as VehicleType, color: '#1e293b' },
      { lane: -2, y: -viewH * 0.62, speed: 65, type: 'suv' as VehicleType, color: '#f8fafc' },
      { lane: -1, y: viewH * 0.10, speed: 52, type: 'boxTruck' as VehicleType, color: '#064e3b' },
      { lane: -2, y: -viewH * 0.15, speed: 60, type: 'pickup' as VehicleType, color: '#78350f' },
    ];

    for (let i = 0; i < Math.min(targetOpposingCount, opposingConfigs.length); i++) {
      const cfg = opposingConfigs[i];
      trafficList.push({
        id: `opp-${i}`,
        type: cfg.type,
        lane: cfg.lane,
        targetLane: cfg.lane,
        isOpposing: true,
        x: 0,
        y: cfg.y,
        speed: cfg.speed,
        targetSpeed: cfg.speed,
        phaseOffset: 0,
        color: cfg.color,
      });
    }

    return trafficList;
  }, [props.trafficData, targetSameCount, targetOpposingCount, viewH]);

  // Base Scene Objects - Clean Highway without construction/pedestrians
  const baseObjects = useMemo<SceneObject[]>(() => {
    return [];
  }, []);

  const [traffic, setTraffic] = useState<TrafficVehicle[]>(baseTraffic);
  const [sceneObjects, setSceneObjects] = useState<SceneObject[]>(baseObjects);
  const [roadDashOffset, setRoadDashOffset] = useState<number>(0);
  const [medianLightY, setMedianLightY] = useState<number>(-140);

  useEffect(() => {
    setTraffic(baseTraffic);
  }, [baseTraffic]);

  useEffect(() => {
    setSceneObjects(baseObjects);
  }, [baseObjects]);

  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const spawnTimerRef = useRef<number>(1.5); // Spawn delay timer

  // =========================================================================
  // AUTHORITATIVE HIGHWAY TRAFFIC & SPATIAL SPACING PHYSICS ENGINE
  // =========================================================================
  useEffect(() => {
    const animate = (now: number) => {
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = now;

      // Motion Direction Sign (Drive: 1, Reverse: -1)
      const dirSign = isReverse ? -1 : 1;
      const isParked = currentGear === 'P';

      if (isParked) {
        animFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      // 1. Road Dash Markings Flow
      if (currentSpeed > 0) {
        setRoadDashOffset((prev) => (prev - dirSign * dt * currentSpeed * 3.5) % 40);
      }

      // 2. High-Mast Median Lighting Scrolling (Guaranteed single fixture on screen)
      if (currentSpeed > 0) {
        setMedianLightY((prevY) => {
          let nextY = prevY + dirSign * dt * currentSpeed * 2.2;
          // When fixture moves completely off the bottom (past viewH + 120),
          // reset to top offscreen (-180) so it enters cleanly from top after previous is gone.
          if (nextY > viewH + 120) {
            return -180;
          }
          if (nextY < -180) {
            return viewH + 120;
          }
          return nextY;
        });
      }

      // 3. Main Traffic Movement & Anti-Collision Mechanics
      setTraffic((prevTraffic) => {
        let updatedList = prevTraffic.map((v) => ({ ...v }));

        // A. Move each vehicle according to its relative direction & speed
        for (let i = 0; i < updatedList.length; i++) {
          const v = updatedList[i];

          // Keep vehicle strictly in its assigned lane
          v.lane = v.targetLane;

          if (v.isOpposing) {
            // Opposing traffic relative motion: travels downward in view
            const relativeSpeed = v.speed + currentSpeed * 0.85;
            v.y += dirSign * dt * relativeSpeed * 2.2;
          } else {
            // Same-direction traffic relative motion
            // If v.speed > currentSpeed: moves UP ahead of Ego
            // If v.speed < currentSpeed: drops DOWN behind Ego
            const speedDiff = currentSpeed - v.speed;
            v.y += dirSign * dt * speedDiff * 2.2;
          }
        }

        // B. Enforce Longitudinal Separation & Anti-Overlap Physics
        // Lanes to inspect: [-2, -1, 1, 2]
        const lanes = [-2, -1, 1, 2];

        for (const lane of lanes) {
          // Collect vehicles in this lane
          interface SpatialRef {
            id: string;
            y: number;
            length: number;
            speed: number;
            isEgo?: boolean;
            vehicleRef?: TrafficVehicle;
          }

          const laneVehicles: SpatialRef[] = updatedList
            .filter((v) => v.lane === lane)
            .map((v) => ({
              id: v.id,
              y: v.y,
              length: getVehicleDims(v.type).l,
              speed: v.speed,
              vehicleRef: v,
            }));

          // Include Ego Vehicle in Ego Lane 1 (lane === 1) as physical boundary at y = 0
          if (lane === 1) {
            laneVehicles.push({
              id: 'ego-vehicle',
              y: 0,
              length: egoL,
              speed: currentSpeed,
              isEgo: true,
            });
          }

          // Sort vehicles in lane from frontmost (y smallest) to rearmost (y largest)
          laneVehicles.sort((a, b) => a.y - b.y);

          // Check consecutive pairs: Vehicle A is ahead (smaller y), Vehicle B is behind (larger y)
          for (let k = 0; k < laneVehicles.length - 1; k++) {
            const A = laneVehicles[k];
            const B = laneVehicles[k + 1];

            const minGap = 1.8 * Math.max(A.length, B.length); // Minimum safe gap (~220-250px)
            const minCenterDistance = (A.length + B.length) / 2 + minGap;
            const actualDistance = B.y - A.y;

            if (actualDistance < minCenterDistance) {
              // B is too close to A -> Adjust positions and speeds to maintain physical separation
              const overlapMinCenter = (A.length + B.length) / 2 + 18;

              // Physical Anti-Overlap Guard
              if (actualDistance < overlapMinCenter) {
                if (B.vehicleRef) {
                  B.vehicleRef.y = A.y + overlapMinCenter;
                } else if (A.vehicleRef && B.isEgo) {
                  // If B is Ego and A is ahead of Ego, push A ahead so Ego never overlaps A
                  A.vehicleRef.y = B.y - overlapMinCenter;
                  A.vehicleRef.speed = Math.max(A.vehicleRef.speed, currentSpeed + 4);
                }
              }

              // Speed Reaction: Trailing vehicle slows down to match leading vehicle
              if (B.vehicleRef) {
                B.vehicleRef.speed = Math.min(B.vehicleRef.speed, Math.max(20, A.speed - 2));
              }
              if (A.vehicleRef && B.isEgo && A.y < 0) {
                // Vehicle ahead of Ego accelerates slightly to keep safe buffer
                A.vehicleRef.speed = Math.max(A.vehicleRef.speed, currentSpeed + 3);
              }
            }
          }
        }

        // C. Remove vehicles that have exited the roadway completely
        const exitBoundTop = -viewH * 0.85;
        const exitBoundBottom = viewH * 0.50;

        const remainingTraffic = updatedList.filter((v) => {
          const vLen = getVehicleDims(v.type).l;
          // Keep vehicle if it is within visible/near-canvas bounds
          const isOffTop = v.y < exitBoundTop - vLen;
          const isOffBottom = v.y > exitBoundBottom + vLen;
          return !(isOffTop || isOffBottom);
        });

        // D. Controlled, Immediate Spawning System to Maintain Population
        spawnTimerRef.current -= dt;

        const currentSameCount = remainingTraffic.filter((v) => !v.isOpposing).length;
        const currentOpposingCount = remainingTraffic.filter((v) => v.isOpposing).length;

        if (spawnTimerRef.current <= 0) {
          let spawnSide: 'same' | 'opposing' | null = null;
          if (currentSameCount < targetSameCount) {
            spawnSide = 'same';
          } else if (currentOpposingCount < targetOpposingCount) {
            spawnSide = 'opposing';
          }

          if (spawnSide) {
            const isOpp = spawnSide === 'opposing';
            const candidateLanes = isOpp ? [-1, -2] : [1, 2];

            // Evaluate clearance across candidate lanes to select clearest lane
            let selectedLane = candidateLanes[0];
            let bestClearance = -1;

            const newType = RANDOM_VEHICLE_TYPES[Math.floor(Math.random() * RANDOM_VEHICLE_TYPES.length)];
            const newColor = AUTOMOTIVE_PALETTE[Math.floor(Math.random() * AUTOMOTIVE_PALETTE.length)];

            // Randomize relative speed and entry boundary
            const isFaster = Math.random() > 0.35;
            const newSpeed = isOpp
              ? 52 + Math.floor(Math.random() * 16)
              : isFaster
              ? Math.max(currentSpeed + 8, 58 + Math.floor(Math.random() * 14))
              : Math.max(25, currentSpeed - 12 - Math.floor(Math.random() * 10));

            const spawnY = isOpp
              ? exitBoundTop - 80
              : isFaster
              ? exitBoundBottom + 80
              : exitBoundTop - 80;

            for (const laneCandidate of candidateLanes) {
              const existingInCandidate = remainingTraffic.filter((v) => v.lane === laneCandidate);
              const minGap = existingInCandidate.reduce((minG, v) => {
                const dist = Math.abs(v.y - spawnY);
                return dist < minG ? dist : minG;
              }, 9999);

              if (minGap > bestClearance) {
                bestClearance = minGap;
                selectedLane = laneCandidate;
              }
            }

            if (bestClearance > 180) {
              remainingTraffic.push({
                id: `trf-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
                type: newType,
                lane: selectedLane,
                targetLane: selectedLane,
                isOpposing: isOpp,
                x: 0,
                y: spawnY,
                speed: newSpeed,
                targetSpeed: newSpeed,
                phaseOffset: 0,
                color: newColor,
              });

              // Set short spawn timer to quickly refill population if still below target
              spawnTimerRef.current = 0.4;
            } else {
              spawnTimerRef.current = 0.5;
            }
          } else {
            spawnTimerRef.current = 0.8;
          }
        }

        return remainingTraffic;
      });

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [
    currentSpeed,
    currentGear,
    isReverse,
    viewW,
    viewH,
    egoL,
    targetSameCount,
    targetOpposingCount,
    AUTOMOTIVE_PALETTE,
    RANDOM_VEHICLE_TYPES,
  ]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative bg-slate-950 overflow-hidden flex flex-col select-none font-sans"
    >
      {/* SVG Canvas for Overhead Vector Driving Environment */}
      <svg
        className="w-full h-full absolute inset-0 z-0"
        viewBox={`0 0 966 ${viewH}`}
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          {/* Asphalt Surface Pattern */}
          <pattern id="asphalt-pattern" width="24" height="24" patternUnits="userSpaceOnUse">
            <rect width="24" height="24" fill="#090d16" />
            <circle cx="6" cy="6" r="1.2" fill="#1e293b" opacity="0.65" />
            <circle cx="18" cy="14" r="0.9" fill="#1e293b" opacity="0.55" />
          </pattern>

          {/* Ego Vehicle Glowing Halo Filter */}
          <filter id="ego-halo-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="8" result="blur1" />
            <feGaussianBlur stdDeviation="16" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* ADAS Hazard Glow Filter */}
          <filter id="hazard-glow-red" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="7" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Forward Headlight Beam Gradient */}
          <radialGradient id="ego-headlight-beam" cx="50%" cy="0%" r="100%">
            <stop offset="0%" stopColor="#f0f9ff" stopOpacity="0.80" />
            <stop offset="45%" stopColor="#38bdf8" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
          </radialGradient>

          {/* Median High-Mast Street Light Ambient Pool */}
          <radialGradient id="median-light-pool" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.70" />
            <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ground Background */}
        <rect width="966" height={viewH} fill="#030712" />

        {/* Outer Shoulders */}
        <rect
          x={52}
          y={0}
          width={862}
          height={viewH}
          fill="#0f172a"
        />

        {/* Main Road Surface (826px width: x=70 to x=896) */}
        <rect
          x={70}
          y={0}
          width={826}
          height={viewH}
          fill="url(#asphalt-pattern)"
        />

        {/* Outer Solid Shoulder Markings (x=70 and x=896) */}
        <line
          x1={70}
          y1={0}
          x2={70}
          y2={viewH}
          stroke="#64748b"
          strokeWidth="3.5"
        />
        <line
          x1={896}
          y1={0}
          x2={896}
          y2={viewH}
          stroke="#64748b"
          strokeWidth="3.5"
        />

        {/* Opposing Lanes Dashed Separator (x=235.2) */}
        <line
          x1={235.2}
          y1={0}
          x2={235.2}
          y2={viewH}
          stroke="#64748b"
          strokeWidth="2.5"
          strokeDasharray="18, 22"
          strokeDashoffset={-roadDashOffset}
          opacity="0.8"
        />

        {/* CENTER CONCRETE MEDIAN ZONE (x=400.4 to x=565.6, centered at x=483.0) */}
        <rect
          x={400.4}
          y={0}
          width={165.2}
          height={viewH}
          fill="#1e293b"
        />

        {/* Concrete Curb Borders */}
        <line
          x1={400.4}
          y1={0}
          x2={400.4}
          y2={viewH}
          stroke="#64748b"
          strokeWidth="3"
        />
        <line
          x1={565.6}
          y1={0}
          x2={565.6}
          y2={viewH}
          stroke="#64748b"
          strokeWidth="3"
        />

        {/* Neutral Slate Diagonal Median Hatching */}
        <g opacity="0.30">
          {Array.from({ length: Math.ceil(viewH / 40) + 2 }).map((_, i) => (
            <line
              key={`med-stripe-${i}`}
              x1={408}
              y1={i * 40 - 20}
              x2={558}
              y2={i * 40 + 10}
              stroke="#94a3b8"
              strokeWidth="2"
            />
          ))}
        </g>

        {/* HIGH-MAST MEDIAN STREET LIGHT FIXTURE (Centered at x=483.0 in median, scrolling smoothly) */}
        <g id="median-light-fixture" transform={`translate(483, ${medianLightY})`}>
          {/* Ambient Ground Light Pool beneath lamp */}
          <ellipse cx="0" cy="18" rx="92" ry="40" fill="url(#median-light-pool)" opacity="0.45" />

          {/* Pole Concrete Base Flange on Median */}
          <circle cx="0" cy="38" r="7" fill="#0f172a" stroke="#475569" strokeWidth="2" />
          <circle cx="0" cy="38" r="3" fill="#64748b" />

          {/* High-Mast Tapered Shaft */}
          <line x1="1" y1="38" x2="1" y2="-28" stroke="#0f172a" strokeWidth="4.5" />
          <line x1="0" y1="38" x2="0" y2="-28" stroke="#334155" strokeWidth="3.5" strokeLinecap="round" />
          <line x1="-0.8" y1="38" x2="-0.8" y2="-28" stroke="#64748b" strokeWidth="1.2" />

          {/* Mast T-Bar Arm widening into Lamp Housing */}
          <line x1="-16" y1="-28" x2="16" y2="-28" stroke="#475569" strokeWidth="3.5" strokeLinecap="round" />

          {/* Left Lamp Housing & LED Glow */}
          <rect x="-24" y="-33" width="12" height="8" rx="2" fill="#0f172a" stroke="#64748b" strokeWidth="1" />
          <circle cx="-18" cy="-29" r="6.5" fill="#38bdf8" opacity="0.35" />
          <circle cx="-18" cy="-29" r="2.5" fill="#fef08a" />

          {/* Right Lamp Housing & LED Glow */}
          <rect x="12" y="-33" width="12" height="8" rx="2" fill="#0f172a" stroke="#64748b" strokeWidth="1" />
          <circle cx="18" cy="-29" r="6.5" fill="#38bdf8" opacity="0.35" />
          <circle cx="18" cy="-29" r="2.5" fill="#fef08a" />
        </g>

        {/* Ego Lanes Dashed Separator (x=730.8) */}
        <line
          x1={730.8}
          y1={0}
          x2={730.8}
          y2={viewH}
          stroke="#e2e8f0"
          strokeWidth="2.5"
          strokeDasharray="18, 22"
          strokeDashoffset={roadDashOffset}
          opacity="0.85"
        />

        {/* Scene Objects (Cones, Barricades, Workers, Pedestrians) */}
        {sceneObjects.map((obj) => {
          const absX = obj.x;
          const absY = absEgoY + obj.y;

          if (obj.type === 'orangeCone') {
            return (
              <g key={obj.id} transform={`translate(${absX}, ${absY})`}>
                <circle cx="0" cy="0" r="7.5" fill="#f97316" stroke="#ea580c" strokeWidth="1.5" />
                <circle cx="0" cy="0" r="4.5" fill="#f8fafc" />
                <circle cx="0" cy="0" r="2" fill="#ea580c" />
              </g>
            );
          } else if (obj.type === 'pedestrian') {
            return (
              <g key={obj.id} transform={`translate(${absX}, ${absY})`}>
                <ellipse cx="0" cy="0" rx="9.5" ry="5.5" fill="#38bdf8" />
                <circle cx="0" cy="0" r="4" fill="#f8fafc" stroke="#0284c7" strokeWidth="1" />
              </g>
            );
          } else if (obj.type === 'constructionBarricade') {
            return (
              <g key={obj.id} transform={`translate(${absX}, ${absY})`}>
                <rect x="-18" y="-5" width="36" height="10" fill="#0f172a" stroke="#f97316" strokeWidth="2" rx="2" />
                <line x1="-12" y1="-5" x2="-5" y2="5" stroke="#f97316" strokeWidth="3" />
                <line x1="0" y1="-5" x2="7" y2="5" stroke="#f97316" strokeWidth="3" />
                <line x1="12" y1="-5" x2="18" y2="5" stroke="#f97316" strokeWidth="3" />
              </g>
            );
          } else if (obj.type === 'roadWorker') {
            return (
              <g key={obj.id} transform={`translate(${absX}, ${absY})`}>
                <ellipse cx="0" cy="0" rx="10" ry="6" fill="#eab308" />
                <circle cx="0" cy="0" r="4.5" fill="#f97316" />
              </g>
            );
          }
          return null;
        })}

        {/* Highway Traffic Vehicles */}
        {traffic.map((v) => {
          const dims = getVehicleDims(v.type);
          const absX = getLaneX(v.lane);
          const absY = absEgoY + v.y;
          const headingAngle = v.isOpposing ? 180 : 0;

          return (
            <g
              key={v.id}
              transform={`translate(${absX}, ${absY}) rotate(${headingAngle})`}
            >
              <VehicleGraphic
                type={v.type}
                w={dims.w}
                l={dims.l}
                color={v.color}
                isEgo={false}
              />
            </g>
          );
        })}

        {/* EGO VEHICLE MASTER LAYER (Drives on lower highway) */}
        <g id="ego-vehicle-master" transform={`translate(${absEgoX}, ${absEgoY})`}>
          {/* Forward Headlight Beam - Only rendered when Headlights are ON */}
          {isHeadlightsOn && (
            <polygon
              points={`-${egoW * 0.85},-${egoL * 0.5} ${egoW * 0.85},-${egoL * 0.5} ${egoW * 3.2},-${egoL * 3.6} -${egoW * 3.2},-${egoL * 3.6}`}
              fill="url(#ego-headlight-beam)"
            />
          )}

          {/* ADAS Blind Spot Warning Cones */}
          {isBlindSpotWarningActive && (
            <g id="blind-spot-spatial-zone">
              <path
                d={`M -${egoW * 0.5} ${egoL * 0.1} L -${egoW * 3.2} ${egoL * 1.8} A 90 90 0 0 1 -${egoW * 0.8} ${egoL * 3.2} Z`}
                fill={blindSpotColor}
                fillOpacity={blindSpotOpacity}
                filter="url(#hazard-glow-red)"
                stroke={blindSpotColor}
                strokeWidth="2.5"
              />
              <path
                d={`M ${egoW * 0.5} ${egoL * 0.1} L ${egoW * 3.2} ${egoL * 1.8} A 90 90 0 0 0 ${egoW * 0.8} ${egoL * 3.2} Z`}
                fill={blindSpotColor}
                fillOpacity={blindSpotOpacity}
                filter="url(#hazard-glow-red)"
                stroke={blindSpotColor}
                strokeWidth="2.5"
              />
            </g>
          )}

          {/* ADAS Proximity Sensor Arcs */}
          {isProximityWarningActive && (
            <g id="proximity-sensor-spatial-zone">
              <circle
                cx="0"
                cy="0"
                r={egoL * 0.92}
                fill="none"
                stroke={sensorColor}
                strokeWidth="3"
                strokeDasharray="9 7"
                filter="url(#hazard-glow-red)"
                opacity={sensorOpacity}
              />
            </g>
          )}

          {/* Primary Ego Vehicle Graphic */}
          <VehicleGraphic
            type="sedan"
            w={egoW}
            l={egoL}
            color="#f8fafc"
            isEgo={true}
            egoType={activeEgoType}
            accentColor={customAccentColor}
            headlightsOn={isHeadlightsOn}
          />
        </g>
      </svg>

      {/* Speed Limit Sign Overlay - Non-pulsating Edge-Triggered Flash */}
      {speedLimitVisible && (
        <div
          className={`absolute z-10 p-2.5 pointer-events-none transition-all duration-300 ${
            speedLimitPosition === 'bottom-left' ? 'bottom-3 left-3' : 'bottom-3 right-3'
          }`}
        >
          {speedLimitStyle === 'eu_circle' ? (
            <div
              className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white border-[4px] flex flex-col items-center justify-center shadow-2xl font-mono transition-all duration-300 ${
                isSpeedingFlash
                  ? 'border-rose-600 ring-4 ring-rose-500/80 shadow-[0_0_22px_rgba(244,63,94,0.85)]'
                  : 'border-rose-600'
              }`}
            >
              <span className="text-xs sm:text-sm font-black text-slate-950 leading-none">
                {speedLimitVal}
              </span>
            </div>
          ) : (
            /* US Standard Rectangular Sign */
            <div
              className={`w-12 sm:w-14 py-1.5 rounded-lg bg-white border-2 text-slate-950 font-sans flex flex-col items-center justify-center shadow-2xl transition-all duration-300 ${
                isSpeedingFlash
                  ? 'border-rose-600 ring-4 ring-rose-500/80 shadow-[0_0_22px_rgba(244,63,94,0.85)]'
                  : 'border-slate-900'
              }`}
            >
              <span className="text-[7.5px] sm:text-[8.5px] font-black uppercase tracking-tight leading-tight text-slate-800">
                SPEED
              </span>
              <span className="text-[7.5px] sm:text-[8.5px] font-black uppercase tracking-tight leading-tight text-slate-800">
                LIMIT
              </span>
              <span className="text-xs sm:text-sm font-black font-mono leading-none mt-0.5 text-slate-950">
                {speedLimitVal}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
