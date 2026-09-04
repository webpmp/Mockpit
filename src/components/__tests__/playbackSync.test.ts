import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { useMockpitStore } from '../../store/useMockpitStore';
import { SAMPLE_TRACKS } from '../../data/mediaData';

describe('Shared Playback State Sync Suite (v1)', () => {
  beforeEach(() => {
    useMockpitStore.getState().resetToSeedData();
  });

  it('1. Initializes playback state with valid defaults', () => {
    const state = useMockpitStore.getState();
    assert.ok(state.currentTrackId, 'currentTrackId should be set');
    assert.ok(
      SAMPLE_TRACKS.some((t) => t.id === state.currentTrackId),
      'currentTrackId must match a sample track'
    );
    assert.equal(typeof state.isPlaying, 'boolean');
    assert.equal(typeof state.progressSec, 'number');
    assert.ok(Array.isArray(state.favoritedTrackIds), 'favoritedTrackIds must be an array');
  });

  it('2. Selecting a track updates currentTrackId, resets progress, and sets isPlaying to true', () => {
    const targetTrack = SAMPLE_TRACKS[2];
    useMockpitStore.getState().setCurrentTrack(targetTrack.id);

    const state = useMockpitStore.getState();
    assert.equal(state.currentTrackId, targetTrack.id);
    assert.equal(state.progressSec, 0);
    assert.equal(state.isPlaying, true);
  });

  it('3. togglePlay toggles isPlaying and setIsPlaying sets it explicitly', () => {
    const initialPlaying = useMockpitStore.getState().isPlaying;
    useMockpitStore.getState().togglePlay();
    assert.equal(useMockpitStore.getState().isPlaying, !initialPlaying);

    useMockpitStore.getState().setIsPlaying(true);
    assert.equal(useMockpitStore.getState().isPlaying, true);

    useMockpitStore.getState().setIsPlaying(false);
    assert.equal(useMockpitStore.getState().isPlaying, false);
  });

  it('4. seekTo updates progressSec clamped to minimum 0', () => {
    useMockpitStore.getState().seekTo(45);
    assert.equal(useMockpitStore.getState().progressSec, 45);

    useMockpitStore.getState().seekTo(-10);
    assert.equal(useMockpitStore.getState().progressSec, 0);
  });

  it('5. nextTrack and prevTrack cycle through tracks in order', () => {
    useMockpitStore.getState().setCurrentTrack(SAMPLE_TRACKS[0].id);

    useMockpitStore.getState().nextTrack();
    assert.equal(useMockpitStore.getState().currentTrackId, SAMPLE_TRACKS[1].id);
    assert.equal(useMockpitStore.getState().progressSec, 0);
    assert.equal(useMockpitStore.getState().isPlaying, true);

    useMockpitStore.getState().prevTrack();
    assert.equal(useMockpitStore.getState().currentTrackId, SAMPLE_TRACKS[0].id);

    // Prev from 0 wraps to last track
    useMockpitStore.getState().prevTrack();
    assert.equal(
      useMockpitStore.getState().currentTrackId,
      SAMPLE_TRACKS[SAMPLE_TRACKS.length - 1].id
    );
  });

  it('6. toggleFavorite adds and removes track IDs consistently', () => {
    const testTrackId = 'test-track-sync';
    const initialFavs = useMockpitStore.getState().favoritedTrackIds;
    assert.ok(!initialFavs.includes(testTrackId));

    useMockpitStore.getState().toggleFavorite(testTrackId);
    assert.ok(useMockpitStore.getState().favoritedTrackIds.includes(testTrackId));

    useMockpitStore.getState().toggleFavorite(testTrackId);
    assert.ok(!useMockpitStore.getState().favoritedTrackIds.includes(testTrackId));
  });
});
