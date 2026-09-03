export type NowPlayingLayoutMode = 'tall' | 'standard_horizontal' | 'wide_short' | 'compact' | 'extremely_constrained';

export interface NowPlayingLayoutConfig {
  layoutMode: NowPlayingLayoutMode;
  isExtremelyConstrained: boolean;
  isTallLayout: boolean;
  isStandardHorizontal: boolean;
  isWideShort: boolean;
  useRightSideControls: boolean;

  // Progressive content removal flags (evaluated by fit)
  showHeaderIcon: boolean;
  showHeaderDivider: boolean;
  showThumbnail: boolean;
  showSeekBar: boolean;
  showTimestamps: boolean;
  showFavoriteButton: boolean;
  showShuffleRepeat: boolean;

  // Sizing & Spacing
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
 * Deterministically resolves the Now Playing component layout mode and progressive content visibility
 * based continuously and exclusively on the authoritative outer component dimensions and orientation.
 *
 * Content removal & restoration priority order:
 * When space decreases:
 *   1. Timestamps (CURRENT TIME / TOTAL TIME removed from layout, 0 leftover gap)
 *   2. Header Icon & Divider (music icon and divider border removed, compact header)
 *   3. Secondary Actions (Favorite, Shuffle, Repeat removed at short heights or squeezed widths)
 *   4. Seek Bar (progress bar removed when height is very constrained)
 *
 * When space increases (BIDIRECTIONAL RESTORATION):
 *   1. Seek Bar (restored first when height >= 150px)
 *   2. Secondary Actions (restored in dedicated bottom row for Narrow + Tall at height >= 250px, or inline when width >= 300px)
 *   3. Timestamps (restored when height >= 290px in Tall or height >= 195px in Standard Horizontal)
 *   4. Header Icon & Divider (restored when spacious, e.g. height >= 320px in Tall or height >= 225px in Horizontal)
 *
 * Specific Narrow Width Layout Mode (w < 300px):
 *   - At narrow widths, we do not squeeze Favorite / Shuffle / Repeat onto the track info row.
 *   - 280 x 220 (Narrow + Short): Secondary actions remain hidden. Layout: TRACK INFO, SEEK BAR, BACK PAUSE NEXT.
 *   - 280 x 260 (Narrow + Tall): Secondary actions restored in dedicated bottom row! Layout: TRACK INFO, SEEK BAR, BACK PAUSE NEXT, FAVORITE SHUFFLE REPEAT.
 *   - 280 x 300 (Narrow + Very Tall): Timestamps restored as well! Layout: TRACK INFO, SEEK BAR, TIMESTAMPS, BACK PAUSE NEXT, FAVORITE SHUFFLE REPEAT.
 *   - Decreasing height from 300 -> 260 -> 220 cleanly removes timestamps, then secondary actions.
 *   - Increasing height back up from 220 -> 260 -> 300 immediately restores them without any lingering or irreversible state.
 */
export function resolveNowPlayingLayout(
  width: number,
  height: number,
  orientation: 'horizontal' | 'vertical' = 'horizontal'
): NowPlayingLayoutConfig {
  const w = Math.max(40, width);
  const h = Math.max(40, height);

  // 1. Extremely Constrained: height < 125px (Single row: Scrubber/Track + Playback controls)
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
      isWideShort: false,
      useRightSideControls: false,
      showHeaderIcon: false,
      showHeaderDivider: false,
      showThumbnail: w >= 220,
      showSeekBar: w >= 210,
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

  // 2. Tall Layout: Spacious vertical layout with dedicated bottom secondary controls row
  // Selected when:
  // - orientation === 'vertical'
  // - or (w < 300 && h >= 240): Narrow + Tall mode (uses vertical space for separate secondary controls row)
  // - or (h >= 270): Tall spacious mode
  // - or (h >= 240 && h / w >= 0.8): Vertical-leaning aspect ratio
  if (
    orientation === 'vertical' ||
    (w < 300 && h >= 240) ||
    h >= 270 ||
    (h >= 240 && h / w >= 0.8)
  ) {
    const paddingClass = h >= 270 ? 'p-3.5' : 'p-3';
    const isMediumTall = h < 270;
    const buttonWidthPx = isMediumTall ? 42 : 46;
    const buttonHeightPx = isMediumTall ? 42 : 46;
    const playButtonWidthPx = isMediumTall ? 46 : 50;
    const playButtonHeightPx = isMediumTall ? 46 : 50;
    const iconSizePx = isMediumTall ? 20 : 22;
    const controlGapPx = 6;
    const secondaryControlSizePx = 44;
    const secondaryIconSizePx = 18; // ~0.41x, consistent with prior ratio at this branch's larger end

    // Progressive feature restoration in Tall mode:
    // - Secondary actions (Favorite, Shuffle, Repeat) are restored at h >= 240
    const showFavoriteButton = true;
    const showShuffleRepeat = true;
    const showSeekBar = true;
    const showThumbnail = true;

    // - Timestamps are restored at h >= 200 and w >= 240
    const showTimestamps = h >= 200 && w >= 240;

    // - Header icon and divider are restored when container is spacious
    const showHeaderIcon = (w >= 300 && h >= 280) || h >= 320;
    const showHeaderDivider = (w >= 300 && h >= 290) || h >= 330;

    return {
      layoutMode: 'tall',
      isExtremelyConstrained: false,
      isTallLayout: true,
      isStandardHorizontal: false,
      isWideShort: false,
      useRightSideControls: false,
      showHeaderIcon,
      showHeaderDivider,
      showThumbnail,
      showSeekBar,
      showTimestamps,
      showFavoriteButton,
      showShuffleRepeat,
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

  // 3. Wide + Short Compact Layout: when horizontal space is abundant but vertical space is constrained
  // Evaluates width and height together (e.g., 700x180, 600x160, 500x160, 480x170, or w/h >= 2.2 with h < 195)
  const isWideShortCandidate =
    orientation === 'horizontal' &&
    ((w >= 450 && h < 200) || (w >= 360 && h < 185) || (w / h >= 2.2 && h < 195 && w >= 320));

  if (isWideShortCandidate) {
    const paddingClass = h >= 180 ? 'p-3' : h >= 150 ? 'p-2.5' : 'p-2';
    const isFullSized = h >= 160;
    const isMediumCompact = h >= 140;

    const buttonSize = isFullSized ? 46 : isMediumCompact ? 40 : 34;
    const playButtonSize = isFullSized ? 50 : isMediumCompact ? 44 : 38;
    const buttonWidthPx = buttonSize;
    const buttonHeightPx = buttonSize;
    const playButtonWidthPx = playButtonSize;
    const playButtonHeightPx = playButtonSize;
    const iconSizePx = isFullSized ? 22 : isMediumCompact ? 20 : 18;
    const controlGapPx = isFullSized ? 6 : 5;
    const secondaryControlSizePx = 44;
    const secondaryIconSizePx = 18;

    const showHeaderIcon = w >= 360 && h >= 155;
    const showHeaderDivider = h >= 185 && w >= 450;
    const showThumbnail = w >= 220;
    const showSeekBar = w >= 280 && h >= 130;
    const showTimestamps = h >= 155 && w >= 400;
    const showFavoriteButton = w >= 300 && h >= 140;
    const showShuffleRepeat = w >= 420 && h >= 150;

    return {
      layoutMode: 'wide_short',
      isExtremelyConstrained: false,
      isTallLayout: false,
      isStandardHorizontal: false,
      isWideShort: true,
      useRightSideControls: true,
      showHeaderIcon,
      showHeaderDivider,
      showThumbnail,
      showSeekBar,
      showTimestamps,
      showFavoriteButton,
      showShuffleRepeat,
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

  // 4. Standard Stacked Horizontal Layout: orientation === 'horizontal' and height >= 195 and width >= 300
  if (orientation === 'horizontal' && h >= 195 && w >= 300) {
    const paddingClass = h >= 210 ? 'p-3.5' : 'p-3';
    const buttonWidthPx = 46;
    const buttonHeightPx = 46;
    const playButtonWidthPx = 50;
    const playButtonHeightPx = 50;
    const iconSizePx = 22;
    const controlGapPx = 6;
    const secondaryControlSizePx = 44;
    const secondaryIconSizePx = 18;

    const showHeaderIcon = w >= 320 || h >= 220;
    const showHeaderDivider = h >= 225 && w >= 340;
    const showThumbnail = true;
    const showSeekBar = true;
    const showTimestamps = h >= 195 && w >= 280;
    const showFavoriteButton = w >= 300;
    const showShuffleRepeat = w >= 360;

    return {
      layoutMode: 'standard_horizontal',
      isExtremelyConstrained: false,
      isTallLayout: false,
      isStandardHorizontal: true,
      isWideShort: false,
      useRightSideControls: false,
      showHeaderIcon,
      showHeaderDivider,
      showThumbnail,
      showSeekBar,
      showTimestamps,
      showFavoriteButton,
      showShuffleRepeat,
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

  // 5. Compact Layout: for narrower horizontal layouts (w < 300 and h < 250) or vertically constrained heights (125 <= h < 195 when w >= 300)
  // Evaluates progressive removal and restoration for 280x220, 242x220, 242x180, 200x180, etc.
  const paddingClass = h >= 180 ? 'p-3' : h >= 140 ? 'p-2.5' : 'p-2';
  const isFullSized = h >= 165 && w >= 220;
  const isMediumCompact = h >= 140 && w >= 195;

  const buttonSize = isFullSized ? 42 : isMediumCompact ? 38 : 34;
  const playButtonSize = isFullSized ? 46 : isMediumCompact ? 42 : 38;
  const buttonWidthPx = buttonSize;
  const buttonHeightPx = buttonSize;
  const playButtonWidthPx = playButtonSize;
  const playButtonHeightPx = playButtonSize;
  const iconSizePx = isFullSized ? 20 : isMediumCompact ? 18 : 16;
  const controlGapPx = isFullSized ? 6 : 5;
  const secondaryControlSizePx = 44;
  const secondaryIconSizePx = 18;

  // Progressive content removal & restoration evaluations for compact:
  // 1. Timestamps: only if height >= 190 and width >= 220
  const showTimestamps = h >= 190 && w >= 220;
  // 2. NOW PLAYING Header Icon: only if width >= 300 and height >= 210
  const showHeaderIcon = w >= 300 && h >= 210;
  // 3. Header Divider: only if height >= 230 and width >= 320
  const showHeaderDivider = h >= 230 && w >= 320;
  // 4. Seek Bar: fits if height >= 150 and width >= 190
  const showSeekBar = h >= 150 && w >= 190;
  // 5. Favorite Button: at narrow widths (w < 300) secondary actions are hidden when h < 250; inline favorite fits if width >= 300 and height >= 160
  const showFavoriteButton = w >= 300 && h >= 160;
  // 6. Shuffle & Repeat: hidden in compact (restored in tall or standard horizontal)
  const showShuffleRepeat = false;
  // 7. Thumbnail / Artwork: preserved down to 180px width
  const showThumbnail = w >= 180 && h >= 120;

  return {
    layoutMode: 'compact',
    isExtremelyConstrained: false,
    isTallLayout: false,
    isStandardHorizontal: false,
    isWideShort: false,
    useRightSideControls: false,
    showHeaderIcon,
    showHeaderDivider,
    showThumbnail,
    showSeekBar,
    showTimestamps,
    showFavoriteButton,
    showShuffleRepeat,
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

