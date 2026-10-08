import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('StartupVideo: public video asset exists and is accessible', () => {
  const videoPath = path.resolve(process.cwd(), 'public/mockpit-intro-v4.mp4');
  assert.ok(fs.existsSync(videoPath), 'public/mockpit-intro-v4.mp4 must exist');
  const stat = fs.statSync(videoPath);
  assert.ok(stat.size > 0, 'mockpit-intro-v4.mp4 must not be empty');
});

test('StartupVideo: component implementation conforms to audio and autoplay requirements', () => {
  const componentPath = path.resolve(process.cwd(), 'src/components/StartupVideo.tsx');
  assert.ok(fs.existsSync(componentPath), 'StartupVideo.tsx component must exist');

  const content = fs.readFileSync(componentPath, 'utf8');

  // Video source referenced as /mockpit-intro-v4.mp4
  assert.match(content, /src=["']\/mockpit-intro-v4\.mp4["']/, 'Must reference /mockpit-intro-v4.mp4');

  // Autoplay attributes: autoPlay, playsInline, NO loop, NO controls prop on video element
  assert.match(content, /autoPlay/, 'Must include autoPlay');
  assert.match(content, /playsInline/, 'Must include playsInline');

  // Inspect the <video ... /> tag specifically
  const videoTagMatch = content.match(/<video[\s\S]*?\/>/);
  assert.ok(videoTagMatch, 'Must render <video /> tag');
  assert.doesNotMatch(videoTagMatch[0], /\bcontrols\b/, 'Video element must not enable native controls');
  assert.doesNotMatch(videoTagMatch[0], /\bloop\b/, 'Video element must not loop');

  // Must not permanently force static muted attribute
  assert.doesNotMatch(videoTagMatch[0], /muted\s*=\s*\{?true\}?(?![a-zA-Z0-9_])/, 'Must not hardcode muted=true');

  // Video attempts unmuted playback first
  assert.match(content, /video\.muted\s*=\s*false/, 'Must attempt unmuted playback first');
  assert.match(content, /video\.play\(\)/, 'Must invoke video.play() explicitly');

  // Handles unmuted autoplay rejection with muted fallback
  assert.match(content, /video\.muted\s*=\s*true/, 'Must fall back to muted if unmuted autoplay is rejected');

  // Aspect ratio preserved (object-contain) and centered
  assert.match(content, /object-contain/, 'Must maintain natural aspect ratio using object-contain');
  assert.match(content, /items-center/, 'Must be centered vertically');
  assert.match(content, /justify-center/, 'Must be centered horizontally');

  // Smooth fade-out duration
  assert.match(content, /duration-600/, 'Must feature smooth 600ms fade transition');
});

test('StartupVideo: App.tsx mounts StartupVideo on initial application load', () => {
  const appPath = path.resolve(process.cwd(), 'src/App.tsx');
  const content = fs.readFileSync(appPath, 'utf8');

  assert.match(content, /import\s*\{\s*StartupVideo\s*\}\s*from\s*['"]\.\/components\/StartupVideo['"]/, 'App.tsx must import StartupVideo');
  assert.match(content, /<StartupVideo/, 'App.tsx must mount StartupVideo');
  assert.match(content, /showStartupVideo/, 'App.tsx must track showStartupVideo state');
});
