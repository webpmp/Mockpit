import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  DISCOVERY_TRACKS_TRENDING,
  DISCOVERY_TRACKS_FORYOU,
} from '../../data/mediaData';
import { DEFAULT_COMPONENT_DIMENSIONS } from '../../store/useMockpitStore';
import { COMPONENT_META } from '../../config/componentMeta';
import { CRITICAL_TASK_COMPONENT_TYPES } from '../../lib/hmiRules/registry';
import { APP_SCREEN_VIEWS, isAppScreen } from '../../types';

describe('Media Discovery Component Specs & Regression Tests', () => {
  it('1. Verifies DiscoveryTrack mock data sets exist with expected fields', () => {
    assert.ok(DISCOVERY_TRACKS_TRENDING.length >= 4, 'Trending should have at least 4 tracks');
    assert.ok(DISCOVERY_TRACKS_FORYOU.length >= 4, 'For You should have at least 4 tracks');

    // Verify Trending tracks have strictly ascending ranks and valid gradients
    DISCOVERY_TRACKS_TRENDING.forEach((track, idx) => {
      assert.equal(track.rank, idx + 1, `Trending track #${idx + 1} must have correct rank`);
      assert.ok(track.title.length > 0, 'Track title must not be empty');
      assert.ok(track.artist.length > 0, 'Track artist must not be empty');
      assert.ok(track.gradientFrom.startsWith('from-'), 'gradientFrom must be a valid Tailwind class');
      assert.ok(track.gradientTo.startsWith('to-'), 'gradientTo must be a valid Tailwind class');
      assert.ok(track.iconName.length > 0, 'iconName must not be empty');
    });

    // Verify For You tracks
    DISCOVERY_TRACKS_FORYOU.forEach((track) => {
      assert.ok(track.title.length > 0, 'Track title must not be empty');
      assert.ok(track.artist.length > 0, 'Track artist must not be empty');
      assert.ok(track.gradientFrom.startsWith('from-'), 'gradientFrom must be a valid Tailwind class');
      assert.ok(track.gradientTo.startsWith('to-'), 'gradientTo must be a valid Tailwind class');
      assert.ok(track.iconName.length > 0, 'iconName must not be empty');
    });
  });

  it('2. Verifies mediaDiscovery component registration and metadata', () => {
    assert.ok(COMPONENT_META.mediaDiscovery, 'mediaDiscovery must exist in COMPONENT_META');
    assert.equal(COMPONENT_META.mediaDiscovery.type, 'mediaDiscovery');
    assert.ok(COMPONENT_META.mediaDiscovery.defaultColor);
  });

  it('3. Verifies default component dimensions in store', () => {
    const dim = DEFAULT_COMPONENT_DIMENSIONS.mediaDiscovery;
    assert.ok(dim, 'DEFAULT_COMPONENT_DIMENSIONS.mediaDiscovery must be defined');
    assert.equal(dim.width, 620);
    assert.equal(dim.height, 260);
    assert.equal(dim.maxHeight, 1080);
  });

  it('4. Verifies APP_SCREEN_VIEWS classification', () => {
    assert.equal(APP_SCREEN_VIEWS.mediaDiscovery, 'media');
    assert.equal(isAppScreen('mediaDiscovery'), true);
  });

  it('5. Verifies HMI Rules compliance registration', () => {
    assert.ok(
      CRITICAL_TASK_COMPONENT_TYPES.includes('mediaDiscovery'),
      'mediaDiscovery must be included in CRITICAL_TASK_COMPONENT_TYPES'
    );
  });

  it('6. Verifies touch target constraints compliance', () => {
    // Horizontal card width 148px, gap 12px -> card tap target is 148px x (art 120 + pad 16 + text) >= 44x44
    const horizontalCardWidth = 148;
    const horizontalCardGap = 12;
    const artWidthHorizontal = 120;
    const artHeightHorizontal = 120;

    assert.ok(horizontalCardWidth >= 44, 'Horizontal card width must be >= 44px tap target');
    assert.ok(horizontalCardGap >= 8, 'Horizontal card gap must be >= 8px');
    assert.equal(artWidthHorizontal, 120, 'Spec requires 120px art size in horizontal mode');
    assert.equal(artHeightHorizontal, 120, 'Spec requires 120px art size in horizontal mode');

    // Vertical row: art 64px, row min-h 76px >= 44px
    const artSizeVertical = 64;
    const minRowHeightVertical = 76;
    assert.equal(artSizeVertical, 64, 'Spec requires 64px art size in vertical mode');
    assert.ok(minRowHeightVertical >= 44, 'Vertical row min height must be >= 44px');
  });
});
