const fs = require('fs');
const path = require('path');
const { Resvg } = require('@resvg/resvg-js');

const publicVehiclesDir = path.join(__dirname, '../public/vehicles');
const processedDir = path.join(__dirname, '../public/vehicles/processed');

if (!fs.existsSync(publicVehiclesDir)) fs.mkdirSync(publicVehiclesDir, { recursive: true });
if (!fs.existsSync(processedDir)) fs.mkdirSync(processedDir, { recursive: true });

// SVG Generator Helper
function generateVehicleSVG(spec) {
  const {
    id,
    type, // 'coupe', 'sedan', 'truck', 'sports'
    bodyColor1,
    bodyColor2,
    roofColor,
    isTruck,
    hasSpoiler,
    isDually,
    hasRoofRack,
  } = spec;

  const width = 300;
  const height = 600;

  // Dimensions based on type
  let bodyWidth = 140;
  let bodyLength = 380;
  let bodyY = 110;
  let bodyRx = 35;

  if (type === 'coupe') {
    bodyWidth = 144;
    bodyLength = 360;
    bodyY = 120;
    bodyRx = 40;
  } else if (type === 'truck') {
    bodyWidth = isDually ? 168 : 152;
    bodyLength = 430;
    bodyY = 85;
    bodyRx = 25;
  } else if (type === 'sports') {
    bodyWidth = 150;
    bodyLength = 370;
    bodyY = 115;
    bodyRx = 45;
  }

  const centerX = width / 2;
  const bodyX = centerX - bodyWidth / 2;

  // Window bounds
  const windshieldY = bodyY + bodyLength * 0.28;
  const windshieldH = bodyLength * 0.16;
  const rearWindowY = bodyY + bodyLength * 0.65;
  const rearWindowH = bodyLength * 0.12;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <!-- Body Metallic Gradient -->
      <linearGradient id="bodyGrad_${id}" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="${bodyColor1}" />
        <stop offset="25%" stop-color="${bodyColor2}" />
        <stop offset="50%" stop-color="${bodyColor1}" />
        <stop offset="75%" stop-color="${bodyColor2}" />
        <stop offset="100%" stop-color="${bodyColor1}" />
      </linearGradient>

      <!-- Glass Tint Gradient -->
      <linearGradient id="glassGrad_${id}" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#1e293b" stop-opacity="0.95" />
        <stop offset="50%" stop-color="#38bdf8" stop-opacity="0.6" />
        <stop offset="100%" stop-color="#0f172a" stop-opacity="0.9" />
      </linearGradient>

      <!-- Carbon/Roof Gradient -->
      <linearGradient id="roofGrad_${id}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${roofColor || '#0f172a'}" />
        <stop offset="100%" stop-color="#1e293b" />
      </linearGradient>

      <!-- Shadow Filter -->
      <filter id="dropShadow_${id}" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="6" />
        <feOffset dx="0" dy="8" result="offsetblur" />
        <feComponentTransfer>
          <feFuncA type="linear" slope="0.4" />
        </feComponentTransfer>
        <feMerge> 
          <feMergeNode />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>

    <g filter="url(#dropShadow_${id})">
      <!-- Side Mirrors -->
      <rect x="${bodyX - 12}" y="${windshieldY + 10}" width="14" height="24" rx="6" fill="${bodyColor1}" stroke="#0f172a" stroke-width="2" />
      <rect x="${bodyX + bodyWidth - 2}" y="${windshieldY + 10}" width="14" height="24" rx="6" fill="${bodyColor1}" stroke="#0f172a" stroke-width="2" />

      <!-- Tires -->
      <!-- Front Wheels -->
      <rect x="${bodyX - 8}" y="${bodyY + bodyLength * 0.15}" width="12" height="42" rx="4" fill="#1e293b" stroke="#000" stroke-width="2" />
      <rect x="${bodyX + bodyWidth - 4}" y="${bodyY + bodyLength * 0.15}" width="12" height="42" rx="4" fill="#1e293b" stroke="#000" stroke-width="2" />

      <!-- Rear Wheels -->
      <rect x="${bodyX - (isDually ? 14 : 8)}" y="${bodyY + bodyLength * 0.72}" width="${isDually ? 20 : 12}" height="46" rx="4" fill="#1e293b" stroke="#000" stroke-width="2" />
      <rect x="${bodyX + bodyWidth - (isDually ? 6 : 4)}" y="${bodyY + bodyLength * 0.72}" width="${isDually ? 20 : 12}" height="46" rx="4" fill="#1e293b" stroke="#000" stroke-width="2" />

      <!-- Main Body Shell -->
      <rect x="${bodyX}" y="${bodyY}" width="${bodyWidth}" height="${bodyLength}" rx="${bodyRx}" fill="url(#bodyGrad_${id})" stroke="#0f172a" stroke-width="3" />

      ${isDually ? `
        <!-- Dually Rear Wheel Flares -->
        <path d="M ${bodyX - 10} ${bodyY + bodyLength * 0.65} Q ${bodyX - 16} ${bodyY + bodyLength * 0.75} ${bodyX} ${bodyY + bodyLength * 0.88} L ${bodyX} ${bodyY + bodyLength * 0.65} Z" fill="url(#bodyGrad_${id})" stroke="#0f172a" stroke-width="2"/>
        <path d="M ${bodyX + bodyWidth + 10} ${bodyY + bodyLength * 0.65} Q ${bodyX + bodyWidth + 16} ${bodyY + bodyLength * 0.75} ${bodyX + bodyWidth} ${bodyY + bodyLength * 0.88} L ${bodyX + bodyWidth} ${bodyY + bodyLength * 0.65} Z" fill="url(#bodyGrad_${id})" stroke="#0f172a" stroke-width="2"/>
      ` : ''}

      <!-- Hood Lines / Creases -->
      <path d="M ${centerX - bodyWidth * 0.28} ${bodyY + 12} L ${centerX - bodyWidth * 0.25} ${windshieldY - 10} M ${centerX + bodyWidth * 0.28} ${bodyY + 12} L ${centerX + bodyWidth * 0.25} ${windshieldY - 10}" stroke="#0f172a" stroke-width="2" opacity="0.6" />

      ${isTruck ? `
        <!-- Truck Bed Section -->
        <rect x="${bodyX + 12}" y="${bodyY + bodyLength * 0.52}" width="${bodyWidth - 24}" height="${bodyLength * 0.42}" rx="6" fill="#0f172a" stroke="#334155" stroke-width="2" />
        <line x1="${bodyX + 18}" y1="${bodyY + bodyLength * 0.60}" x2="${bodyX + bodyWidth - 18}" y2="${bodyY + bodyLength * 0.60}" stroke="#334155" stroke-width="2" />
        <line x1="${bodyX + 18}" y1="${bodyY + bodyLength * 0.72}" x2="${bodyX + bodyWidth - 18}" y2="${bodyY + bodyLength * 0.72}" stroke="#334155" stroke-width="2" />
        <line x1="${bodyX + 18}" y1="${bodyY + bodyLength * 0.84}" x2="${bodyX + bodyWidth - 18}" y2="${bodyY + bodyLength * 0.84}" stroke="#334155" stroke-width="2" />
      ` : ''}

      <!-- Front Windshield -->
      <path d="M ${bodyX + 14} ${windshieldY + windshieldH} Q ${centerX} ${windshieldY - 8} ${bodyX + bodyWidth - 14} ${windshieldY + windshieldH} Z" fill="url(#glassGrad_${id})" stroke="#0f172a" stroke-width="2" />

      <!-- Cabin Roof Panel -->
      <rect x="${bodyX + 16}" y="${windshieldY + windshieldH + 4}" width="${bodyWidth - 32}" height="${isTruck ? bodyLength * 0.18 : bodyLength * 0.22}" rx="12" fill="url(#roofGrad_${id})" stroke="#0f172a" stroke-width="2" />

      ${!isTruck ? `
        <!-- Rear Window -->
        <path d="M ${bodyX + 18} ${rearWindowY} Q ${centerX} ${rearWindowY + rearWindowH + 6} ${bodyX + bodyWidth - 18} ${rearWindowY} Z" fill="url(#glassGrad_${id})" stroke="#0f172a" stroke-width="2" />
      ` : ''}

      <!-- LED Headlights -->
      <path d="M ${bodyX + 12} ${bodyY + 6} Q ${bodyX + 32} ${bodyY + 4} ${bodyX + 42} ${bodyY + 18} Z" fill="#38bdf8" />
      <path d="M ${bodyX + bodyWidth - 12} ${bodyY + 6} Q ${bodyX + bodyWidth - 32} ${bodyY + 4} ${bodyX + bodyWidth - 42} ${bodyY + 18} Z" fill="#38bdf8" />
      <circle cx="${bodyX + 22}" cy="${bodyY + 10}" r="3" fill="#ffffff" />
      <circle cx="${bodyX + bodyWidth - 22}" cy="${bodyY + 10}" r="3" fill="#ffffff" />

      <!-- Rear Taillights -->
      <rect x="${bodyX + 12}" y="${bodyY + bodyLength - 10}" width="${bodyWidth * 0.3}" height="6" rx="2" fill="#ef4444" />
      <rect x="${bodyX + bodyWidth - bodyWidth * 0.3 - 12}" y="${bodyY + bodyLength - 10}" width="${bodyWidth * 0.3}" height="6" rx="2" fill="#ef4444" />

      ${hasSpoiler ? `
        <!-- Rear Performance Spoiler Wing -->
        <rect x="${bodyX + 8}" y="${bodyY + bodyLength - 18}" width="${bodyWidth - 16}" height="10" rx="3" fill="#0f172a" stroke="#38bdf8" stroke-width="1.5" />
      ` : ''}

      ${hasRoofRack ? `
        <!-- Roof Rack Rails -->
        <line x1="${bodyX + 22}" y1="${windshieldY + 20}" x2="${bodyX + 22}" y2="${rearWindowY - 10}" stroke="#64748b" stroke-width="4" stroke-linecap="round"/>
        <line x1="${bodyX + bodyWidth - 22}" y1="${windshieldY + 20}" x2="${bodyX + bodyWidth - 22}" y2="${rearWindowY - 10}" stroke="#64748b" stroke-width="4" stroke-linecap="round"/>
      ` : ''}
    </g>
  </svg>`;

  return svg;
}

const VEHICLE_SPECS = [
  { id: 'vehicle-01', type: 'coupe', bodyColor1: '#0284c7', bodyColor2: '#38bdf8', roofColor: '#0f172a', hasSpoiler: true },
  { id: 'vehicle-02', type: 'sedan', bodyColor1: '#334155', bodyColor2: '#64748b', roofColor: '#1e293b' },
  { id: 'vehicle-03', type: 'sedan', bodyColor1: '#1e1b4b', bodyColor2: '#4338ca', roofColor: '#0f172a' },
  { id: 'vehicle-04', type: 'sedan', bodyColor1: '#475569', bodyColor2: '#94a3b8', roofColor: '#1e293b' },
  { id: 'vehicle-05', type: 'coupe', bodyColor1: '#b91c1c', bodyColor2: '#ef4444', roofColor: '#0f172a', hasSpoiler: true },
  { id: 'vehicle-06', type: 'sedan', bodyColor1: '#1e293b', bodyColor2: '#334155', roofColor: '#0f172a' },
  { id: 'vehicle-07', type: 'sedan', bodyColor1: '#0369a1', bodyColor2: '#0284c7', roofColor: '#0f172a' },
  { id: 'vehicle-08', type: 'sedan', bodyColor1: '#334155', bodyColor2: '#475569', roofColor: '#1e293b' },
  { id: 'vehicle-09', type: 'sedan', bodyColor1: '#e2e8f0', bodyColor2: '#ffffff', roofColor: '#0f172a' },
  { id: 'vehicle-10', type: 'sports', bodyColor1: '#1d4ed8', bodyColor2: '#3b82f6', roofColor: '#0f172a', hasSpoiler: true },
  { id: 'vehicle-11', type: 'sedan', bodyColor1: '#262626', bodyColor2: '#525252', roofColor: '#171717' },
  { id: 'vehicle-12', type: 'sports', bodyColor1: '#047857', bodyColor2: '#10b981', roofColor: '#0f172a', hasSpoiler: true },
  { id: 'vehicle-13', type: 'truck', bodyColor1: '#334155', bodyColor2: '#475569', isTruck: true },
  { id: 'vehicle-14', type: 'truck', bodyColor1: '#111827', bodyColor2: '#1f2937', isTruck: true, isDually: true },
  { id: 'vehicle-15', type: 'truck', bodyColor1: '#b45309', bodyColor2: '#d97706', isTruck: true, isDually: true, hasRoofRack: true },
  { id: 'vehicle-16', type: 'truck', bodyColor1: '#0369a1', bodyColor2: '#0284c7', isTruck: true, hasRoofRack: true },
];

console.log('Generating 16 clean vehicle PNG assets...');

VEHICLE_SPECS.forEach((spec) => {
  const svg = generateVehicleSVG(spec);
  const resvg = new Resvg(svg, {
    fitTo: {
      mode: 'width',
      value: 300,
    },
  });
  const pngBuffer = resvg.render().asPng();

  const publicPath = path.join(publicVehiclesDir, `${spec.id}.png`);
  const processedPath = path.join(processedDir, `${spec.id}.png`);

  fs.writeFileSync(publicPath, pngBuffer);
  fs.writeFileSync(processedPath, pngBuffer);

  console.log(`Generated ${spec.id}.png (${pngBuffer.length} bytes) -> public/vehicles/ & processed/`);
});

console.log('All 16 vehicle model images successfully generated!');
