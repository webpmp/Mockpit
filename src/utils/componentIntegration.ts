import { ComponentInstance } from '../types';

export type IntegrationStyle = 'inside' | 'outside';

export type AttachmentPosition =
  | 'top-left'
  | 'top'
  | 'top-right'
  | 'left'
  | 'center'
  | 'right'
  | 'bottom-left'
  | 'bottom'
  | 'bottom-right';

export interface EligibilityResult {
  isEligible: boolean;
  style?: IntegrationStyle;
  attachmentPosition?: AttachmentPosition;
  reason?: string;
}

export interface CandidateComponent {
  component: ComponentInstance;
  style: IntegrationStyle;
  attachmentPosition: AttachmentPosition;
}

/**
 * Calculates geometric eligibility between two components (child and candidate parent).
 *
 * Rules:
 * - Inside candidate: overlap area >= 90% of the smaller component's own area.
 * - Outside candidate: separated by a gap of <= 20px on exactly one side,
 *   AND their overlap along the perpendicular axis (the shared edge) is >= 50%
 *   of the shorter component's extent on that axis.
 */
export function checkIntegrationEligibility(
  child: ComponentInstance,
  parent: ComponentInstance
): EligibilityResult {
  if (child.id === parent.id) {
    return { isEligible: false, reason: 'Same component' };
  }

  const childArea = child.width * child.height;
  const parentArea = parent.width * parent.height;
  const smallerArea = Math.min(childArea, parentArea);

  // 1. Check for Inside candidate (overlap area >= 90% of smaller component's area)
  const xOverlap = Math.max(0, Math.min(child.x + child.width, parent.x + parent.width) - Math.max(child.x, parent.x));
  const yOverlap = Math.max(0, Math.min(child.y + child.height, parent.y + parent.height) - Math.max(child.y, parent.y));
  const overlapArea = xOverlap * yOverlap;

  if (smallerArea > 0 && overlapArea / smallerArea >= 0.9) {
    const attachmentPosition = computeInsideAttachmentPosition(child, parent);
    return {
      isEligible: true,
      style: 'inside',
      attachmentPosition,
    };
  }

  // 2. Check for Outside candidate (gap <= 20px on exactly one side, perpendicular overlap >= 50%)
  const sides = checkOutsideAdjacency(child, parent);
  if (sides.length === 1) {
    const side = sides[0];
    return {
      isEligible: true,
      style: 'outside',
      attachmentPosition: side,
    };
  }

  return { isEligible: false, reason: 'Does not satisfy inside or outside thresholds' };
}

/**
 * Checks which single side child is adjacent to parent with gap <= 20px and perpendicular overlap >= 50%.
 * Returns an array of matching sides (e.g. ['top'], ['bottom'], etc.).
 * AttachmentPosition represents the child's position relative to the parent.
 */
function checkOutsideAdjacency(
  child: ComponentInstance,
  parent: ComponentInstance
): AttachmentPosition[] {
  const matches: AttachmentPosition[] = [];
  const GAP_MAX = 20;

  // Overlap along X axis
  const xOverlap = Math.max(0, Math.min(child.x + child.width, parent.x + parent.width) - Math.max(child.x, parent.x));
  const shorterWidth = Math.min(child.width, parent.width);
  const hasXOverlap = shorterWidth > 0 && xOverlap / shorterWidth >= 0.5;

  // Overlap along Y axis
  const yOverlap = Math.max(0, Math.min(child.y + child.height, parent.y + parent.height) - Math.max(child.y, parent.y));
  const shorterHeight = Math.min(child.height, parent.height);
  const hasYOverlap = shorterHeight > 0 && yOverlap / shorterHeight >= 0.5;

  // Case A: Child is ABOVE Parent (child's bottom edge is near parent's top edge)
  if (hasXOverlap) {
    const gapAbove = parent.y - (child.y + child.height);
    // Allow slight intersection (up to 4px) or gap up to 20px
    if (gapAbove >= -4 && gapAbove <= GAP_MAX) {
      matches.push('top');
    }
    const gapBelow = child.y - (parent.y + parent.height);
    if (gapBelow >= -4 && gapBelow <= GAP_MAX) {
      matches.push('bottom');
    }
  }

  // Case B: Child is to the LEFT or RIGHT of Parent
  if (hasYOverlap) {
    const gapLeft = parent.x - (child.x + child.width);
    if (gapLeft >= -4 && gapLeft <= GAP_MAX) {
      matches.push('left');
    }
    const gapRight = child.x - (parent.x + parent.width);
    if (gapRight >= -4 && gapRight <= GAP_MAX) {
      matches.push('right');
    }
  }

  return matches;
}

/**
 * For inside integration style, computes attachment position based on child center relative to parent bounds.
 */
export function computeInsideAttachmentPosition(
  child: ComponentInstance,
  parent: ComponentInstance
): AttachmentPosition {
  const childCenterX = child.x + child.width / 2;
  const childCenterY = child.y + child.height / 2;

  const parentCenterX = parent.x + parent.width / 2;
  const parentCenterY = parent.y + parent.height / 2;

  const diffX = childCenterX - parentCenterX;
  const diffY = childCenterY - parentCenterY;

  // Center deadzone: if child center is within 15% of parent dimensions from parent center
  const centerThresholdX = parent.width * 0.15;
  const centerThresholdY = parent.height * 0.15;

  const isCenterX = Math.abs(diffX) <= centerThresholdX;
  const isCenterY = Math.abs(diffY) <= centerThresholdY;

  if (isCenterX && isCenterY) {
    return 'center';
  }

  const isLeft = diffX < -centerThresholdX;
  const isRight = diffX > centerThresholdX;
  const isTop = diffY < -centerThresholdY;
  const isBottom = diffY > centerThresholdY;

  if (isTop && isLeft) return 'top-left';
  if (isTop && isRight) return 'top-right';
  if (isTop) return 'top';

  if (isBottom && isLeft) return 'bottom-left';
  if (isBottom && isRight) return 'bottom-right';
  if (isBottom) return 'bottom';

  if (isLeft) return 'left';
  if (isRight) return 'right';

  return 'center';
}

/**
 * Returns all components on the same screen that geometrically qualify as a parent candidate.
 */
export function getEligibleParentCandidates(
  child: ComponentInstance,
  allScreenComponents: ComponentInstance[]
): CandidateComponent[] {
  // A child cannot connect to:
  // 1. itself
  // 2. a component that is already its child (no cycles)
  // 3. a component on a different screen (enforced by passing same-screen components)
  const candidates: CandidateComponent[] = [];

  for (const comp of allScreenComponents) {
    if (comp.id === child.id) continue;
    // Disallow if comp currently points to child as parent (cycle prevention)
    if (comp.parentId === child.id) continue;

    const result = checkIntegrationEligibility(child, comp);
    if (result.isEligible && result.style && result.attachmentPosition) {
      candidates.push({
        component: comp,
        style: result.style,
        attachmentPosition: result.attachmentPosition,
      });
    }
  }

  return candidates;
}

/**
 * Human-readable display label for attachment positions.
 */
export function formatAttachmentPosition(pos: AttachmentPosition): string {
  switch (pos) {
    case 'top-left':
      return 'Top Left';
    case 'top':
      return 'Top';
    case 'top-right':
      return 'Top Right';
    case 'left':
      return 'Left';
    case 'center':
      return 'Center';
    case 'right':
      return 'Right';
    case 'bottom-left':
      return 'Bottom Left';
    case 'bottom':
      return 'Bottom';
    case 'bottom-right':
      return 'Bottom Right';
    default:
      return pos;
  }
}
