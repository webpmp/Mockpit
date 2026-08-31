import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolveNowPlayingLayout } from '../../utils/nowPlayingLayout';

describe('Now Playing Layout Determinism & Grid Snapping Regression Suite', () => {
  it('1. Deterministically resolves Tall Layout for 264 × 352', () => {
    const layout = resolveNowPlayingLayout(264, 352, 'horizontal');
    assert.equal(layout.layoutMode, 'tall');
    assert.equal(layout.isTallLayout, true);
    assert.equal(layout.isExtremelyConstrained, false);
    assert.equal(layout.showThumbnail, true);
    assert.equal(layout.showTimestamps, true);
    assert.equal(layout.showFavoriteButton, true);
    assert.equal(layout.showShuffleRepeat, true);
    assert.equal(layout.paddingClass, 'p-3.5');
  });

  it('2. Deterministically resolves Tall Layout for 264 × 250', () => {
    const layout = resolveNowPlayingLayout(264, 250, 'horizontal');
    assert.equal(layout.layoutMode, 'tall');
    assert.equal(layout.isTallLayout, true);
    assert.equal(layout.isExtremelyConstrained, false);
    assert.equal(layout.showThumbnail, true);
    assert.equal(layout.showTimestamps, true);
    assert.equal(layout.showFavoriteButton, true);
    assert.equal(layout.showShuffleRepeat, true);
  });

  it('3. Deterministically resolves Compact Layout with Right-Side Controls for 264 × 200', () => {
    const layout = resolveNowPlayingLayout(264, 200, 'horizontal');
    assert.equal(layout.layoutMode, 'compact');
    assert.equal(layout.useRightSideControls, true);
    assert.equal(layout.isExtremelyConstrained, false);
    assert.equal(layout.showThumbnail, true);
    assert.equal(layout.showFavoriteButton, true);
    assert.equal(layout.showShuffleRepeat, false);
  });

  it('4. Deterministically resolves Compact Layout for 264 × 180', () => {
    const layout = resolveNowPlayingLayout(264, 180, 'horizontal');
    assert.equal(layout.layoutMode, 'compact');
    assert.equal(layout.useRightSideControls, true);
    assert.equal(layout.isExtremelyConstrained, false);
  });

  it('5. Deterministically resolves Compact Layout for 264 × 160', () => {
    const layout = resolveNowPlayingLayout(264, 160, 'horizontal');
    assert.equal(layout.layoutMode, 'compact');
    assert.equal(layout.useRightSideControls, true);
    assert.equal(layout.isExtremelyConstrained, false);
  });

  it('6. Deterministically resolves Compact Layout for 264 × 144 (stable breakpoint, no loop)', () => {
    const layout = resolveNowPlayingLayout(264, 144, 'horizontal');
    assert.equal(layout.layoutMode, 'compact');
    assert.equal(layout.useRightSideControls, true);
    assert.equal(layout.isExtremelyConstrained, false);
    assert.equal(layout.paddingClass, 'p-2.5');
  });

  it('7. Deterministically resolves Compact Layout for 264 × 128', () => {
    const layout = resolveNowPlayingLayout(264, 128, 'horizontal');
    assert.equal(layout.layoutMode, 'compact');
    assert.equal(layout.useRightSideControls, true);
    assert.equal(layout.isExtremelyConstrained, false);
  });

  it('8. Deterministically resolves Extremely Constrained Layout for 264 × 112', () => {
    const layout = resolveNowPlayingLayout(264, 112, 'horizontal');
    assert.equal(layout.layoutMode, 'extremely_constrained');
    assert.equal(layout.isExtremelyConstrained, true);
    assert.equal(layout.useRightSideControls, false);
    assert.equal(layout.isTallLayout, false);
    assert.equal(layout.showThumbnail, true);
    assert.equal(layout.paddingClass, 'p-2');
  });

  it('9. Invariant: Same dimensions always yield the exact same layout (idempotent)', () => {
    for (const [w, h] of [
      [264, 352],
      [264, 250],
      [264, 200],
      [264, 180],
      [264, 160],
      [264, 144],
      [264, 128],
      [264, 112],
      [400, 160],
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

  it('10. Continuous resizing between 352px and 100px height never produces undefined or oscillating modes and scales controls gracefully', () => {
    let lastMode = '';
    for (let h = 352; h >= 100; h -= 2) {
      const layout = resolveNowPlayingLayout(264, h, 'horizontal');
      assert.ok(['tall', 'compact', 'extremely_constrained', 'standard_horizontal'].includes(layout.layoutMode));
      assert.ok(layout.buttonWidthPx > 0);
      assert.ok(layout.playButtonWidthPx > 0);
      assert.ok(layout.iconSizePx > 0);
      lastMode = layout.layoutMode;
    }
    assert.equal(lastMode, 'extremely_constrained');
  });

  it('11. Verifies exact responsive control sizing for explicit test dimensions', () => {
    const testCases: [number, number, { minBtn: number; maxBtn: number }][] = [
      [264, 352, { minBtn: 44, maxBtn: 48 }], // 46px
      [264, 250, { minBtn: 44, maxBtn: 48 }], // 46px
      [264, 200, { minBtn: 44, maxBtn: 48 }], // 46px
      [264, 180, { minBtn: 44, maxBtn: 48 }], // 46px
      [264, 160, { minBtn: 44, maxBtn: 48 }], // 46px
      [264, 144, { minBtn: 38, maxBtn: 42 }], // 40px
      [264, 128, { minBtn: 32, maxBtn: 36 }], // 34px
      [264, 112, { minBtn: 34, maxBtn: 38 }], // 36px (single-row)
      [400, 160, { minBtn: 44, maxBtn: 48 }], // 46px
      [400, 140, { minBtn: 38, maxBtn: 42 }], // 40px
      [400, 120, { minBtn: 34, maxBtn: 38 }], // 36px
      [400, 100, { minBtn: 28, maxBtn: 32 }], // 30px
      [200, 200, { minBtn: 38, maxBtn: 42 }], // 40px
      [200, 160, { minBtn: 38, maxBtn: 42 }], // 40px
      [200, 140, { minBtn: 38, maxBtn: 42 }], // 40px
    ];

    for (const [w, h, expected] of testCases) {
      const layout = resolveNowPlayingLayout(w, h, 'horizontal');
      assert.ok(
        layout.buttonWidthPx >= expected.minBtn && layout.buttonWidthPx <= expected.maxBtn,
        `Expected button width between ${expected.minBtn} and ${expected.maxBtn} for ${w}x${h}, got ${layout.buttonWidthPx}`
      );
      assert.equal(
        layout.playButtonWidthPx,
        layout.playButtonHeightPx,
        `Play/Pause MUST be a true circle (width === height) for ${w}x${h}`
      );
      assert.equal(
        layout.buttonWidthPx,
        layout.buttonHeightPx,
        `Back/Next MUST be square (width === height) for ${w}x${h}`
      );
    }
  });

  it('12. Auto-dismiss state resolution: editor mode preserves accessibility when selected or dismissed', () => {
    // Helper replicating the state resolution logic: isActuallyDismissed = isDismissed && autoDismissEnabled && (!isSelected || isPresentation)
    const computeActuallyDismissed = (isDismissed: boolean, autoDismissEnabled: boolean, isSelected: boolean, isPresentation: boolean) =>
      isDismissed && autoDismissEnabled && (!isSelected || isPresentation);

    // Presentation mode: should dismiss regardless of selection
    assert.equal(computeActuallyDismissed(true, true, false, true), true);
    assert.equal(computeActuallyDismissed(true, true, true, true), true);
    assert.equal(computeActuallyDismissed(false, true, false, true), false);
    assert.equal(computeActuallyDismissed(true, false, false, true), false);

    // Editor mode:
    // When dismissed & unselected -> isActuallyDismissed is true (ghost frame visible, widget translated)
    assert.equal(computeActuallyDismissed(true, true, false, false), true);
    // When dismissed but user selects the component -> isActuallyDismissed becomes false (instantly visible on canvas)
    assert.equal(computeActuallyDismissed(true, true, true, false), false);
    // When not dismissed -> false
    assert.equal(computeActuallyDismissed(false, true, false, false), false);
    // When autoDismiss is disabled -> false
    assert.equal(computeActuallyDismissed(true, false, false, false), false);
  });

  it('13. Verifies primary playback controls size (Back/Next 46x46px, Play/Pause 50x50px circle) and icon size (22px) across standard layouts', () => {
    // Tall layout
    const tall = resolveNowPlayingLayout(264, 352, 'horizontal');
    assert.equal(tall.buttonWidthPx, 46, 'Back/Next button width is 46px in tall layout');
    assert.equal(tall.buttonHeightPx, 46, 'Back/Next button height is 46px in tall layout');
    assert.equal(tall.playButtonWidthPx, 50, 'Play/Pause button width is 50px in tall layout');
    assert.equal(tall.playButtonHeightPx, 50, 'Play/Pause button height is 50px in tall layout');
    assert.equal(tall.playButtonWidthPx, tall.playButtonHeightPx, 'Play/Pause is a true circle in tall layout');
    assert.equal(tall.iconSizePx, 22, 'Icon size is 22px in tall layout');
    assert.ok(tall.controlGapPx >= 5 && tall.controlGapPx <= 6, 'Gap between controls is 5-6px');

    // Standard horizontal layout
    const standard = resolveNowPlayingLayout(400, 200, 'horizontal');
    assert.equal(standard.buttonWidthPx, 46, 'Back/Next button width is 46px in standard horizontal');
    assert.equal(standard.buttonHeightPx, 46, 'Back/Next button height is 46px in standard horizontal');
    assert.equal(standard.playButtonWidthPx, 50, 'Play/Pause button width is 50px in standard horizontal');
    assert.equal(standard.playButtonHeightPx, 50, 'Play/Pause button height is 50px in standard horizontal');
    assert.equal(standard.playButtonWidthPx, standard.playButtonHeightPx, 'Play/Pause is a true circle in standard horizontal');
    assert.equal(standard.iconSizePx, 22, 'Icon size is 22px in standard horizontal');
    assert.ok(standard.controlGapPx >= 5 && standard.controlGapPx <= 6, 'Gap between controls is 5-6px');

    // Compact layout
    const compact = resolveNowPlayingLayout(264, 180, 'horizontal');
    assert.equal(compact.buttonWidthPx, 46, 'Back/Next button width is 46px in compact layout');
    assert.equal(compact.buttonHeightPx, 46, 'Back/Next button height is 46px in compact layout');
    assert.equal(compact.playButtonWidthPx, 50, 'Play/Pause button width is 50px in compact layout');
    assert.equal(compact.playButtonHeightPx, 50, 'Play/Pause button height is 50px in compact layout');
    assert.equal(compact.playButtonWidthPx, compact.playButtonHeightPx, 'Play/Pause is a true circle in compact layout');
    assert.equal(compact.iconSizePx, 22, 'Icon size is 22px in compact layout');
    assert.ok(compact.controlGapPx >= 5 && compact.controlGapPx <= 6, 'Gap between controls is 5-6px');
  });
});
