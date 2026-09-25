# Mockpit

Prototyping vehicle infotainment systems with component-based, behavior-driven Human-Machine Interface (HMI) bindings.

![Mockpit Editor](/public/mockpit-editor.png)

<p align="center"><strong>Editor Mode</strong></p>

![Mockpit Presentation](/public/mockpit-presentation.png)

<p align="center"><strong>Presentation/Tester Mode</strong></p>

---

## Overview

Mockpit is an interactive prototyping application for designing, layout-testing, and simulating modern automotive digital cockpits and infotainment systems. It provides modular, highly responsive HMI widgets with realistic behavior, live state management, and real-time canvas positioning.

---

## Key Features

### Climate Control Suite

![Mockpit Climate Control](/public/mockpit-climate.png)

- **Temperature Widget:** Dual-mode (horizontal/vertical) temperature slider with mercury color gradients, press-and-hold auto-repeat buttons, container query scaling, and precise puck bounds.
- **Vent Control:** Interactive air flow direction toggles and fan speed controls.
- **Seat Controls:** Multi-stage driver and passenger seat heating and ventilation selectors.

### Phone & Communications

![Mockpit Phone and Communications](/public/mockpit-phone.png)

- **Dial Pad:** Responsive dialer with live type-to-display readout, press-and-hold clearing, contact matching, and container-relative key typography.
- **Contacts & Messages:** Contact directory search, call log history, and messaging widget bindings.

### Infotainment & Media

![Mockpit Infotainment and Media](/public/mockpit-media.png)

- **Media Player:** Track playback controls, progress scrubbing, volume controls, and album art display.

### Driving & Telemetry

![Mockpit Overhead Driving Visualization](/public/mockpit-overhead-viz.png)

- **Overhead Driving Visualization:** Vehicle orientation display with integrated Leaflet maps and real-time driving telemetry.

### Component Integration

Mockpit supports **Component Integration**, allowing any two otherwise independent components to be visually connected through a parent/child relationship. This gives designers more options for composing integrated UI layouts while keeping each component independently selectable, editable, and configurable.

Component integration is primarily a **visual and layout relationship**, not a functional component merge.

- **Flexible Layout Composition:** Any component can be connected to another component to create custom visual arrangements.
- **Parent/Child Relationships:** A component can act as a parent or become a child of another component.
- **Independent Components:** Connected components remain independently selectable, editable, and configurable.
- **Relative Layout Preservation:** The child's existing position and size are preserved when the relationship is created.
- **Parent-Driven Layout:** Moving or resizing the parent maintains the child's relative layout.
- **Integrated Visual Design:** Related components can appear as a single composed UI element rather than separate boxes.
- **Custom UI Layouts:** Supports components positioned over, within, or directly alongside another component.
- **Single-Level Relationships:** Each component can have only one parent. A parent can have multiple children, while a child cannot itself have children.

The intended workflow is to position and size components first, then connect them. The existing placement is treated as the intended visual relationship rather than automatically repositioning the child when the connection is created.

### Auditor Mode & Automotive HMI Safety Compliance

- **Automated Compliance Engine:** Evaluates cockpit screens against industry automotive ergonomics and distraction guidelines (NHTSA Driver Distraction Guidelines, ISO 15005, ISO 9241-410, SAE J941, WCAG 2.1).
- **Multi-Tier Rule Framework:**
  - **Static Analysis:** Touch target physical sizing (mm), character heights/PPD, contrast ratios across themes, information density, and glance-budget heuristics.
  - **Runtime Telemetry:** Interaction latency instrumentation, response times, and state transition smoothness.
  - **Manual Checklist & Notes:** Qualitative review criteria with reviewer status toggles and audit documentation per screen.
- **Dual Audit Perspectives:**
  - **Rule View:** Filter and audit findings grouped by safety standards, categories (Timing, Information Architecture, Visual, Feedback, Modality), and compliance status (Pass, Fail, Warning, Needs Review).
  - **Component View:** Screen-by-screen and widget-by-widget inspector comparing measured metrics against standard thresholds.
- **Seamless Canvas Deep Linking:** Click "Select on canvas" on any finding to automatically switch back to Editor mode, switch to the active screen, and select the component.
- **Rule Registry Browser:** Searchable reference library of all evaluated HMI guidelines with regulatory citations, design rationales, and physical display calibration (display diagonal, aspect ratio, viewing distance).

### Canvas & Customization Workspace

- **Three App Modes:** Seamless switching between Editor (full design tool), Presenter (distraction-free cockpit simulation), and Auditor (in-depth HMI safety inspection).
- **Drag & Drop Canvas:** Modular widget positioning, resizing, alignment, and component integration.
- **Layers Panel:** Z-index reordering and visibility toggles for all HMI widgets.
- **Inspector:** Fine-tune component props, color themes, binding values, and integration relationships.
- **Drive Simulator & Telemetry Panel:** Live vehicle state simulation (gears, speed, battery, headlights, ADAS, and event presets). Automatically hidden during Auditor mode.
- **Vehicle Dashboard Environment:** Direct-manipulation background scaling and panning with true cancel-and-close Reset support.

---

## Tech Stack

- **Frontend Framework:** React 19 + TypeScript
- **Build Tool:** Vite 6
- **Styling:** Tailwind CSS v4
- **State Management:** Zustand
- **Animations:** Motion
- **Icons:** Lucide React
- **Mapping:** Leaflet & React-Leaflet

---

## Getting Started

### Prerequisites

- Node.js: v18 or higher
- npm: v9 or higher

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/mockpit.git
   cd mockpit
````

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the local development server:

   ```bash
   npm run dev
   ```

4. Open your browser at [http://localhost:3000](http://localhost:3000) to interact with Mockpit.

---

## Available Scripts

* `npm run dev` - Launch the Vite development server on port 3000.
* `npm run build` - Compile the production bundle into the `dist` directory.
* `npm run lint` - Run TypeScript type checks (`tsc --noEmit`).
* `npm run preview` - Locally preview the built production bundle.

---

## Project Structure

```text
src/
├── components/           # Core HMI widgets & canvas UI
│   ├── climate/          # Temperature, vent, and seat controls
│   ├── phone/            # Dial pad, contacts, and messaging widgets
│   ├── hmi/              # Auditor Mode: AuditPanel & RuleRegistryBrowser
│   ├── Canvas.tsx        # Interactive widget layout canvas
│   ├── Inspector.tsx     # Property inspector panel
│   ├── LayersPanel.tsx   # Z-index and visibility controller
│   └── ...
├── lib/                  # Business logic & compliance engines
│   ├── hmiRules/         # HMI rule registry, evaluation engine & telemetry
│   └── ...
├── hooks/                # Custom React hooks (e.g., useHoldRepeat)
├── store/                # Zustand global store for canvas, vehicle & audit state
├── types.ts              # Global TypeScript declarations
├── utils/                # Helper utilities and color generators
└── main.tsx              # Application entry point
```

---

## External Services & Map Tile Policy

Mockpit relies on zero-setup public APIs for realistic simulation data:

* **OpenStreetMap (OSM):** Standard raster base map tiles (`tile.openstreetmap.org`) for Navigation and Weather Radar (`© OpenStreetMap contributors`).
* **Open-Meteo & RainViewer:** Live global weather forecasts, weather alerts, and real-time precipitation radar tile overlays.
* **MusicBrainz & Cover Art Archive:** Live music metadata, release lookup, and album art discovery.
* **Overpass API:** Live geographic Points of Interest (POI) search around active navigation coordinates.

> **Note for maintainers on OpenStreetMap tile usage:**
>
> 1. **Referer Header Requirement:** OpenStreetMap's Tile Usage Policy requires a valid HTTP `Referer` header to identify the calling origin. The basemap `<img>` elements must **never** set `referrerPolicy="no-referrer"`; stripping the Referer header causes OSM's Varnish cache to silently return an "ACCESS BLOCKED" placeholder tile rather than legitimate map geography.
> 2. **Tile Usage Capacity:** OSM's volunteer-run standard tile service is intended for low-to-medium development and evaluation traffic under reasonable individual use, not a guaranteed production SLA for high-volume redistributed applications. If Mockpit is ever deployed at significant production scale, consider pointing the base tile URLs to a dedicated tile cache, a commercial tile provider, or a self-hosted tile server.

---

## License

This project is open-source and available under the MIT License.
