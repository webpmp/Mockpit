// Default hardcoded technical exploded vehicle blueprint asset
// High-contrast automotive engineering vector illustration showing exploded chassis, battery, powertrain, and body layers

const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 650" width="100%" height="100%">
  <defs>
    <!-- Gradients -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#090d16" />
      <stop offset="50%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#050811" />
    </linearGradient>
    <linearGradient id="cyanGlow" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.9" />
      <stop offset="100%" stop-color="#06b6d4" stop-opacity="0.9" />
    </linearGradient>
    <linearGradient id="emeraldGlow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#34d399" stop-opacity="0.8" />
      <stop offset="100%" stop-color="#059669" stop-opacity="0.8" />
    </linearGradient>
    <linearGradient id="amberGlow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fbbf24" stop-opacity="0.9" />
      <stop offset="100%" stop-color="#f59e0b" stop-opacity="0.9" />
    </linearGradient>
    <linearGradient id="roofGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.3" />
      <stop offset="100%" stop-color="#0284c7" stop-opacity="0.05" />
    </linearGradient>
    <linearGradient id="batteryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f766e" stop-opacity="0.4" />
      <stop offset="100%" stop-color="#064e3b" stop-opacity="0.6" />
    </linearGradient>

    <!-- Grid Pattern -->
    <pattern id="isoGrid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" stroke-width="0.75" stroke-opacity="0.6" />
      <circle cx="0" cy="0" r="1" fill="#38bdf8" fill-opacity="0.3" />
    </pattern>
  </defs>

  <!-- Background Base Canvas -->
  <rect width="1000" height="650" fill="url(#bgGrad)" rx="16" />
  <rect width="1000" height="650" fill="url(#isoGrid)" rx="16" />

  <!-- Blueprint Crosshairs & Grid Lines -->
  <g stroke="#38bdf8" stroke-width="0.75" stroke-opacity="0.25" stroke-dasharray="3 3">
    <line x1="100" y1="50" x2="100" y2="600" />
    <line x1="900" y1="50" x2="900" y2="600" />
    <line x1="50" y1="325" x2="950" y2="325" />
    <line x1="500" y1="30" x2="500" y2="620" />
  </g>

  <!-- Axis and Diagnostic Labels -->
  <text x="40" y="50" fill="#38bdf8" font-family="monospace" font-size="12" font-weight="bold" letter-spacing="2">MOCKPIT DIAGNOSTIC // EXPLODED ARCHITECTURE</text>
  <text x="40" y="68" fill="#64748b" font-family="monospace" font-size="9" letter-spacing="1">PLATFORM: EV-ULTRA-800V // SCALE 1:14 // PROJECTION: ISOMETRIC EXPLODED</text>
  <text x="960" y="50" text-anchor="end" fill="#38bdf8" font-family="monospace" font-size="11" font-weight="bold">REV 4.2</text>

  <!-- LAYER 1: TOP BODY CANOPY & GLASS ROOF (Exploded Upwards ~ Y: 110) -->
  <g id="layer-canopy" transform="translate(0, -30)">
    <!-- Exploded guide leader -->
    <line x1="500" y1="160" x2="500" y2="280" stroke="#38bdf8" stroke-width="1" stroke-dasharray="4 4" stroke-opacity="0.4" />
    
    <!-- Outer Roof & Greenhouse Boundary -->
    <path d="M 280 145 L 420 105 L 680 105 L 770 145 L 720 190 L 330 190 Z" 
          fill="url(#roofGrad)" stroke="#38bdf8" stroke-width="1.8" stroke-opacity="0.85" />
    
    <!-- Glass Roof Division & Solar Ribs -->
    <path d="M 430 110 L 410 185 M 510 106 L 500 188 M 590 106 L 590 188 M 670 110 L 680 185" 
          stroke="#38bdf8" stroke-width="1" stroke-opacity="0.5" />
    <path d="M 330 150 L 720 150" stroke="#38bdf8" stroke-width="0.75" stroke-dasharray="2 2" stroke-opacity="0.4" />

    <!-- A/B/C Pillars -->
    <path d="M 280 145 L 295 185 M 770 145 L 755 185 M 500 106 L 500 188" stroke="#7dd3fc" stroke-width="2" stroke-opacity="0.9" />

    <!-- Windshield & Rear Hatch lines -->
    <path d="M 280 145 L 330 190 L 300 200 L 260 155 Z" fill="#0284c7" fill-opacity="0.15" stroke="#38bdf8" stroke-width="1" stroke-opacity="0.6" />
    <path d="M 770 145 L 720 190 L 750 200 L 790 155 Z" fill="#0284c7" fill-opacity="0.15" stroke="#38bdf8" stroke-width="1" stroke-opacity="0.6" />

    <text x="500" y="95" text-anchor="middle" fill="#7dd3fc" font-family="monospace" font-size="10" font-weight="bold" letter-spacing="1">LAYER A // AERO GREENHOUSE &amp; COMPOSITE ROOF</text>
  </g>

  <!-- LAYER 2: INTERIOR & UPPER CABIN STRUCTURE (Y: 210 - 280) -->
  <g id="layer-interior" transform="translate(0, 10)">
    <!-- Cabin Perimeter -->
    <path d="M 240 240 L 400 195 L 700 195 L 810 240 L 740 300 L 280 300 Z" 
          fill="#1e293b" fill-opacity="0.4" stroke="#64748b" stroke-width="1.5" />
    
    <!-- Steering wheel and Cockpit Dashboard -->
    <path d="M 320 230 L 370 215 L 420 215 L 390 245 Z" fill="#0f172a" stroke="#38bdf8" stroke-width="1.2" />
    <ellipse cx="345" cy="232" rx="14" ry="9" fill="none" stroke="#38bdf8" stroke-width="1.5" stroke-opacity="0.9" />
    
    <!-- Front Seats -->
    <path d="M 390 230 L 430 220 L 450 250 L 410 260 Z" fill="#1e293b" stroke="#06b6d4" stroke-width="1.2" />
    <path d="M 440 218 L 480 208 L 500 238 L 460 248 Z" fill="#1e293b" stroke="#06b6d4" stroke-width="1.2" />
    
    <!-- Rear Bench Seat -->
    <path d="M 560 215 L 680 215 L 670 265 L 540 265 Z" fill="#1e293b" stroke="#06b6d4" stroke-width="1.2" />

    <!-- Center Console & Screen -->
    <rect x="425" y="222" width="22" height="14" rx="2" fill="#0284c7" fill-opacity="0.3" stroke="#38bdf8" stroke-width="1" />
  </g>

  <!-- LAYER 3: STRUCTURAL CHASSIS & BATTERY PACK (Y: 310 - 410) -->
  <g id="layer-chassis" transform="translate(0, 30)">
    <!-- Guide connectors -->
    <line x1="200" y1="330" x2="200" y2="430" stroke="#34d399" stroke-width="0.75" stroke-dasharray="3 3" stroke-opacity="0.4" />
    <line x1="800" y1="330" x2="800" y2="430" stroke="#34d399" stroke-width="0.75" stroke-dasharray="3 3" stroke-opacity="0.4" />

    <!-- Structural Spaceframe Perimeter -->
    <path d="M 180 340 L 370 280 L 730 280 L 860 340 L 760 415 L 230 415 Z" 
          fill="#0a101d" fill-opacity="0.8" stroke="#38bdf8" stroke-width="2" />
    
    <!-- HV Traction Battery Enclosure (Floor Tray) -->
    <path d="M 280 345 L 390 305 L 680 305 L 750 345 L 690 395 L 320 395 Z" 
          fill="url(#batteryGrad)" stroke="#10b981" stroke-width="2" />
    
    <!-- 8 Individual Cell Module Grids -->
    <g stroke="#34d399" stroke-width="0.8" stroke-opacity="0.7" fill="#042f2e">
      <!-- Row 1 -->
      <path d="M 330 338 L 380 320 L 430 320 L 380 338 Z" />
      <path d="M 440 320 L 490 320 L 440 338 L 390 338 Z" />
      <path d="M 500 320 L 550 320 L 500 338 L 450 338 Z" />
      <path d="M 560 320 L 610 320 L 560 338 L 510 338 Z" />
      <!-- Row 2 -->
      <path d="M 370 365 L 420 345 L 470 345 L 420 365 Z" />
      <path d="M 480 345 L 530 345 L 480 365 L 430 365 Z" />
      <path d="M 540 345 L 590 345 L 540 365 L 490 365 Z" />
      <path d="M 600 345 L 650 345 L 600 365 L 550 365 Z" />
    </g>

    <!-- Cooling Channels & High Voltage Busbars -->
    <path d="M 320 350 L 690 350" stroke="#06b6d4" stroke-width="2" stroke-dasharray="5 3" />
    <path d="M 340 370 L 670 370" stroke="#f59e0b" stroke-width="1.5" />
    
    <!-- Battery Management System (BMS) Controller -->
    <rect x="670" y="325" width="28" height="22" rx="3" fill="#f59e0b" fill-opacity="0.3" stroke="#f59e0b" stroke-width="1.5" />
    <text x="684" y="340" text-anchor="middle" fill="#fbbf24" font-family="monospace" font-size="8" font-weight="bold">BMS</text>
  </g>

  <!-- LAYER 4: POWERTRAIN, SUSPENSION & RUNNING GEAR (Y: 380 - 550) -->
  <g id="layer-powertrain" transform="translate(0, 40)">
    <!-- FRONT DRIVE UNIT (Permanent Magnet Synch Motor + Inverter + Differential) -->
    <g id="front-motor">
      <path d="M 230 360 L 290 340 L 310 380 L 250 400 Z" fill="#0284c7" fill-opacity="0.35" stroke="#38bdf8" stroke-width="2" />
      <!-- Inverter Core -->
      <rect x="255" y="350" width="30" height="24" rx="3" fill="#1e293b" stroke="#38bdf8" stroke-width="1.2" />
      <circle cx="270" cy="362" r="6" fill="#38bdf8" fill-opacity="0.8" />
      <!-- Front Axle Shafts -->
      <line x1="200" y1="410" x2="310" y2="350" stroke="#94a3b8" stroke-width="3.5" />
      <!-- Steering Rack -->
      <line x1="190" y1="390" x2="280" y2="340" stroke="#64748b" stroke-width="2" />
    </g>

    <!-- REAR DRIVE UNIT (Dual-Motor Performance Inverter + Gearbox) -->
    <g id="rear-motor">
      <path d="M 710 350 L 780 330 L 810 375 L 740 395 Z" fill="#0284c7" fill-opacity="0.35" stroke="#38bdf8" stroke-width="2" />
      <!-- Rear Inverter -->
      <rect x="735" y="342" width="38" height="28" rx="4" fill="#1e293b" stroke="#38bdf8" stroke-width="1.2" />
      <circle cx="754" cy="356" r="8" fill="#38bdf8" fill-opacity="0.8" />
      <!-- Rear Axle Shafts -->
      <line x1="680" y1="400" x2="810" y2="340" stroke="#94a3b8" stroke-width="4" />
      <!-- Rear Differential -->
      <ellipse cx="754" cy="368" rx="14" ry="10" fill="#0f172a" stroke="#06b6d4" stroke-width="1.5" />
    </g>

    <!-- FOUR EXPLODED CORNER WHEELS & BRAKE ROTORS -->
    <!-- 1. Front Left Wheel (Exploded Bottom-Left ~ X: 110, Y: 460) -->
    <g id="wheel-fl" transform="translate(0, 10)">
      <line x1="155" y1="450" x2="220" y2="400" stroke="#38bdf8" stroke-width="1" stroke-dasharray="3 3" stroke-opacity="0.5" />
      <!-- Tire Outline -->
      <ellipse cx="140" cy="465" rx="36" ry="58" fill="#0f172a" stroke="#475569" stroke-width="3" />
      <!-- Wheel Rim & Spokes -->
      <ellipse cx="140" cy="465" rx="26" ry="42" fill="#1e293b" stroke="#38bdf8" stroke-width="2" />
      <!-- Ventilated Brake Disc -->
      <ellipse cx="140" cy="465" rx="16" ry="26" fill="#334155" stroke="#94a3b8" stroke-width="1.2" />
      <!-- Brembo Red Caliper -->
      <rect x="145" y="445" width="10" height="18" rx="2" fill="#ef4444" stroke="#f87171" stroke-width="1" />
      <circle cx="140" cy="465" r="4" fill="#38bdf8" />
    </g>

    <!-- 2. Front Right Wheel (Exploded Top-Left ~ X: 270, Y: 290) -->
    <g id="wheel-fr">
      <line x1="290" y1="285" x2="330" y2="315" stroke="#38bdf8" stroke-width="1" stroke-dasharray="3 3" stroke-opacity="0.5" />
      <ellipse cx="270" cy="275" rx="24" ry="40" fill="#0f172a" stroke="#475569" stroke-width="2.5" />
      <ellipse cx="270" cy="275" rx="17" ry="28" fill="#1e293b" stroke="#38bdf8" stroke-width="1.5" />
      <ellipse cx="270" cy="275" rx="10" ry="17" fill="#334155" stroke="#94a3b8" stroke-width="1" />
      <rect x="272" y="262" width="7" height="12" rx="1.5" fill="#ef4444" />
    </g>

    <!-- 3. Rear Left Wheel (Exploded Bottom-Right ~ X: 710, Y: 485) -->
    <g id="wheel-rl" transform="translate(0, 10)">
      <line x1="720" y1="475" x2="770" y2="425" stroke="#38bdf8" stroke-width="1" stroke-dasharray="3 3" stroke-opacity="0.5" />
      <ellipse cx="705" cy="490" rx="38" ry="60" fill="#0f172a" stroke="#475569" stroke-width="3" />
      <ellipse cx="705" cy="490" rx="28" ry="44" fill="#1e293b" stroke="#38bdf8" stroke-width="2" />
      <ellipse cx="705" cy="490" rx="18" ry="28" fill="#334155" stroke="#94a3b8" stroke-width="1.2" />
      <rect x="712" y="470" width="10" height="20" rx="2" fill="#ef4444" stroke="#f87171" stroke-width="1" />
      <circle cx="705" cy="490" r="4" fill="#38bdf8" />
    </g>

    <!-- 4. Rear Right Wheel (Exploded Top-Right ~ X: 840, Y: 300) -->
    <g id="wheel-rr">
      <line x1="850" y1="300" x2="810" y2="330" stroke="#38bdf8" stroke-width="1" stroke-dasharray="3 3" stroke-opacity="0.5" />
      <ellipse cx="850" cy="295" rx="26" ry="42" fill="#0f172a" stroke="#475569" stroke-width="2.5" />
      <ellipse cx="850" cy="295" rx="18" ry="30" fill="#1e293b" stroke="#38bdf8" stroke-width="1.5" />
      <ellipse cx="850" cy="295" rx="11" ry="19" fill="#334155" stroke="#94a3b8" stroke-width="1" />
      <rect x="852" y="282" width="8" height="13" rx="1.5" fill="#ef4444" />
    </g>
  </g>

  <!-- DIAGNOSTIC TARGET HUBS & HOTSPOT HIGHLIGHTS -->
  <g id="diagnostic-hotspots">
    <!-- Front Powertrain Hub -->
    <circle cx="270" cy="405" r="7" fill="#38bdf8" fill-opacity="0.2" stroke="#38bdf8" stroke-width="1.5" />
    <circle cx="270" cy="405" r="2.5" fill="#38bdf8" />
    <text x="270" y="425" text-anchor="middle" fill="#38bdf8" font-family="monospace" font-size="8" font-weight="bold">FRONT EDU</text>

    <!-- Traction Battery Array -->
    <circle cx="505" cy="385" r="7" fill="#10b981" fill-opacity="0.2" stroke="#10b981" stroke-width="1.5" />
    <circle cx="505" cy="385" r="2.5" fill="#10b981" />
    <text x="505" y="405" text-anchor="middle" fill="#34d399" font-family="monospace" font-size="8" font-weight="bold">HV BATTERY</text>

    <!-- Rear Powertrain Hub -->
    <circle cx="755" cy="395" r="7" fill="#38bdf8" fill-opacity="0.2" stroke="#38bdf8" stroke-width="1.5" />
    <circle cx="755" cy="395" r="2.5" fill="#38bdf8" />
    <text x="755" y="415" text-anchor="middle" fill="#38bdf8" font-family="monospace" font-size="8" font-weight="bold">REAR EDU</text>

    <!-- Forward Radar/Lidar Sensors -->
    <circle cx="165" cy="380" r="5" fill="#f59e0b" fill-opacity="0.2" stroke="#f59e0b" stroke-width="1.2" />
    <circle cx="165" cy="380" r="2" fill="#fbbf24" />
    <text x="165" y="370" text-anchor="middle" fill="#fbbf24" font-family="monospace" font-size="8" font-weight="bold">RADAR / ADAS</text>

    <!-- Headlamps & Lighting -->
    <circle cx="230" cy="290" r="5" fill="#38bdf8" fill-opacity="0.2" stroke="#38bdf8" stroke-width="1.2" />
    <circle cx="230" cy="290" r="2" fill="#38bdf8" />
    <text x="230" y="280" text-anchor="middle" fill="#7dd3fc" font-family="monospace" font-size="8" font-weight="bold">HEADLAMPS</text>
  </g>

  <!-- Bottom Technical Footer Bar -->
  <g transform="translate(40, 605)">
    <rect x="0" y="0" width="920" height="24" rx="4" fill="#0f172a" fill-opacity="0.8" stroke="#1e293b" stroke-width="1" />
    <text x="15" y="16" fill="#38bdf8" font-family="monospace" font-size="9" font-weight="bold">SYSTEM STATUS: ALL SUBSYSTEMS MONITORED</text>
    <text x="460" y="16" text-anchor="middle" fill="#64748b" font-family="monospace" font-size="9">TARGET COORDINATE MATRIX: NORMALIZED [0.0 - 1.0]</text>
    <text x="905" y="16" text-anchor="end" fill="#10b981" font-family="monospace" font-size="9" font-weight="bold">CANVAS COMPATIBLE</text>
  </g>
</svg>`;

export const DEFAULT_EXPLODED_VEHICLE_IMAGE = `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
