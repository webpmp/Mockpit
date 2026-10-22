import type { CSSProperties } from 'react';
import { ComponentInstance } from '../types';

export interface VisualSelectionState {
  directlySelectedId: string | null;
  connectedPartnerIds: string[];
  visuallySelectedIds: string[];
}

/**
 * Derives the visual selection state for components on the canvas in both
 * Editor Mode and Presenter View.
 *
 * Rules:
 * 1. If no component is directly selected, visual selection is empty.
 * 2. If a Status Callout is directly selected, both it and its connected target
 *    are visually selected.
 * 3. If a connected target is directly selected, both it and the connected
 *    Status Callout are visually selected.
 * 4. Also supports Component Integration (parentId / child relationships).
 * 5. If an unrelated component is directly selected, only that component is visually selected.
 */
export function getVisualSelectionState(
  selectedComponentId: string | null,
  components: ComponentInstance[]
): VisualSelectionState {
  if (!selectedComponentId) {
    return {
      directlySelectedId: null,
      connectedPartnerIds: [],
      visuallySelectedIds: [],
    };
  }

  const selectedComp = components.find((c) => c.id === selectedComponentId);
  if (!selectedComp) {
    return {
      directlySelectedId: selectedComponentId,
      connectedPartnerIds: [],
      visuallySelectedIds: [selectedComponentId],
    };
  }

  const partnerIds = new Set<string>();

  // Case 1: selectedComp is a vehicleStatusCallout pointing to a target
  if (selectedComp.type === 'vehicleStatusCallout' && selectedComp.connector?.targetComponentId) {
    const targetId = selectedComp.connector.targetComponentId;
    if (components.some((c) => c.id === targetId)) {
      partnerIds.add(targetId);
    }
  }

  // Case 2: selectedComp is the target of one or more vehicleStatusCallout connectors
  components.forEach((c) => {
    if (c.type === 'vehicleStatusCallout' && c.connector?.targetComponentId === selectedComp.id) {
      partnerIds.add(c.id);
    }
  });

  // Case 3: Component Integration (parentId / child)
  if (selectedComp.parentId && components.some((c) => c.id === selectedComp.parentId)) {
    partnerIds.add(selectedComp.parentId);
  }
  components.forEach((c) => {
    if (c.parentId === selectedComp.id) {
      partnerIds.add(c.id);
    }
  });

  const connectedPartnerIds = Array.from(partnerIds);
  const visuallySelectedIds = [selectedComponentId, ...connectedPartnerIds];

  return {
    directlySelectedId: selectedComponentId,
    connectedPartnerIds,
    visuallySelectedIds,
  };
}

/**
 * Resolves the active vehicleStatusCallout component that owns the connection
 * associated with `componentId`, regardless of whether `componentId` is the
 * source callout, the connected target, or an integrated partner.
 */
export function resolveActiveCalloutIdForComponent(
  componentId: string | null,
  components: ComponentInstance[]
): string | null {
  if (!componentId) return null;

  const comp = components.find((c) => c.id === componentId);
  if (!comp) return null;

  // 1. Direct callout with connector
  if (comp.type === 'vehicleStatusCallout' && comp.connector?.targetComponentId) {
    return comp.id;
  }

  // 2. Component is target of a callout's connector
  const directSourceCallout = components.find(
    (c) => c.type === 'vehicleStatusCallout' && c.connector?.targetComponentId === comp.id
  );
  if (directSourceCallout) {
    return directSourceCallout.id;
  }

  // 3. Component is combined in a visual selection group (e.g. parentId integration or connected partner)
  const visualState = getVisualSelectionState(componentId, components);
  for (const partnerId of visualState.connectedPartnerIds) {
    const partner = components.find((c) => c.id === partnerId);
    if (partner?.type === 'vehicleStatusCallout' && partner.connector?.targetComponentId) {
      return partner.id;
    }
    const partnerCallout = components.find(
      (c) => c.type === 'vehicleStatusCallout' && c.connector?.targetComponentId === partnerId
    );
    if (partnerCallout) {
      return partnerCallout.id;
    }
  }

  return null;
}

export interface SelectionBoundaryStyles {
  isVisuallySelected: boolean;
  borderClasses: string;
  cornerClasses: string;
  inlineStyle: CSSProperties;
  isSeamTop: boolean;
  isSeamBottom: boolean;
  isSeamLeft: boolean;
  isSeamRight: boolean;
  testId: string;
}

/**
 * Computes coordinated outer-edge selection border and glow styles for a component
 * in Presenter view.
 * When two or more components form a connected group, the shared seam between them
 * has no blue border, ring, or glow, while outer perimeter edges and external corners
 * retain their complete, continuous selection outline.
 */
export function getSelectionBoundaryStyles(
  comp: ComponentInstance,
  components: ComponentInstance[],
  isVisuallySelected: boolean,
  isDirectlySelected: boolean
): SelectionBoundaryStyles {
  const testId = isDirectlySelected ? 'selection-box-primary' : 'selection-box-connected';

  if (!isVisuallySelected) {
    return {
      isVisuallySelected: false,
      borderClasses: '',
      cornerClasses: '',
      inlineStyle: {},
      isSeamTop: false,
      isSeamBottom: false,
      isSeamLeft: false,
      isSeamRight: false,
      testId,
    };
  }

  // Seam detection via explicit borderOverrides
  let isSeamTop = comp.borderOverrides?.top === false;
  let isSeamBottom = comp.borderOverrides?.bottom === false;
  let isSeamLeft = comp.borderOverrides?.left === false;
  let isSeamRight = comp.borderOverrides?.right === false;

  // Also check geometric adjacency with visually selected partner components
  const visualState = getVisualSelectionState(comp.id, components);
  for (const partnerId of visualState.connectedPartnerIds) {
    const partner = components.find((c) => c.id === partnerId);
    if (!partner) continue;

    // Check vertical touch
    const sharesX =
      Math.max(comp.x, partner.x) < Math.min(comp.x + comp.width, partner.x + partner.width);
    if (sharesX) {
      if (Math.abs((partner.y + partner.height) - comp.y) <= 4) {
        isSeamTop = true;
      }
      if (Math.abs((comp.y + comp.height) - partner.y) <= 4) {
        isSeamBottom = true;
      }
    }

    // Check horizontal touch
    const sharesY =
      Math.max(comp.y, partner.y) < Math.min(comp.y + comp.height, partner.y + partner.height);
    if (sharesY) {
      if (Math.abs((partner.x + partner.width) - comp.x) <= 4) {
        isSeamLeft = true;
      }
      if (Math.abs((comp.x + comp.width) - partner.x) <= 4) {
        isSeamRight = true;
      }
    }
  }

  // Build directional border classes
  const borderParts: string[] = [];
  if (!isSeamTop) borderParts.push('border-t-2');
  if (!isSeamBottom) borderParts.push('border-b-2');
  if (!isSeamLeft) borderParts.push('border-l-2');
  if (!isSeamRight) borderParts.push('border-r-2');
  const borderClasses = borderParts.join(' ');

  // Build directional corner classes
  const cornerParts: string[] = [];
  if (!isSeamTop && !isSeamLeft) cornerParts.push('rounded-tl-2xl');
  else cornerParts.push('rounded-tl-none');

  if (!isSeamTop && !isSeamRight) cornerParts.push('rounded-tr-2xl');
  else cornerParts.push('rounded-tr-none');

  if (!isSeamBottom && !isSeamLeft) cornerParts.push('rounded-bl-2xl');
  else cornerParts.push('rounded-bl-none');

  if (!isSeamBottom && !isSeamRight) cornerParts.push('rounded-br-2xl');
  else cornerParts.push('rounded-br-none');
  const cornerClasses = cornerParts.join(' ');

  // Clip glow at shared seams so zero glow bleeds into the horizontal/vertical boundary
  const topClip = isSeamTop ? '0px' : '-20px';
  const bottomClip = isSeamBottom ? '0px' : '-20px';
  const leftClip = isSeamLeft ? '0px' : '-20px';
  const rightClip = isSeamRight ? '0px' : '-20px';
  const hasSeam = isSeamTop || isSeamBottom || isSeamLeft || isSeamRight;
  const clipPath = hasSeam ? `inset(${topClip} ${rightClip} ${bottomClip} ${leftClip})` : undefined;

  const inlineStyle: CSSProperties = {
    borderColor: 'var(--color-primary, #38bdf8)',
    boxShadow: '0 0 15px color-mix(in srgb, var(--color-primary, #38bdf8) 40%, transparent)',
    clipPath,
  };

  return {
    isVisuallySelected: true,
    borderClasses,
    cornerClasses,
    inlineStyle,
    isSeamTop,
    isSeamBottom,
    isSeamLeft,
    isSeamRight,
    testId,
  };
}
