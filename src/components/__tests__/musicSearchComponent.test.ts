import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  MOCK_SEARCH_CATALOG,
  MOCK_NLU_LOOKUP,
} from '../../data/mediaData';
import { DEFAULT_COMPONENT_DIMENSIONS } from '../../store/useMockpitStore';
import { COMPONENT_META } from '../../config/componentMeta';
import { CRITICAL_TASK_COMPONENT_TYPES, HIGH_DEMAND_TASK_TYPES } from '../../lib/hmiRules/registry';
import { APP_SCREEN_VIEWS, isAppScreen } from '../../types';
import { COMPONENT_DISPLAY_NAMES } from '../../utils/componentDisplayNames';

describe('Music Search Component (Media Screen) v1.2 Specifications', () => {
  it('1. Verifies search catalog items and multi-source representation', () => {
    assert.ok(MOCK_SEARCH_CATALOG.length >= 10, 'Search catalog must have mock entries');

    const sources = new Set(MOCK_SEARCH_CATALOG.map((item) => item.source));
    assert.ok(sources.has('spotify'), 'Catalog must include Spotify');
    assert.ok(sources.has('apple_music'), 'Catalog must include Apple Music');
    assert.ok(sources.has('radio'), 'Catalog must include Radio');

    const contentTypes = new Set(MOCK_SEARCH_CATALOG.map((item) => item.contentType));
    assert.ok(contentTypes.has('music'), 'Catalog must include Music');
    assert.ok(contentTypes.has('podcast'), 'Catalog must include Podcasts');
    assert.ok(contentTypes.has('audiobook'), 'Catalog must include Audiobooks');
  });

  it('2. Verifies mock NLU lookup mappings', () => {
    assert.ok(MOCK_NLU_LOOKUP['indie rock'], 'Must support "indie rock" intent');
    assert.ok(MOCK_NLU_LOOKUP['workout hype'], 'Must support "workout hype" intent');
    assert.ok(MOCK_NLU_LOOKUP['something chill for the drive'], 'Must support "something chill for the drive" intent');
  });

  it('3. Verifies component metadata and registry registration', () => {
    assert.ok(COMPONENT_META.mediaSearch, 'mediaSearch must exist in COMPONENT_META');
    assert.equal(COMPONENT_META.mediaSearch.type, 'mediaSearch');
    assert.equal(COMPONENT_DISPLAY_NAMES.mediaSearch, 'Music Search');
  });

  it('4. Verifies default component dimensions for horizontal aspect ratio & min width', () => {
    const dim = DEFAULT_COMPONENT_DIMENSIONS.mediaSearch;
    assert.ok(dim, 'DEFAULT_COMPONENT_DIMENSIONS.mediaSearch must be defined');
    assert.equal(dim.width, 580);
    assert.equal(dim.height, 220);
  });

  it('5. Verifies APP_SCREEN_VIEWS classification', () => {
    assert.equal(APP_SCREEN_VIEWS.mediaSearch, 'media');
    assert.equal(isAppScreen('mediaSearch'), true);
  });

  it('6. Verifies HMI Rules compliance registration', () => {
    assert.ok(
      CRITICAL_TASK_COMPONENT_TYPES.includes('mediaSearch'),
      'mediaSearch must be in CRITICAL_TASK_COMPONENT_TYPES'
    );
    assert.ok(
      HIGH_DEMAND_TASK_TYPES.includes('mediaSearch'),
      'mediaSearch must be in HIGH_DEMAND_TASK_TYPES'
    );
  });

  it('7. Verifies zero animate-pulse in MusicSearchWidget source code (strict requirement)', () => {
    const filePath = path.resolve(process.cwd(), 'src/components/MusicSearchWidget.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');
    assert.equal(
      content.includes('animate-pulse'),
      false,
      'MusicSearchWidget must not contain animate-pulse'
    );
  });
});
