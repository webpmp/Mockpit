export type NowPlayingLayoutMode = 'tall' | 'standard_horizontal' | 'compact' | 'extremely_constrained';

export interface NowPlayingLayoutConfig {
  layoutMode: NowPlayingLayoutMode;
  isExtremelyConstrained: boolean;
  isTallLayout: boolean;
  isStandardHorizontal: boolean;
  useRightSideControls: boolean;
  showThumbnail: boolean;
  showTimestamps: boolean;
  showFavoriteButton: boolean;
  showShuffleRepeat: boolean;
  paddingClass: string;
  buttonWidthPx: number;
  buttonHeightPx: number;
  playButtonWidthPx: number;
  playButtonHeightPx: number;
  buttonSizePx: number;
  playButtonSizePx: number;
  iconSizePx: number;
  controlGapPx: number;
  secondaryControlSizePx: number;
  secondaryIconSizePx: number;
}

/**
 * Deterministically resolves the Now Playing component layout mode and feature visibility
 * based exclusively on the authoritative outer component dimensions and orientation.
 *
 * This guarantees:
 * 1. Zero layout oscillation or feedback loops.
 * 2. Content rendering never affects or resizes the component.
 * 3. Stable, predictable breakpoints across all editor grid sizes.
 * 4. Playback controls and scrubber are guaranteed to fit without vertical clipping.
 */
export function resolveNowPlayingLayout(
  width: number,
  height: number,
  orientation: 'horizontal' | 'vertical' = 'horizontal'
): NowPlayingLayoutConfig {
  const w = Math.max(40, width);
  const h = Math.max(40, height);

  // 1. Extremely Constrained: height < 125px (Single row: Scrubber + Playback controls)
  if (h < 125) {
    const paddingClass = h < 105 ? 'p-1.5' : 'p-2';
    const buttonSize = h >= 105 ? (w < 220 ? 32 : 36) : (w < 220 ? 28 : 30);
    const playButtonSize = h >= 105 ? (w < 220 ? 36 : 40) : (w < 220 ? 32 : 34);
    const buttonHeightPx = buttonSize;
    const buttonWidthPx = buttonSize;
    const playButtonHeightPx = playButtonSize;
    const playButtonWidthPx = playButtonSize;
    const iconSizePx = h >= 105 ? 18 : 15;
    const controlGapPx = 5;

    return {
      layoutMode: 'extremely_constrained',
      isExtremelyConstrained: true,
      isTallLayout: false,
      isStandardHorizontal: false,
      useRightSideControls: false,
      showThumbnail: w >= 220,
      showTimestamps: false,
      showFavoriteButton: false,
      showShuffleRepeat: false,
      paddingClass,
      buttonWidthPx,
      buttonHeightPx,
      playButtonWidthPx,
      playButtonHeightPx,
      buttonSizePx: buttonWidthPx,
      playButtonSizePx: playButtonWidthPx,
      iconSizePx,
      controlGapPx,
      secondaryControlSizePx: 26,
      secondaryIconSizePx: 12,
    };
  }

  // 2. Tall Layout: height >= 220 and (orientation === 'vertical' || width < 300 || height >= 260)
  if (h >= 220 && (orientation === 'vertical' || w < 300 || h >= 260)) {
    const paddingClass = h >= 260 ? 'p-3.5' : 'p-3';
    const buttonWidthPx = 46;
    const buttonHeightPx = 46;
    const playButtonWidthPx = 50;
    const playButtonHeightPx = 50;
    const iconSizePx = 22;
    const controlGapPx = 6;
    const secondaryControlSizePx = h >= 280 ? 36 : 32;
    const secondaryIconSizePx = Math.max(13, Math.round(secondaryControlSizePx * 0.44));

    return {
      layoutMode: 'tall',
      isExtremelyConstrained: false,
      isTallLayout: true,
      isStandardHorizontal: false,
      useRightSideControls: false,
      showThumbnail: true,
      showTimestamps: h >= 250,
      showFavoriteButton: true,
      showShuffleRepeat: true,
      paddingClass,
      buttonWidthPx,
      buttonHeightPx,
      playButtonWidthPx,
      playButtonHeightPx,
      buttonSizePx: buttonWidthPx,
      playButtonSizePx: playButtonWidthPx,
      iconSizePx,
      controlGapPx,
      secondaryControlSizePx,
      secondaryIconSizePx,
    };
  }

  // 3. Standard Horizontal Layout: orientation === 'horizontal' and height >= 175 and width >= 300
  if (orientation === 'horizontal' && h >= 175 && w >= 300) {
    const paddingClass = h >= 200 ? 'p-3.5' : 'p-3';
    const buttonWidthPx = 46;
    const buttonHeightPx = 46;
    const playButtonWidthPx = 50;
    const playButtonHeightPx = 50;
    const iconSizePx = 22;
    const controlGapPx = 6;
    const secondaryControlSizePx = 32;
    const secondaryIconSizePx = 14;

    return {
      layoutMode: 'standard_horizontal',
      isExtremelyConstrained: false,
      isTallLayout: false,
      isStandardHorizontal: true,
      useRightSideControls: false,
      showThumbnail: w >= 220,
      showTimestamps: h >= 185 && w >= 260,
      showFavoriteButton: true,
      showShuffleRepeat: true,
      paddingClass,
      buttonWidthPx,
      buttonHeightPx,
      playButtonWidthPx,
      playButtonHeightPx,
      buttonSizePx: buttonWidthPx,
      playButtonSizePx: playButtonWidthPx,
      iconSizePx,
      controlGapPx,
      secondaryControlSizePx,
      secondaryIconSizePx,
    };
  }

  // 4. Compact / Right-Side Controls Layout: 125 <= height < 220 or narrow horizontal layouts
  const paddingClass = h >= 180 ? 'p-3' : h >= 140 ? 'p-2.5' : 'p-2';
  // Preserve 46x46 / 50x50 controls as long as reasonably possible, scaling gracefully in tighter containers
  const isFullSized = h >= 160 && w >= 220;
  const isMediumCompact = h >= 140 && w >= 195;

  const buttonSize = isFullSized ? 46 : isMediumCompact ? 40 : 34;
  const playButtonSize = isFullSized ? 50 : isMediumCompact ? 44 : 38;
  const buttonWidthPx = buttonSize;
  const buttonHeightPx = buttonSize;
  const playButtonWidthPx = playButtonSize;
  const playButtonHeightPx = playButtonSize;
  const iconSizePx = isFullSized ? 22 : isMediumCompact ? 20 : 18;
  const controlGapPx = isFullSized ? 6 : 5;
  const secondaryControlSizePx = h >= 175 ? 30 : h >= 140 ? 26 : 24;
  const secondaryIconSizePx = Math.max(11, Math.round(secondaryControlSizePx * 0.45));

  return {
    layoutMode: 'compact',
    isExtremelyConstrained: false,
    isTallLayout: false,
    isStandardHorizontal: false,
    useRightSideControls: true,
    showThumbnail: w >= 240 && h >= 115,
    showTimestamps: false,
    showFavoriteButton: w >= 240,
    showShuffleRepeat: false,
    paddingClass,
    buttonWidthPx,
    buttonHeightPx,
    playButtonWidthPx,
    playButtonHeightPx,
    buttonSizePx: buttonWidthPx,
    playButtonSizePx: playButtonWidthPx,
    iconSizePx,
    controlGapPx,
    secondaryControlSizePx,
    secondaryIconSizePx,
  };
}
