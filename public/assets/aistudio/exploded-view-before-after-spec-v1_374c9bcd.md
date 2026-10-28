# Spec v1 — Exploded View Chassis: Before / Exploded Image States

**Scope:** `vehicleExplodedView` component only. One concern: a normal "before" vehicle image that crossfades to the exploded image when a connected status callout is selected, and back when it is deselected.

Where file locations are given, they are where Claude found the code on review. Confirm them by search before editing; do not assume line numbers.

---

## 0. Agreed behavior (confirmed by Chris)

1. Users upload their own images. Resetting the project to a new canvas resets both images to defaults.
2. The before state only activates if a before image exists: a custom before upload, **or** no custom exploded image at all (default pair applies). A custom exploded image with no before image behaves exactly as today (no before state, no preview toggle).
3. Tapping the active callout a second time deselects it and returns to the before view. A short visual transition runs between the images.
4. **Editor** always shows the exploded image (targets are placed on it). An Inspector toggle previews Before / Exploded.
5. The before image has its own background-removal settings: `beforeRemoveBg`, `beforeBgTolerance`, `beforeBgEdgeSoftness`.
6. The before image is fit inside the exploded image's content rect, so connector math is unchanged.
7. The existing global color keyer is kept as-is. No flood-fill option.
8. Motion on this component (crossfade + line draw) is explicitly signed off by Chris. The no-`animate-pulse` / no-blink rule still applies.

---

## 1. Root Cause / Current State

| # | Finding | Location (search for it) |
|---|---|---|
| 1 | The widget renders a single `<img>` from `resolved.imageUrl \|\| staticProps.imageUrl \|\| DEFAULT_EXPLODED_VEHICLE_IMAGE`. There is no before state. | `src/components/vehicle/VehicleExplodedViewWidget.tsx` |
| 2 | `ConnectorLayer.tsx` resolves the exploded image source separately in **three places** (`staticProps?.imageUrl \|\| DEFAULT_EXPLODED_VEHICLE_IMAGE`: `getTargetCanvasCoords` and two hit-test paths). Any change to the default or source logic must happen in all three. | `src/components/vehicle/ConnectorLayer.tsx` |
| 3 | Connector `targetX/targetY` are 0–1 values relative to the **exploded image's content rect**, computed by `getImageContentRect` from the exploded image's natural dimensions. | `ConnectorLayer.tsx`, `src/utils/imageContentRect.ts` |
| 4 | `getCachedNaturalDimensions` special-cases the default blueprint with a fragile heuristic: `imageSrc.includes('1000') && imageSrc.includes('650')` returns 1000×650. A base64 data URL can contain those digits. The default is moving to a URL path, so this heuristic must go. | `imageContentRect.ts` |
| 5 | Natural dimensions are only cached when the widget's `<img>` fires `onLoad`. A URL-path default has no known dimensions on first paint. | `VehicleExplodedViewWidget.tsx`, `imageContentRect.ts` |
| 6 | `displayUrl` is initialised to the raw URL, then replaced when background removal finishes. A white-background image **flashes un-keyed** (white rectangle over the user's background color) on first load. This will be very visible on the before image. | `VehicleExplodedViewWidget.tsx` |
| 7 | Callout selection state already exists: `activePresentationCalloutId` + `presentationConnectorAnimNonce` in the store. `ConnectorLayer` already draws lines only for the active callout in Presenter, using `drawConnectorLine` (420ms) with a 220ms reticle delay. The exploded state can be **derived** from this. No new selection state needed. | `useMockpitStore.ts`, `ConnectorLayer.tsx` |
| 8 | Tapping a callout (or the exploded view itself, which resolves to its source callout via `resolveActiveCalloutIdForComponent`) always **sets** the active callout; re-tapping only replays the animation. There is no deselect-on-retap. Two call sites: `Canvas.tsx` (component wrapper onClick) and `VehicleStatusCalloutWidget.tsx` (presentation onClick). | `Canvas.tsx`, `VehicleStatusCalloutWidget.tsx` |
| 9 | The Inspector has a hardcoded `key !== '…'` exclusion list for the generic staticProps renderer. New keys not added there render as raw text fields. | `src/components/Inspector.tsx` (search `key !== 'imageUrl'`) |
| 10 | The bg-removal cache key is `imageUrl.length + first 80 chars + settings`. Data-URL PNGs share their first 80 chars, so a same-length collision returns the wrong image. Adding a second image makes this more likely. | `src/utils/imageBackgroundRemover.ts` |

**Asset facts (verified on the pushed files):**
- `public/vehicles/exploded-before.png` — 1024×1024, near-white background (corner ≈ 253–255). Silver/gray car.
- `public/vehicles/exploded-after.png` — 1408×768, near-white background.
- Runtime URLs are `/vehicles/exploded-before.png` and `/vehicles/exploded-after.png` (Vite serves `public/` at root; the existing code uses absolute `/vehicles/...` paths, so follow that convention).
- The existing keyer at the default 25% tolerance removes the background well on both files. Interior highlight pixels keyed: ~0.6% (before), ~2.7% (after) of keyed pixels. This is acceptable and tunable via the sliders.

---

## 2. Fix

### Part A — Single source of truth for image sources

Create `src/utils/explodedViewImages.ts`:

```ts
export const DEFAULT_EXPLODED_IMAGE_URL = '/vehicles/exploded-after.png';
export const DEFAULT_BEFORE_IMAGE_URL   = '/vehicles/exploded-before.png';
export const DEFAULT_EXPLODED_NATURAL   = { w: 1408, h: 768 };
export const EXPLODE_TRANSITION_MS      = 350;

// Exploded source. `resolvedImageUrl` is the binding-resolved override used by the widget (optional).
export function getExplodedImageSrc(comp, resolvedImageUrl?: string): string;
//   resolvedImageUrl || comp.staticProps?.imageUrl || DEFAULT_EXPLODED_IMAGE_URL

// Before source, or null when there is no before state (see rule 2 in section 0).
export function getBeforeImageSrc(comp): string | null;
//   if staticProps.beforeImageUrl  -> that
//   else if !staticProps.imageUrl  -> DEFAULT_BEFORE_IMAGE_URL
//   else                           -> null

export function isExplodedViewActive(
  explodedId: string,
  activeCalloutId: string | null,
  screenComponents: ComponentInstance[],
): boolean;
//   callout = screenComponents.find(c => c.id === activeCalloutId)
//   return callout?.type === 'vehicleStatusCallout' && callout.connector?.targetComponentId === explodedId
```

Replace all three `staticProps?.imageUrl || DEFAULT_EXPLODED_VEHICLE_IMAGE` sites in `ConnectorLayer.tsx` and the `rawImageUrl` line in the widget with `getExplodedImageSrc(...)`.

**Default asset (see DECISION D1):** point the default at `exploded-after.png`. Delete the blueprint SVG default and its export from `src/data/defaultExplodedVehicle.ts` (or leave the file with the old export renamed and unused; agent's choice, but no remaining imports of the old name). Remove the `'1000' && '650'` heuristic in `imageContentRect.ts`.

### Part B — Natural dimensions for the default

In `imageContentRect.ts`, pre-seed the natural-dimensions cache for `DEFAULT_EXPLODED_IMAGE_URL` with `DEFAULT_EXPLODED_NATURAL` at module load, so connector math is correct on first paint before any `onLoad` fires. Custom uploads keep the existing `onLoad` caching.

### Part C — Store defaults and props

In the `case 'vehicleExplodedView':` defaults block of `useMockpitStore.ts`, add:

```
beforeImageUrl: '',
beforeRemoveBg: 'true',
beforeBgTolerance: '25',
beforeBgEdgeSoftness: '0',
editorPreview: 'exploded',     // 'before' | 'exploded'; read only in Editor
```

Do **not** rename the existing exploded keys (`imageUrl`, `removeBg`, `bgTolerance`, `bgEdgeSoftness`). Existing saved instances will lack the new keys, so every read must use a fallback (`!== 'false'` for booleans, `|| '25'` / `|| '0'` for numbers, `!== 'before'` for preview).

### Part D — Widget rendering (`VehicleExplodedViewWidget.tsx`)

**Layout.** Replace the single padded flex-centered `<img>` with one absolutely positioned **frame** whose box equals the exploded image's content rect, computed with the same function the connectors use:

```ts
const natural = getCachedNaturalDimensions(explodedSrc) ?? DEFAULT_EXPLODED_NATURAL;
const frame = getImageContentRect(
  { x: 0, y: 0, width: component.width, height: component.height },
  natural,
  /* same padding value ConnectorLayer passes (currently 4) */
);
```

Both layers are `position:absolute; inset:0` inside that frame (`left/top/width/height` from `frame`), each with `object-fit: contain`. The exploded layer therefore fills the frame exactly, and the before layer (any aspect ratio) is centered inside it. This is what keeps connector targets valid and stops the car from jumping.

**Keying per image.** Extract a small hook, e.g. `useKeyedImage(src, removeBg, tolerance, softness)`, returning the display URL, and call it twice: exploded with `removeBg/bgTolerance/bgEdgeSoftness`, before with `beforeRemoveBg/beforeBgTolerance/beforeBgEdgeSoftness`. Requirements:
- When removal is on, the hook returns **no URL until keying completes**. Do not initialise to the raw URL. The layer stays at opacity 0 until its keyed URL is ready, so no white flash.
- When removal is off, return the raw URL immediately.
- Natural dimensions are cached from the **exploded** image only.
- Fix the cache key in `imageBackgroundRemover.ts`: use a cheap hash of the full string (or the full URL for path URLs) plus the settings, not `length + first 80 chars`. Do not change the keying algorithm itself.

**State derivation.**

```ts
const hasBefore = getBeforeImageSrc(component) !== null;
const calloutActive = useMockpitStore(s =>
  isExplodedViewActive(component.id, s.activePresentationCalloutId,
    s.componentsByScreen[s.activeView] ?? s.components));
const showExploded = !hasBefore
  || (isPresentation ? calloutActive : component.staticProps.editorPreview !== 'before');
```

`isPresentation` is the existing prop (true in Presenter and Participant Mode, false in Editor). The agent must check how **Auditor** mode renders this widget and report which branch it takes; Auditor should behave like Presenter.

**Transition.** Both layers stay mounted. Exploded layer: `opacity: showExploded ? 1 : 0`. Before layer: `opacity: showExploded ? 0 : 1`. Both: `transition: opacity ${EXPLODE_TRANSITION_MS}ms ease-in-out`, `pointer-events: none`, with Tailwind `motion-reduce:transition-none`. Opacity only: no scale, no movement. The inactive layer gets `aria-hidden`; the active one carries the `alt`.

**Background.** Do not touch the container background logic. The shared `backgroundColor` prop continues to sit behind both keyed PNGs, which is what lets the user recolor the white-background before image.

### Part E — Second tap deselects (store + two call sites)

Add a store action `toggleCalloutSelection(componentId, screenComponents)`:

```ts
set(state => {
  const calloutId = resolveActiveCalloutIdForComponent(componentId, screenComponents);
  if (calloutId && state.activePresentationCalloutId === calloutId) {
    // deselect
    return { selectedComponentId: null, activePresentationCalloutId: null,
             presentationConnectorAnimNonce: 0, connectorLeadDelayMs: 0 };
  }
  return { selectedComponentId: componentId, activePresentationCalloutId: calloutId,
           presentationConnectorAnimNonce: calloutId ? state.presentationConnectorAnimNonce + 1 : 0,
           connectorLeadDelayMs: calloutId && !state.activePresentationCalloutId ? EXPLODE_TRANSITION_MS : 0 };
})
```

Mirror whatever else the existing `selectComponent` / `setActivePresentationCalloutId` pair resets today (e.g. ghost-notification flags); this action replaces that pair at both call sites, so it must clear the same fields. The new field `connectorLeadDelayMs` is store state (default `0`).

Replace the select calls in `Canvas.tsx` (component wrapper onClick) and `VehicleStatusCalloutWidget.tsx` (presentation onClick) with this action. Behavior to preserve: tapping empty canvas still clears everything; tapping a non-callout component still selects it and clears the active callout. The toggle applies to the exploded view itself too, because it resolves to its source callout.

Switching callout A → B stays exploded (no crossfade, lead delay 0). Update any existing test that asserts re-tap bumps `presentationConnectorAnimNonce`.

### Part F — Line animation waits for the crossfade

In `ConnectorLayer.tsx` (presentation draw path), read `connectorLeadDelayMs` from the store. For each drawn callout, apply it as an additional `animation-delay` **only if the target exploded view has a before state** (`getBeforeImageSrc(targetComp) !== null`; otherwise 0):

- connector line (`drawConnectorLine`, 420ms): delay = lead
- source dot (`fadeInSourceDot`): delay = lead
- target reticle (`popTargetReticle`, existing 220ms delay): delay = lead + 220ms
- keep `animation-fill-mode: both` so nothing is visible during the delay.

Deselect needs no exit animation: the lines unmount immediately (as today) and the image crossfades back over 350ms.

**Known limitation (accepted):** with two exploded views on one screen, switching directly from a callout of view 1 to a callout of view 2 will not apply the lead delay to view 2. Not worth the complexity.

### Part G — Inspector (`Inspector.tsx`)

In the `vehicleExplodedView` controls block, **text labels only, no new icons** (reuse the existing Upload / reset icons). Order:

1. **Preview State**: segmented `Before | Exploded`, writes `staticProps.editorPreview`. Shown only when `hasBefore`. Helper text: "Editor only. Presenter shows Before until a callout is selected."
2. **Background Color**: existing, unchanged, shared.
3. **Exploded Image**: existing upload + reset; relabel to "Exploded Image". Reset title/tooltip must say "Reset to default" (it no longer resets to a blueprint SVG). Existing background-removal controls stay with it.
4. **Before Image**: upload + reset (`beforeImageUrl`), plus its own Remove Background toggle, Tolerance, and Edge Softness bound to `beforeRemoveBg`, `beforeBgTolerance`, `beforeBgEdgeSoftness`, same ranges and step values as the exploded controls. Extract the three controls into one shared sub-component taking a key prefix, rather than copy-pasting ~80 lines.

Add `beforeImageUrl`, `beforeRemoveBg`, `beforeBgTolerance`, `beforeBgEdgeSoftness`, and `editorPreview` to the generic-renderer exclusion list (finding 9).

Resetting the project to a new canvas recreates the component, so all new keys fall back to defaults with no extra work. Confirm this by test, don't assume it.

---

## 3. Do Not Touch

- Connector geometry: anchor/target math, normalized `targetX/targetY` values (no migration), `getImageContentRect` signature.
- `processImageBackgroundRemoval` algorithm (only the cache key, per Part D).
- Existing prop names: `imageUrl`, `removeBg`, `bgTolerance`, `bgEdgeSoftness`, `backgroundColor`.
- Editor behavior: connector lines stay always visible in Editor.
- `drawConnectorLine` / `popTargetReticle` / `fadeInSourceDot` keyframes (only delays change).
- Callout widget visuals, Bottom Dock, HeaderNav, default component size (640×420).
- No `animate-pulse`, blinking, or hover states anywhere in this change.

---

## 4. Open Decisions

- **DECISION NEEDED D1 — Default exploded image.** This spec assumes the default pair is the two new PNGs, with `exploded-after.png` **replacing** the blueprint SVG as the default exploded image. That is how we read "no custom exploded image → default pair applies" plus the reset-to-default behavior. If you want the blueprint kept as the default and the PNGs only as demo assets, say so before this goes to the agent.
- **DECISION NEEDED D2 — Before car size (visual, optional).** The before image is square (1024²) and gets fit inside the wide (1408×768) exploded frame, so the before car will render at roughly half the frame width, noticeably smaller than the exploded layout. Accepting this is consistent with decision 6. If it looks too small, the fix is to re-export `exploded-before.png` on a 1408×768 canvas with the car larger, not a code change.
- **Assumption A1 — Editor preview persistence.** `editorPreview` is stored in `staticProps` (simple, but saved with the project and ignored outside Editor). The alternative is transient store state that never saves. Say so if you'd rather have that.
- **Assumption A2 — Tapping the exploded view itself.** It toggles the same way as tapping a callout (first tap shows its source callout's lines and the exploded image, second tap returns to before).

---

## 5. DOM Verification Checklist

Paste literal output. No prose summaries.

1. `npm run lint` (`tsc --noEmit`) output.
2. `npm test` output (full run). List any test changed for the re-tap behavior change and why.
3. **Frame parity.** In the browser console, for three different component sizes, print `getBoundingClientRect()` for the exploded layer and the before layer. They must match within 0.5px.
4. **Opacity per state.** Print `getComputedStyle(layer).opacity` and `transitionDuration` for both layers in: Presenter on load, after tapping a callout, after tapping it again. Expected: before 1 / exploded 0, then 0 / 1, then 1 / 0, with `0.35s` durations.
5. **Line delay.** Print computed `animation-delay` on the connector line, source dot, and reticle: first select from the before state (expect 350ms / 350ms / 570ms), then switching callout A → B (expect 0ms / 0ms / 220ms).
6. **Deselect.** After the second tap, print the count of connector group elements (expect 0) and `activePresentationCalloutId` (expect `null`).
7. **Keying, no flash.** For both images, draw the displayed image to a canvas and print alpha at the four corners (expect 0). Print the before layer's opacity at the first render (expect 0 until the keyed URL is ready).
8. **Legacy instance.** Create an instance with `staticProps.imageUrl` set to a custom upload and no `beforeImageUrl`: print `getBeforeImageSrc(component)` (expect `null`), confirm the exploded layer is always shown, and confirm the Preview State toggle is not rendered.
9. **Reset.** Reset the project to a new canvas and print the exploded view's `staticProps` (expect defaults, `imageUrl: ''`, `beforeImageUrl: ''`).
10. **Persistence.** Upload one custom PNG as the before image and one as the exploded image, reload, and report whether both survive and whether any storage-quota error appears in the console.
11. **Auditor mode.** Report which branch (`isPresentation` true/false) the widget takes in Auditor mode.

**One screenshot from Chris (the agent can't produce it):** the component in Presenter mode in the before state on a dark background color, with the Inspector's Before Image section visible.
