# Mockpit

Prototyping vehicle infotainment systems with component-based, behavior-driven Human-Machine Interface (HMI) bindings.

![React](https://img.shields.io/badge/React-19-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript)
![Vite](https://img.shields.io/badge/Vite-6.2-purple?logo=vite)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?logo=tailwindcss)

<table align="center" style="border: 0;" cellspacing="0">
  <tr>
    <td align="center" style="border: 0;">
      <img src="/public/mockpit-editor.png" alt="Mockpit Editor" width="400">
    </td>
    <td align="center" style="border: 0;">
      <img src="/public/mockpit-presentation.png" alt="Mockpit Presentation" width="400">
    </td>
  </tr>
</table>

---

## Overview

**Mockpit** is an interactive prototyping application for designing, layout-testing, and simulating modern automotive digital cockpits and infotainment systems. It provides modular, highly-responsive HMI widgets with realistic behavior, live state management, and real-time canvas positioning.

---

## Key Features

- 🌡️ **Climate Control Suite**
  - **Temperature Widget**: Dual-mode (horizontal/vertical) temperature slider with mercury color gradients, press-and-hold auto-repeat buttons, container query scaling, and precise puck bounds.
  - **Vent Control**: Interactive air flow direction toggles and fan speed controls.
  - **Seat Controls**: Multi-stage driver and passenger seat heating and ventilation selectors.

- 📞 **Phone & Communications**
  - **Dial Pad**: Responsive dialer with live type-to-display readout, press-and-hold clearing, contact matching, and container-relative key typography.
  - **Contacts & Messages**: Contact directory search, call log history, and messaging widget bindings.

- 🎵 **Infotainment & Media**
  - **Media Player**: Track playback controls, progress scrubbing, volume controls, and album art display.

- 🗺️ **Driving & Telemetry**
  - **Overhead Driving Visualization**: Vehicle orientation display with integrated Leaflet maps and real-time driving telemetry.

- 🛡️ **Auditor Mode & Automotive HMI Safety Compliance (v1.2)**
  - **Automated Compliance Engine**: Evaluates cockpit screens against industry automotive ergonomics and distraction guidelines (NHTSA Driver Distraction Guidelines, ISO 15005, ISO 9241-410, SAE J941, WCAG 2.1).
  - **Multi-Tier Rule Framework**:
    - **Static Analysis**: Touch target physical sizing (mm), character heights/PPD, contrast ratios across themes, information density, and glance-budget heuristics.
    - **Runtime Telemetry**: Interaction latency instrumentation, response times, and state transition smoothness.
    - **Manual Checklist & Notes**: Qualitative review criteria with reviewer status toggles and audit documentation per screen.
  - **Dual Audit Perspectives**:
    - **Rule View**: Filter and audit findings grouped by safety standards, categories (Timing, Information Architecture, Visual, Feedback, Modality), and compliance status (Pass, Fail, Warning, Needs Review).
    - **Component View**: Screen-by-screen and widget-by-widget inspector comparing measured metrics against standard thresholds.
  - **Seamless Canvas Deep Linking**: Click "Select on canvas" on any finding to automatically switch back to Editor mode, switch to the active screen, and select the component.
  - **Rule Registry Browser**: Searchable reference library of all evaluated HMI guidelines with regulatory citations, design rationales, and physical display calibration (display diagonal, aspect ratio, viewing distance).

- 🛠️ **Canvas & Customization Workspace**
  - **Three App Modes**: Seamless switching between **Editor** (full design tool), **Presenter** (distraction-free cockpit simulation), and **Auditor** (in-depth HMI safety inspection).
  - **Drag & Drop Canvas**: Modular widget positioning, resizing, and alignment.
  - **Layers Panel**: Z-index reordering and visibility toggles for all HMI widgets.
  - **Inspector**: Fine-tune component props, color themes, and binding values.
  - **Drive Simulator & Telemetry Panel**: Live vehicle state simulation (gears, speed, battery, headlights, ADAS, and event presets). Automatically hidden during Auditor mode.
  - **Vehicle Dashboard Environment**: Direct-manipulation background scaling and panning with true cancel-and-close Reset support.

---

## Tech Stack

- **Frontend Framework**: React 19 + TypeScript
- **Build Tool**: Vite 6
- **Styling**: Tailwind CSS v4
- **State Management**: Zustand
- **Animations**: Motion
- **Icons**: Lucide React
- **Mapping**: Leaflet & React-Leaflet

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18 or higher
- **npm**: v9 or higher

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/mockpit.git
   cd mockpit
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the local development server:
   ```bash
   npm run dev
   ```

4. Open your browser at `http://localhost:3000` to interact with Mockpit.

---

## Available Scripts

- `npm run dev` – Launch the Vite development server on port 3000.
- `npm run build` – Compile the production bundle into the `dist` directory.
- `npm run lint` – Run TypeScript type checks (`tsc --noEmit`).
- `npm run preview` – Locally preview the built production bundle.

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

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
