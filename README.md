# Mockpit

Prototyping vehicle infotainment systems with component-based, behavior-driven Human-Machine Interface (HMI) bindings.

![Mockpit Editor](/public/mockpit-editor-v2.png)

<p align="center"><strong>Editor Mode</strong></p>

![Mockpit Presentation](/public/mockpit-tester.png)

<p align="center"><strong>Presentation/Tester Mode</strong></p>

---

## Overview

Mockpit is an interactive prototyping application for designing, layout-testing, and simulating modern vehicle infotainment systems. It provides modular, highly responsive HMI components with realistic behavior, live state management, and real-time canvas positioning.

---

## Key Features

### Driving & Telemetry

<img src="/public/mockpit-overhead-viz.png" alt="Mockpit Overhead Driving Visualization" width="300">

Driving-focused visualization and live vehicle-state simulation.

- **Overhead Driving Visualization:** Vehicle orientation display with integrated Leaflet mapping and real-time driving telemetry.

### Infotainment & Media

<img src="/public/mockpit-media.png" alt="Mockpit Infotainment and Media" width="300">

A collection of music discovery and playback components for an in-vehicle media experience.

- **Music Media Player:** Music playback with album artwork, recent tracks, and streaming platform selection.
- **Discover New Music:** Music discovery with album artwork, carousel or grid layouts, and For You and Trending filters.
- **Playlists:** Playlist browsing with album artwork and carousel or grid layout options.

### Phone & Communications

<img src="/public/mockpit-phone.png" alt="Mockpit Phone and Communications" width="300">

Communication components for common in-vehicle phone interactions.

- **Dial Pad:** Responsive dialer with live number display, press-and-hold clearing, contact matching, and container-relative typography.
- **Contacts & Messages:** Contact directory search, call history, and messaging widget bindings.

### Climate Control Suite

<img src="/public/mockpit-climate.png" alt="Mockpit Climate Control" width="300">

A collection of interactive climate controls for temperature, airflow, and seating.

- **Temperature:** Dual-mode horizontal/vertical temperature slider with mercury color gradients, press-and-hold auto-repeat controls, container-aware scaling, and precise puck bounds.
- **Vent Control:** Interactive airflow direction and fan speed controls.
- **Seat Controls:** Multi-stage driver and passenger seat heating and ventilation.

### Component Integration

Mockpit supports **Component Integration**, allowing otherwise independent components to be visually connected through a parent/child relationship. This provides additional layout options while keeping each component independently selectable, editable, and configurable.

<table>
  <tr>
    <td align="center">
      <img src="/public/comp-adjacent-v2.png" alt="Components Adjacent">
      <br>
      <strong>Adjacent Components</strong>
    </td>
    <td align="center">
      <img src="/public/comp-adjacent-connected.png" alt="Components Adjacent Connected">
      <br>
      <strong>Adjacent Components Connected</strong>
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src="/public/comp-overlay.png" alt="Components Overlaid">
      <br>
      <strong>Overlaid Components</strong>
    </td>
    <td align="center">
      <img src="/public/comp-overlay-connected.png" alt="Components Overlaid Connected">
      <br>
      <strong>Overlaid Components Connected</strong>
    </td>
  </tr>
</table>

Component integration is primarily a **visual and layout relationship**, not a functional component merge.

The intended workflow is to position and size components first, then connect them. The existing placement is preserved as the intended visual relationship rather than automatically repositioning the child.

- **Flexible Layouts:** Components can be positioned over, within, or alongside other components.
- **Parent/Child Relationships:** A component can be connected to one parent, while a parent can have multiple children.
- **Independent Components:** Connected components remain independently selectable, editable, and configurable.
- **Relative Layout:** Moving or resizing a parent maintains the child's relative position and size.
- **Single-Level Relationships:** A child cannot itself have children.

This enables layouts such as a Driver Mode Selector positioned over a Speedometer, a Navigation Search component integrated into the top of a Navigation Map, or a Tire Pressure Monitor positioned below a Tire Pressure Status component.

### Auditor Mode & Automotive HMI Safety Compliance

Mockpit includes an Auditor mode for evaluating vehicle infotainment designs against automotive HMI and accessibility guidelines.

- **Automated Compliance:** Evaluates screens against guidelines including [Federal Register NHTSA Driver Distraction Page](https://www.federalregister.gov/documents/2013/04/26/2013-09883/visual-manual-nhtsa-driver-distraction-guidelines-for-in-vehicle-electronic-devices), [ISO 15005 Ergonomic Design Standard](https://www.iso.org/obp/ui/#iso:std:iso:15005:en), [ISO 9241-410 Physical Input Devices Design Standard](https://cdn.standards.iteh.ai/samples/38899/7d7b04204f004b23b02f9479ea3b1c26/ISO-9241-410-2008.pdf), [SAE J941 Motor Vehicle Drivers' Eye Locations Standard](https://downloads.regulations.gov/NHTSA-2013-0137-0010/attachment_1.pdf), and [Evince WCAG 2.1 Compliance Guide](https://www.w3.org/TR/WCAG21/).
- **Static Analysis:** Measures touch target sizing, character heights/PPD, contrast ratios, information density, and glance-budget heuristics.
- **Runtime Telemetry:** Instruments interaction latency, response times, and state transitions.
- **Manual Review:** Provides checklist criteria, reviewer status controls, and audit notes for each screen.
- **Rule View:** Groups findings by safety standard, category, and compliance status.
- **Component View:** Provides screen- and widget-level inspection against measured thresholds.
- **Canvas Deep Linking:** Selecting "Select on canvas" from a finding switches to Editor mode, activates the relevant screen, and selects the component.
- **Rule Registry:** Searchable reference library containing evaluated HMI guidelines, regulatory citations, design rationale, and display calibration settings.

### Canvas & Customization Workspace

The main workspace provides direct manipulation of HMI components and the vehicle environment.

- **Three App Modes:** Editor for design, Presenter for distraction-free vehicle infotainment simulation, and Auditor for HMI safety inspection.
- **Drag & Drop Canvas:** Position, resize, align, and integrate HMI components.
- **Layers Panel:** Reorder components by z-index and control visibility.
- **Inspector:** Configure component properties, themes, binding values, and integration relationships.
- **Drive Simulator & Telemetry:** Simulate gears, speed, battery, headlights, ADAS, and predefined driving events. Automatically hidden during Auditor mode.
- **Vehicle Dashboard Environment:** Scale and pan the vehicle dashboard background with cancel-and-close Reset behavior.

---

## Tech Stack

- **Frontend:** React 19 + TypeScript
- **Build Tool:** Vite 6
- **Styling:** Tailwind CSS v4
- **State Management:** Zustand
- **Animations:** Motion
- **Icons:** Lucide React
- **Mapping:** Leaflet & React-Leaflet

---

## Getting Started

### Prerequisites

- Node.js v18 or higher
- npm v9 or higher

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/mockpit.git
   cd mockpit