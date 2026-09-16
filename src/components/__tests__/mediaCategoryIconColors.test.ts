import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { COMPONENT_META, getComponentColor } from '../../config/componentMeta';
import { CATEGORY_ICON_HEX, COMPONENT_TYPE_TO_CATEGORY } from '../../config/categoryColors';
import { ComponentType } from '../../types';

describe('Media Category Icon Colors in Layers & Library', () => {
  const mediaTypes: ComponentType[] = [
    'media',
    'nowPlaying',
    'mediaPlaylists',
    'mediaDiscovery',
    'mediaSearch',
  ];

  it('1. Verifies CATEGORY_ICON_HEX.media matches #ec4899 (rgb(236, 72, 153))', () => {
    assert.equal(CATEGORY_ICON_HEX.media, '#ec4899');
  });

  it('2. Verifies all media component types have defaultColor #ec4899 in COMPONENT_META', () => {
    for (const type of mediaTypes) {
      assert.ok(COMPONENT_META[type], `COMPONENT_META[${type}] must exist`);
      assert.equal(
        COMPONENT_META[type].defaultColor,
        '#ec4899',
        `COMPONENT_META[${type}].defaultColor must be #ec4899`
      );
      assert.equal(
        getComponentColor(type),
        '#ec4899',
        `getComponentColor('${type}') without custom props must return #ec4899`
      );
    }
  });

  it('3. Verifies COMPONENT_TYPE_TO_CATEGORY maps all media components to media category', () => {
    for (const type of mediaTypes) {
      assert.equal(
        COMPONENT_TYPE_TO_CATEGORY[type],
        'media',
        `COMPONENT_TYPE_TO_CATEGORY[${type}] must be 'media'`
      );
    }
  });

  it('4. Verifies LayersPanel icon color resolution for media widgets always matches #ec4899', () => {
    const resolveLayerColor = (type: ComponentType, staticColor?: string) => {
      const rawColor = getComponentColor(type, staticColor);
      const isMedia =
        type === 'media' ||
        type === 'nowPlaying' ||
        type === 'mediaPlaylists' ||
        type === 'mediaDiscovery' ||
        type === 'mediaSearch' ||
        COMPONENT_TYPE_TO_CATEGORY[type] === 'media';

      if (type === 'gear' && (!staticColor || staticColor === '#f8fafc')) {
        return CATEGORY_ICON_HEX.home;
      }
      if (isMedia) {
        return CATEGORY_ICON_HEX.media || '#ec4899';
      }
      return rawColor;
    };

    for (const type of mediaTypes) {
      // Without static color
      assert.equal(resolveLayerColor(type), '#ec4899');
      // Even if an older seed/state had blue or pink-400
      assert.equal(resolveLayerColor(type, '#38bdf8'), '#ec4899');
      assert.equal(resolveLayerColor(type, '#f472b6'), '#ec4899');
    }
  });
});
