import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { formatMediaTime, SAMPLE_TRACKS } from '../../data/mediaData';
import { resolveNowPlayingLayout } from '../../utils/nowPlayingLayout';

describe('Now Playing Timestamps Row & Music Player Visual Parity Suite', () => {
  it('1. Formats elapsed playback time and total track duration identically to MusicMediaPlayer', () => {
    // Example from user specification: 1:42 left, 3:50 right
    assert.equal(formatMediaTime(102), '1:42');
    assert.equal(formatMediaTime(230), '3:50');

    // Edge cases
    assert.equal(formatMediaTime(0), '0:00');
    assert.equal(formatMediaTime(5), '0:05');
    assert.equal(formatMediaTime(60), '1:00');
    assert.equal(formatMediaTime(3599), '59:59');
    assert.equal(formatMediaTime(3665), '1:01:05');
  });

  it('2. Formats all sample tracks correctly', () => {
    SAMPLE_TRACKS.forEach((track) => {
      const formatted = formatMediaTime(track.durationSec);
      assert.equal(formatted, track.duration, `Track ${track.id} (${track.title}) duration string must match formatMediaTime`);
    });
  });

  it('3. Timestamps stay in sync with playback progress states and seek scrubbing', () => {
    const track = SAMPLE_TRACKS[0]; // durationSec: 230
    let progressSec = 0;
    assert.equal(formatMediaTime(progressSec), '0:00');
    assert.equal(formatMediaTime(track.durationSec), '3:50');

    // Simulate seeking to 50%
    progressSec = Math.round(track.durationSec * 0.5); // 115s -> 1:55
    assert.equal(formatMediaTime(progressSec), '1:55');

    // Simulate seeking to 102s
    progressSec = 102;
    assert.equal(formatMediaTime(progressSec), '1:42');
  });

  it('4. Resolves showTimestamps accurately across standard horizontal, tall, and constrained layouts', () => {
    // Standard horizontal (e.g. 420x180, 400x200)
    const stdLayout = resolveNowPlayingLayout(420, 180, 'horizontal');
    assert.equal(stdLayout.showTimestamps, true);

    // Tall layouts with sufficient height (e.g. 264x352, 280x300)
    const tallLayout = resolveNowPlayingLayout(264, 352, 'horizontal');
    assert.equal(tallLayout.showTimestamps, true);

    // Constrained compact layout (e.g. 264x180) sheds timestamps first to prevent clipping
    const compactLayout = resolveNowPlayingLayout(264, 180, 'horizontal');
    assert.equal(compactLayout.showTimestamps, false);

    // Single-row constrained (h < 125) surrenders timestamps gracefully
    const constrainedLayout = resolveNowPlayingLayout(264, 110, 'horizontal');
    assert.equal(constrainedLayout.showTimestamps, false);
  });
});
