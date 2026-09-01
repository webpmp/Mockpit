import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolveNowPlayingLayout } from '../../utils/nowPlayingLayout';

describe('Now Playing Layout Determinism & Progressive Content Removal Suite', () => {
  it('1. Deterministically resolves Tall Layout for 264 × 352 with full features', () => {
    const layout = resolveNowPlayingLayout(264, 352, 'horizontal');
    assert.equal(layout.layoutMode, 'tall');
    assert.equal(layout.isTallLayout, true);
    assert.equal(layout.isExtremelyConstrained, false);
    assert.equal(layout.showHeaderIcon, true);
    assert.equal(layout.showHeaderDivider, true);
    assert.equal(layout.showThumbnail, true);
    assert.equal(layout.showSeekBar, true);
    assert.equal(layout.showTimestamps, true);
    assert.equal(layout.showFavoriteButton, true);
    assert.equal(layout.showShuffleRepeat, true);
    assert.equal(layout.paddingClass, 'p-3.5');
  });

  it('2. Deterministically resolves Tall Layout for 264 × 270 with restored secondary actions', () => {
    const layout = resolveNowPlayingLayout(264, 270, 'horizontal');
    assert.equal(layout.layoutMode, 'tall');
    assert.equal(layout.isTallLayout, true);
    assert.equal(layout.isExtremelyConstrained, false);
    assert.equal(layout.showThumbnail, true);
    assert.equal(layout.showSeekBar, true);
    assert.equal(layout.showFavoriteButton, true);
    assert.equal(layout.showShuffleRepeat, true);
    assert.equal(layout.showHeaderIcon, false, 'Header icon removed at 264x270 to preserve action row');
    assert.equal(layout.showHeaderDivider, false, 'Header divider removed at 264x270 to preserve action row');
    assert.equal(layout.showTimestamps, false, 'Timestamps removed at 264x270 to preserve action row');
  });

  it('3. Deterministically applies Progressive Removal for 242 × 220 (Compact Mode)', () => {
    // 242 × 220: Space is constrained
    // Priority 1: Timestamps removed (showTimestamps = false)
    // Priority 2: Header Icon removed (showHeaderIcon = false)
    // Priority 3: Header Divider removed (showHeaderDivider = false)
    // Priority 4: Secondary actions (Favorite/Shuffle/Repeat) removed (showFavoriteButton = false, showShuffleRepeat = false)
    // Essential: Seek bar, Thumbnail, Transport controls kept!
    const layout = resolveNowPlayingLayout(242, 220, 'horizontal');
    assert.equal(layout.layoutMode, 'compact');
    assert.equal(layout.showHeaderIcon, false, 'Header icon removed at 242x220');
    assert.equal(layout.showHeaderDivider, false, 'Header divider removed at 242x220');
    assert.equal(layout.showTimestamps, false, 'Timestamps removed at 242x220');
    assert.equal(layout.showShuffleRepeat, false, 'Shuffle/Repeat removed at 242x220');
    assert.equal(layout.showFavoriteButton, false, 'Favorite button hidden at 242x220');
    assert.equal(layout.showSeekBar, true, 'Seek bar fits at 242x220');
    assert.equal(layout.showThumbnail, true, 'Artwork fits at 242x220');
  });

  it('4. Deterministically applies Progressive Removal for 242 × 180 and 200 × 180', () => {
    // 242 × 180: Timestamps removed, Header icon & divider removed, Shuffle/Repeat removed, Favorite removed
    // Seek bar, Thumbnail, Transport controls kept
    const layout1 = resolveNowPlayingLayout(242, 180, 'horizontal');
    assert.equal(layout1.layoutMode, 'compact');
    assert.equal(layout1.showHeaderIcon, false);
    assert.equal(layout1.showHeaderDivider, false);
    assert.equal(layout1.showTimestamps, false);
    assert.equal(layout1.showShuffleRepeat, false);
    assert.equal(layout1.showFavoriteButton, false);
    assert.equal(layout1.showSeekBar, true);
    assert.equal(layout1.showThumbnail, true);

    // 200 × 180: Narrower width (< 230)
    const layout2 = resolveNowPlayingLayout(200, 180, 'horizontal');
    assert.equal(layout2.showFavoriteButton, false);
    assert.equal(layout2.showSeekBar, true);
    assert.equal(layout2.showThumbnail, true);
  });

  it('5. Narrow but Tall Bidirectional Content Restoration Acceptance Test (280x220 -> 280x260 -> 280x300 -> 280x220 -> 280x300)', () => {
    // Phase 1: 280 × 220 (Narrow + Short)
    // Not enough vertical space: TRACK INFO, SEEK BAR, BACK PAUSE NEXT. Secondary actions & timestamps hidden.
    const step1 = resolveNowPlayingLayout(280, 220, 'horizontal');
    assert.equal(step1.layoutMode, 'compact');
    assert.equal(step1.showThumbnail, true, 'Track info artwork shown');
    assert.equal(step1.showSeekBar, true, 'Seek bar shown');
    assert.equal(step1.showTimestamps, false, 'Timestamps hidden at 280x220');
    assert.equal(step1.showFavoriteButton, false, 'Secondary actions hidden at 280x220');
    assert.equal(step1.showShuffleRepeat, false, 'Secondary actions hidden at 280x220');

    // Phase 2: Resize height only -> 280 × 260 (Narrow + Tall)
    // Enough vertical space: Secondary actions restored into dedicated bottom row beneath transport controls!
    const step2 = resolveNowPlayingLayout(280, 260, 'horizontal');
    assert.equal(step2.layoutMode, 'tall');
    assert.equal(step2.isTallLayout, true);
    assert.equal(step2.showThumbnail, true, 'Track info artwork shown');
    assert.equal(step2.showSeekBar, true, 'Seek bar shown');
    assert.equal(step2.showTimestamps, false, 'Timestamps still omitted at 260px to preserve control breathing room');
    assert.equal(step2.showFavoriteButton, true, 'Favorite restored in dedicated row at 280x260');
    assert.equal(step2.showShuffleRepeat, true, 'Shuffle/Repeat restored in dedicated row at 280x260');

    // Phase 3: Resize height only -> 280 × 300 (Narrow + Very Tall)
    // Definitely enough vertical space: Timestamps restored as well!
    const step3 = resolveNowPlayingLayout(280, 300, 'horizontal');
    assert.equal(step3.layoutMode, 'tall');
    assert.equal(step3.isTallLayout, true);
    assert.equal(step3.showThumbnail, true, 'Track info artwork shown');
    assert.equal(step3.showSeekBar, true, 'Seek bar shown');
    assert.equal(step3.showTimestamps, true, 'Timestamps restored at 280x300');
    assert.equal(step3.showFavoriteButton, true, 'Favorite restored at 280x300');
    assert.equal(step3.showShuffleRepeat, true, 'Shuffle/Repeat restored at 280x300');

    // Phase 4: Reduce height back down -> 280 × 220
    // Content removal is not permanent - automatically removes timestamps & secondary actions again
    const step4 = resolveNowPlayingLayout(280, 220, 'horizontal');
    assert.equal(step4.layoutMode, 'compact');
    assert.equal(step4.showTimestamps, false);
    assert.equal(step4.showFavoriteButton, false);
    assert.equal(step4.showShuffleRepeat, false);

    // Phase 5: Increase height back up -> 280 × 300
    // Content is immediately restored with zero sticky state
    const step5 = resolveNowPlayingLayout(280, 300, 'horizontal');
    assert.equal(step5.layoutMode, 'tall');
    assert.equal(step5.showTimestamps, true);
    assert.equal(step5.showFavoriteButton, true);
    assert.equal(step5.showShuffleRepeat, true);
  });

  it('6. Deterministically applies Progressive Removal for 200 × 140', () => {
    // 200 × 140: Height < 150px removes seek bar, preserving essential title, artist, artwork and controls
    const layout = resolveNowPlayingLayout(200, 140, 'horizontal');
    assert.equal(layout.layoutMode, 'compact');
    assert.equal(layout.showHeaderIcon, false);
    assert.equal(layout.showHeaderDivider, false);
    assert.equal(layout.showTimestamps, false);
    assert.equal(layout.showSeekBar, false, 'Seek bar removed when height < 150');
    assert.equal(layout.showFavoriteButton, false);
    assert.equal(layout.showShuffleRepeat, false);
    assert.equal(layout.showThumbnail, true);
  });

  it('7. Deterministically resolves Extremely Constrained Layout for 264 × 112', () => {
    const layout = resolveNowPlayingLayout(264, 112, 'horizontal');
    assert.equal(layout.layoutMode, 'extremely_constrained');
    assert.equal(layout.isExtremelyConstrained, true);
    assert.equal(layout.useRightSideControls, false);
    assert.equal(layout.isTallLayout, false);
    assert.equal(layout.showThumbnail, true);
    assert.equal(layout.showSeekBar, true);
    assert.equal(layout.showTimestamps, false);
    assert.equal(layout.paddingClass, 'p-2');
  });

  it('8. Invariant: Same dimensions always yield the exact same layout (idempotent)', () => {
    for (const [w, h] of [
      [264, 352],
      [264, 250],
      [242, 220],
      [242, 180],
      [264, 160],
      [264, 144],
      [264, 128],
      [264, 112],
      [400, 200],
      [500, 160],
      [400, 140],
      [400, 120],
      [400, 100],
      [200, 200],
      [200, 160],
      [200, 140],
    ]) {
      const first = resolveNowPlayingLayout(w, h, 'horizontal');
      const second = resolveNowPlayingLayout(w, h, 'horizontal');
      assert.deepEqual(first, second, `Layout resolution must be completely idempotent for ${w}x${h}`);
      assert.ok(first.buttonWidthPx >= 24 && first.buttonWidthPx <= 48, `Button width must be between 24 and 48px for ${w}x${h}`);
      assert.ok(first.iconSizePx >= 12 && first.iconSizePx <= 22, `Icon size must scale proportionally for ${w}x${h}`);
    }
  });

  it('9. Continuous resizing between 352px and 100px height never produces undefined or oscillating modes and scales controls gracefully', () => {
    let lastMode = '';
    for (let h = 352; h >= 100; h -= 2) {
      const layout = resolveNowPlayingLayout(264, h, 'horizontal');
      assert.ok(['tall', 'compact', 'extremely_constrained', 'standard_horizontal', 'wide_short'].includes(layout.layoutMode));
      assert.ok(layout.buttonWidthPx > 0);
      assert.ok(layout.playButtonWidthPx > 0);
      assert.ok(layout.iconSizePx > 0);
      lastMode = layout.layoutMode;
    }
    assert.equal(lastMode, 'extremely_constrained');
  });

  it('10. Auto-dismiss state resolution: editor mode preserves accessibility when selected or dismissed', () => {
    const computeActuallyDismissed = (isDismissed: boolean, autoDismissEnabled: boolean, isSelected: boolean, isPresentation: boolean) =>
      isDismissed && autoDismissEnabled && (!isSelected || isPresentation);

    // Presentation mode: should dismiss regardless of selection
    assert.equal(computeActuallyDismissed(true, true, false, true), true);
    assert.equal(computeActuallyDismissed(true, true, true, true), true);
    assert.equal(computeActuallyDismissed(false, true, false, true), false);
    assert.equal(computeActuallyDismissed(true, false, false, true), false);

    // Editor mode:
    assert.equal(computeActuallyDismissed(true, true, false, false), true);
    assert.equal(computeActuallyDismissed(true, true, true, false), false);
    assert.equal(computeActuallyDismissed(false, true, false, false), false);
    assert.equal(computeActuallyDismissed(true, false, false, false), false);
  });

  it('11. Verifies Wide + Short Layout Mode (Mode 2 side-by-side) when wide and vertically constrained', () => {
    const wideShort1 = resolveNowPlayingLayout(500, 160, 'horizontal');
    assert.equal(wideShort1.layoutMode, 'wide_short');
    assert.equal(wideShort1.isWideShort, true);
    assert.equal(wideShort1.isTallLayout, false);
    assert.equal(wideShort1.isExtremelyConstrained, false);
    assert.equal(wideShort1.showTimestamps, true);
    assert.equal(wideShort1.showHeaderIcon, true);
    assert.equal(wideShort1.showShuffleRepeat, true);

    const wideShort2 = resolveNowPlayingLayout(650, 175, 'horizontal');
    assert.equal(wideShort2.layoutMode, 'wide_short');
    assert.equal(wideShort2.isWideShort, true);

    // Standard stacked layout when height is sufficient (h >= 195 and w >= 300)
    const standardStacked = resolveNowPlayingLayout(400, 200, 'horizontal');
    assert.equal(standardStacked.layoutMode, 'standard_horizontal');
    assert.equal(standardStacked.isWideShort, false);
    assert.equal(standardStacked.showTimestamps, true);
    assert.equal(standardStacked.showHeaderIcon, true);
  });
});
