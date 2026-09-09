import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Copyright Attribution + About Overlay Suite', () => {
  it('1. LICENSE file exists at repo root and contains proprietary terms', () => {
    const licensePath = path.resolve(process.cwd(), 'LICENSE');
    assert.ok(fs.existsSync(licensePath), 'LICENSE file must exist at repo root');
    const content = fs.readFileSync(licensePath, 'utf8');
    assert.match(content, /Copyright \(c\) 2026 Chris Adkins\. All Rights Reserved\./);
    assert.match(content, /proprietary/);
    assert.doesNotMatch(content, /MIT License/);
  });

  it('2. package.json specifies author and UNLICENSED', () => {
    const pkgPath = path.resolve(process.cwd(), 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    assert.equal(pkg.author, 'Chris Adkins');
    assert.equal(pkg.license, 'UNLICENSED');
  });

  it('3. index.html contains copyright meta tag', () => {
    const htmlPath = path.resolve(process.cwd(), 'index.html');
    const html = fs.readFileSync(htmlPath, 'utf8');
    assert.match(html, /<meta\s+name=["']copyright["']\s+content=["']Copyright \(c\) 2026 Chris Adkins\. All Rights Reserved\.["']\s*\/>/);
  });

  it('4. main.tsx contains copyright header comment and boot console log', () => {
    const mainPath = path.resolve(process.cwd(), 'src/main.tsx');
    const mainContent = fs.readFileSync(mainPath, 'utf8');
    assert.match(mainContent, /Copyright \(c\) 2026 Chris Adkins\. All Rights Reserved\./);
    assert.match(mainContent, /console\.log\(['"]Mockpit © 2026 Chris Adkins\. All Rights Reserved\.['"]\)/);
  });

  it('5. AboutModal contains required details and renders above Bottom Dock (z-[10000])', () => {
    const modalPath = path.resolve(process.cwd(), 'src/components/AboutModal.tsx');
    assert.ok(fs.existsSync(modalPath), 'AboutModal.tsx must exist');
    const modalContent = fs.readFileSync(modalPath, 'utf8');

    // Title (v1.1 patch: "Mockpit" with no "About" prefix)
    assert.match(modalContent, /<h2[^>]*>\s*Mockpit\s*<\/h2>/);
    assert.doesNotMatch(modalContent, /About Mockpit/);
    // Name
    assert.match(modalContent, /Chris Adkins/);
    // Email
    assert.match(modalContent, /webpmp@gmail\.com/);
    // Repo
    assert.match(modalContent, /https:\/\/github\.com\/webpmp\/Mockpit/);
    assert.match(modalContent, /target="_blank"/);
    // Copyright
    assert.match(modalContent, /© 2026 Chris Adkins\. All Rights Reserved\./);
    // Layering above Bottom Dock
    assert.match(modalContent, /z-\[10000\]/);
  });

  it('6. HeaderNav provides logo trigger with >= 44x44px minimum tap target in both modes', () => {
    const headerPath = path.resolve(process.cwd(), 'src/components/HeaderNav.tsx');
    const headerContent = fs.readFileSync(headerPath, 'utf8');

    assert.match(headerContent, /id="mockpit-about-trigger"/);
    assert.match(headerContent, /min-h-\[44px\]/);
    assert.match(headerContent, /min-w-\[44px\]/);
    assert.match(headerContent, /cursor-pointer/);
    assert.doesNotMatch(headerContent, /animate-pulse/);
    // Must not be gated by !isPresentation
    const logoBlockRegex = /\{!isPresentation\s*&&\s*\(?\s*<button[^>]*id="mockpit-about-trigger"/;
    assert.equal(logoBlockRegex.test(headerContent), false, 'Trigger must not be gated behind !isPresentation');
  });
});
