# Automotive HMI Compliance Rules Registry (v1.0)

This document is the canonical, versioned reference for all Research-Backed Automotive Human-Machine Interface (HMI) design and safety rules governing Mockpit infotainment systems.

---

## 1. Rule Structure & Automation Tiers

To prevent false confidence on human-factors metrics while providing automated static analysis where possible, rules are divided into three distinct **automation tiers**:

| Tier | Meaning | Verification Mode |
|---|---|---|
| `static` | Computable directly from the component hierarchy, bounds, styles, and information architecture without executing runtime interactions. | Automated Pass / Fail / Warning; offending instances selectable on canvas. |
| `runtime` | Computable by instrumenting user actions, input latencies, and transition durations during live Preview/Presentation sessions. | Measured Pass / Fail per session event log; "Not yet measured" until simulated/tested. |
| `manual` | Human-factors metrics requiring domain review, eye-tracking context, or cognitive workload assessment. | Checklist with persistent reviewer notes and "Needs Review / Reviewed" states (never false pass/fail). |

---

## 2. Master Rule Registry (18 Rules)

### 2.1 Existing Hard UI Rules (Formalized)

#### `interaction.tap-target-min` (Tier: `static`)
- **Title**: Minimum Tap Target & Control Spacing
- **Rule**: Minimum 44×44px interactive tap target dimensions with an 8–12px minimum gap between adjacent controls.
- **Rationale**: Prevents driver mis-taps, accidental activations, and physical fatigue during in-vehicle touch interactions under vehicle vibration.

#### `feedback.no-pulse` (Tier: `static`)
- **Title**: No Pulsing / Blinking Status Indicators
- **Rule**: No `animate-pulse` or persistent visual blinking on any driver status indicator or telltale.
- **Rationale**: Blinking visual elements attract involuntary saccadic eye movements away from the roadway and cause cognitive fatigue.

#### `overlay.no-fullscreen-driver-confirm` (Tier: `static`)
- **Title**: No Full-Screen Driver Modals
- **Rule**: Driver-facing confirmations and alerts must be rendered inline in-card, never as full-screen modal takeovers.
- **Rationale**: Full-screen modal takeovers occlude critical context (speed, navigation path, safety telltales) during driving maneuvers.

#### `content.no-hedging-glanceable` (Tier: `manual`)
- **Title**: No Hedging / Disclaimer Badges on Glanceable Cards
- **Rule**: Glanceable driver cards must present direct, concise facts without legal disclaimers, hedging language, or cluttering badges.
- **Rationale**: Drivers require immediate situational awareness; legalese and disclaimer badges increase glance parsing time.

#### `palette.accuracy` (Tier: `manual`)
- **Title**: Palette Accuracy & Contrast Fidelity
- **Rule**: Palette entries and theme tokens must accurately describe rendered behavior and preserve high-contrast legibility across ambient lighting conditions.
- **Rationale**: Low contrast and ambiguous color mappings impair visibility under direct sunlight or nighttime driving conditions.

---

### 2.2 Timing Rules (Research-Backed)

#### `timing.response-time` (Tier: `runtime`)
- **Title**: Interface Action Response Time (100–2500ms)
- **Rule**: Interface actions must provide immediate visual feedback (<100ms) and complete operations within 100–2500ms.
- **Rationale**: Delays beyond 2.5s lead to repeat taps and driver frustration, while instantaneous transitions without state continuity disorient the driver.

#### `timing.glance-duration` (Tier: `manual`, Heuristic Offered)
- **Title**: Single Glance Duration (≤2.0s)
- **Rule**: Any individual off-road glance to the infotainment display must not exceed 2.0 seconds (NHTSA guidelines).
- **Heuristic**: Estimated ~1 glance per discrete UI chunk + ~5 words. Visual complexity beyond 3–4 chunks requires manual layout simplification.

#### `timing.task-glance-total` (Tier: `manual`, Heuristic Offered)
- **Title**: Cumulative Task Off-Road Glance (≤12.0s)
- **Rule**: Total cumulative off-road glance time across all sub-steps of a driving task must not exceed 12.0 seconds (SAE J2364 standard).
- **Rationale**: Tasks requiring >12s cumulative glance dramatically increase collision risk.

#### `timing.transition-duration` (Tier: `static` + `runtime`)
- **Title**: Screen Transition Timing (~150ms / <400ms)
- **Rule**: Split-screen transitions should target ~150ms; primary app screens must transition in <400ms and secondary apps in <430ms.
- **Rationale**: Preserves perceptual continuity without delaying task execution.

#### `feedback.input-latency` (Tier: `runtime`)
- **Title**: Visual Input Feedback Latency (<100ms)
- **Rule**: Immediate tactile or visual state feedback (pressed state, highlight) must occur within 100ms of user input.
- **Rationale**: Acknowledges driver intent immediately so the driver can return eyes to the road without second-guessing touch registration.

---

### 2.3 Information Architecture Rules

#### `ia.menu-depth` (Tier: `static`)
- **Title**: Broad-and-Shallow Navigation Hierarchy (≤2 Levels)
- **Rule**: Navigation hierarchy must not exceed 2 levels (≤2 taps/transitions from Home).
- **Rationale**: Deeply nested menus force drivers through complex mental models and multi-tap sequences while driving.

#### `ia.single-layer-priority` (Tier: `static`)
- **Title**: Single-Layer Priority for Critical Tasks
- **Rule**: Critical driving tasks must be reachable directly (1 tap) from the main interface:
  - **HVAC / Climate**: Cabin temperature, fan speed adjustment, defrost/defog toggle
  - **Navigation**: Current maneuver banner, mute/unmute guidance, cancel route
  - **Media / Audio**: Play/pause, track skip, volume mute/level
  - **Telephony / Comms**: Accept/end incoming call
  - **Vehicle Safety / Controls**: Hazard warning, drive mode selector, camera feed
- **Rationale**: Primary vehicle controls must never be buried behind secondary screens.

#### `ia.task-segmentation` (Tier: `static` heuristic + `manual`)
- **Title**: Task Segmentation & State Preservation
- **Rule**: Multi-step workflows (such as navigation trip planning or messaging drafts) must be chunkable and preserve partial state across interruptions.
- **Rationale**: Driving requires frequent task interruptions; unpreserved drafts force frustrating restarts.

---

### 2.4 Visual Design Rules

#### `visual.color-not-monochrome` (Tier: `static`)
- **Title**: Chromatic Visual Encoding (Not Pure Monochrome)
- **Rule**: Interfaces must employ chromatic color coding (green for battery/success, amber for warnings, cyan/sky for telemetry) for rapid perceptual pop-out.
- **Rationale**: Pure monochrome displays require reading text rather than instant peripheral color recognition.

#### `visual.icon-standardization` (Tier: `static`)
- **Title**: Standardized ISO 2575 / SAE J2364 Symbols
- **Rule**: Status telltales and control icons must use approved ISO 2575 / SAE J2364 symbol mappings rather than abstract custom glyphs.
- **Rationale**: Standard symbols are universally recognized without cognitive decoding.

#### `visual.typography-legibility` (Tier: `static`)
- **Title**: Typography Visual Angle (12–20 arcmin)
- **Rule**: Typography must provide ≥12–14 arcmin visual angle for standard body text and ≥16–20 arcmin for critical alerts at driver viewing distance.
- **Formula**: `arcmin ≈ 3438 × (glyphHeightMM / viewingDistanceMM)` with default 12.3" display and 700mm driver viewing distance.
- **Rationale**: Ensures rapid legibility under optical vibration and varied driver visual acuity.

---

### 2.5 Modality Rules

#### `modality.cascaded-input` (Tier: `manual`)
- **Title**: Cascaded Multimodal Input Support
- **Rule**: Complex tasks should support sequential multimodal inputs (e.g. voice search + touch confirmation, touch + audio chime) to lower driver workload.
- **Rationale**: Blending voice and touch leverages the strengths of each modality to minimize glance duration.

#### `modality.moving-lockouts` (Tier: `static`)
- **Title**: Driver Distraction Lockouts While Moving
- **Rule**: High-demand tasks (manual multi-character typing, extensive text scrolling, video playback) must be restricted/locked out when vehicle speed > 0.
- **Rationale**: Prevents prolonged visual-manual distraction during vehicle movement.

---

## 3. Physical Geometry & Display Baseline

- **Default Diagonal**: 12.3" (16:9, ~272.3mm width × 153.2mm height)
- **Nominal Viewing Distance**: 700mm (~24° horizontal viewing angle)
- **Logical Canvas Resolution**: 1920×1080 px
- **Cap-Height Ratio**: ~0.7
