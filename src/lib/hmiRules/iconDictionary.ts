/**
 * ISO 2575 / SAE J2364 Standardized Automotive Icon Mapping Dictionary
 *
 * Maps canonical automotive ISO/SAE telltale and symbol tokens to approved
 * Lucide icon representations and standard ISO 2575 identifiers.
 */

export interface StandardIconEntry {
  token: string;
  isoSymbolId?: string; // e.g. "ISO 2575 F.01"
  saeCode?: string;     // e.g. "SAE J2364 Tell-Tale"
  description: string;
  lucideIconName: string;
  category: 'safety' | 'climate' | 'navigation' | 'media' | 'lighting' | 'propulsion' | 'comfort';
}

export const APPROVED_AUTOMOTIVE_ICONS: Record<string, StandardIconEntry> = {
  // Safety & Warning
  'hazard-warning': {
    token: 'hazard-warning',
    isoSymbolId: 'ISO 2575 F.01',
    saeCode: 'SAE J2364 #1',
    description: 'Hazard Warning / Master Warning Indicator',
    lucideIconName: 'AlertTriangle',
    category: 'safety',
  },
  'door-ajar': {
    token: 'door-ajar',
    isoSymbolId: 'ISO 2575 F.26',
    description: 'Door Ajar / Unlatched Status',
    lucideIconName: 'DoorClosed',
    category: 'safety',
  },
  'tire-pressure': {
    token: 'tire-pressure',
    isoSymbolId: 'ISO 2575 F.29',
    saeCode: 'TPMS Tell-Tale',
    description: 'Tire Pressure Monitoring System (TPMS)',
    lucideIconName: 'CircleDot',
    category: 'safety',
  },
  'blind-spot': {
    token: 'blind-spot',
    isoSymbolId: 'ISO 2575 ADAS.04',
    description: 'Blind Spot Monitoring Indicator',
    lucideIconName: 'Eye',
    category: 'safety',
  },
  'proximity-alert': {
    token: 'proximity-alert',
    isoSymbolId: 'ISO 2575 ADAS.08',
    description: 'Obstacle Proximity Detection',
    lucideIconName: 'Activity',
    category: 'safety',
  },

  // Propulsion & Energy
  'battery-state': {
    token: 'battery-state',
    isoSymbolId: 'ISO 2575 B.01',
    description: 'High-Voltage Traction Battery Level',
    lucideIconName: 'Battery',
    category: 'propulsion',
  },
  'battery-charging': {
    token: 'battery-charging',
    isoSymbolId: 'ISO 2575 B.03',
    description: 'EV Charging System Active',
    lucideIconName: 'Zap',
    category: 'propulsion',
  },
  'speedometer': {
    token: 'speedometer',
    isoSymbolId: 'ISO 2575 P.01',
    description: 'Vehicle Speed Readout Gauge',
    lucideIconName: 'Gauge',
    category: 'propulsion',
  },
  'cruise-control': {
    token: 'cruise-control',
    isoSymbolId: 'ISO 2575 C.01',
    description: 'Cruise Control System Engaged',
    lucideIconName: 'Gauge',
    category: 'propulsion',
  },
  'gear-selector': {
    token: 'gear-selector',
    isoSymbolId: 'ISO 2575 G.01',
    description: 'Transmission Gear Position (PRND)',
    lucideIconName: 'ParkingCircle',
    category: 'propulsion',
  },
  'drive-mode': {
    token: 'drive-mode',
    isoSymbolId: 'ISO 2575 G.04',
    description: 'Powertrain Drive Dynamics Mode',
    lucideIconName: 'Compass',
    category: 'propulsion',
  },

  // Climate / HVAC (ISO 2575 Climate Section)
  'defrost-front': {
    token: 'defrost-front',
    isoSymbolId: 'ISO 2575 D.01',
    description: 'Windshield Defrost / Defog System',
    lucideIconName: 'Wind',
    category: 'climate',
  },
  'defrost-rear': {
    token: 'defrost-rear',
    isoSymbolId: 'ISO 2575 D.02',
    description: 'Rear Window Demist / Heating',
    lucideIconName: 'Wind',
    category: 'climate',
  },
  'fan-speed': {
    token: 'fan-speed',
    isoSymbolId: 'ISO 2575 D.05',
    description: 'HVAC Blower Fan Speed Adjustment',
    lucideIconName: 'Fan',
    category: 'climate',
  },
  'cabin-temperature': {
    token: 'cabin-temperature',
    isoSymbolId: 'ISO 2575 D.08',
    description: 'Cabin HVAC Thermostat & Zone Control',
    lucideIconName: 'Thermometer',
    category: 'climate',
  },
  'seat-heating': {
    token: 'seat-heating',
    isoSymbolId: 'ISO 2575 D.12',
    description: 'Seat Cushion & Backrest Heating',
    lucideIconName: 'Flame',
    category: 'climate',
  },
  'seat-cooling': {
    token: 'seat-cooling',
    isoSymbolId: 'ISO 2575 D.13',
    description: 'Ventilated / Cooled Seat System',
    lucideIconName: 'Snowflake',
    category: 'climate',
  },

  // Navigation & Maneuvers (SAE J2364 Wayfinding)
  'nav-turn-right': {
    token: 'nav-turn-right',
    saeCode: 'SAE J2364 Nav-01',
    description: 'Turn Right Maneuver Guidance',
    lucideIconName: 'CornerUpRight',
    category: 'navigation',
  },
  'nav-turn-left': {
    token: 'nav-turn-left',
    saeCode: 'SAE J2364 Nav-02',
    description: 'Turn Left Maneuver Guidance',
    lucideIconName: 'CornerUpLeft',
    category: 'navigation',
  },
  'nav-straight': {
    token: 'nav-straight',
    saeCode: 'SAE J2364 Nav-03',
    description: 'Proceed Straight / Maintain Route',
    lucideIconName: 'ArrowUp',
    category: 'navigation',
  },
  'nav-waypoint': {
    token: 'nav-waypoint',
    saeCode: 'SAE J2364 Nav-08',
    description: 'Destination / Waypoint Marker',
    lucideIconName: 'MapPin',
    category: 'navigation',
  },
  'nav-compass': {
    token: 'nav-compass',
    saeCode: 'SAE J2364 Nav-10',
    description: 'Heading / Compass Orientation',
    lucideIconName: 'Compass',
    category: 'navigation',
  },

  // Audio / Media
  'media-play': {
    token: 'media-play',
    isoSymbolId: 'ISO 2575 M.01',
    description: 'Media Play / Resume Audio',
    lucideIconName: 'Play',
    category: 'media',
  },
  'media-pause': {
    token: 'media-pause',
    isoSymbolId: 'ISO 2575 M.02',
    description: 'Media Pause Audio',
    lucideIconName: 'Pause',
    category: 'media',
  },
  'media-next': {
    token: 'media-next',
    isoSymbolId: 'ISO 2575 M.03',
    description: 'Skip to Next Track',
    lucideIconName: 'SkipForward',
    category: 'media',
  },
  'media-prev': {
    token: 'media-prev',
    isoSymbolId: 'ISO 2575 M.04',
    description: 'Skip to Previous Track',
    lucideIconName: 'SkipBack',
    category: 'media',
  },
  'audio-volume': {
    token: 'audio-volume',
    isoSymbolId: 'ISO 2575 M.08',
    description: 'Audio Volume Level & Mute',
    lucideIconName: 'Volume2',
    category: 'media',
  },

  // Lighting
  'headlights-main': {
    token: 'headlights-main',
    isoSymbolId: 'ISO 2575 L.01',
    description: 'Low Beam / Main Headlamps',
    lucideIconName: 'Sun',
    category: 'lighting',
  },

  // Telephony & Communications
  'phone-call': {
    token: 'phone-call',
    isoSymbolId: 'ISO 2575 T.01',
    description: 'Handsfree Telephony Call',
    lucideIconName: 'Phone',
    category: 'comfort',
  },
  'phone-message': {
    token: 'phone-message',
    isoSymbolId: 'ISO 2575 T.04',
    description: 'Inbound Communication / Messaging',
    lucideIconName: 'MessageSquare',
    category: 'comfort',
  },
};

/**
 * Checks if a given icon name or token conforms to approved ISO 2575 / SAE J2364 standards.
 */
export function isStandardAutomotiveIcon(nameOrToken: string): boolean {
  if (!nameOrToken) return false;
  const normalized = nameOrToken.trim().toLowerCase();

  // Direct match on token
  if (APPROVED_AUTOMOTIVE_ICONS[normalized]) return true;

  // Match on Lucide icon name or token value
  const matched = Object.values(APPROVED_AUTOMOTIVE_ICONS).some(
    (entry) =>
      entry.token.toLowerCase() === normalized ||
      entry.lucideIconName.toLowerCase() === normalized ||
      entry.token.replace(/-/g, '').toLowerCase() === normalized.replace(/-/g, '')
  );

  if (matched) return true;

  // Standard Lucide icons used across Mockpit's automotive systems
  const automotiveLucideAllowlist = [
    'battery', 'batterycharging', 'gauge', 'circlepause', 'play', 'pause',
    'skipforward', 'skipback', 'volumex', 'volume2', 'volume1',
    'wind', 'fan', 'thermometer', 'flame', 'snowflake', 'mappin',
    'navigation', 'compass', 'cornerupright', 'cornerupleft', 'arrowup',
    'phone', 'phonecall', 'phoneoff', 'messagesquare', 'eye', 'alerttriangle',
    'parkingcircle', 'zap', 'sun', 'moon', 'doorclosed', 'activity', 'radio',
    'search', 'star', 'home', 'layers', 'sliders', 'settings', 'clock',
    'listmusic', 'music', 'folder', 'sparkles', 'trendingup', 'heart', 'disc'
  ];

  return automotiveLucideAllowlist.includes(normalized.replace(/[^a-z0-9]/g, ''));
}
