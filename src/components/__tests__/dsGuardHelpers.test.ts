import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { findRawColors, findMarkerErrors } from './dsGuardHelpers';

describe('Design System Guard Scanner Suite (Spec 2.1)', () => {
  it('flags raw palette classes and hex literals', () => {
    assert.equal(findRawColors('<div className="bg-slate-900" />').length, 1);
    assert.equal(findRawColors('<button className="hover:text-sky-400" />').length, 1);
    assert.equal(findRawColors('<span className="shadow-[0_0_6px_#34d399]" />').length, 1);
    assert.equal(findRawColors('<div className="bg-sky-500/40" />').length, 1);
  });

  it('ignores design system roles, black/white, CSS var fallbacks, and black rgba', () => {
    assert.equal(findRawColors('<div className="bg-ds-surface" />').length, 0);
    assert.equal(findRawColors('<span className="text-white" />').length, 0);
    assert.equal(findRawColors('<div className="bg-black/30" />').length, 0);
    assert.equal(findRawColors('style={{ color: "var(--color-primary, #38bdf8)" }}').length, 0);
    assert.equal(findRawColors('className="shadow-[0_10px_30px_rgba(0,0,0,0.8)]"').length, 0);
  });

  it('ignores a raw class wrapped in valid markers', () => {
    const marked = `
      {/* ds-raw-start: editor control with own fill */}
      <div className="bg-slate-900 text-sky-400 border border-slate-700" />
      {/* ds-raw-end */}
    `;
    assert.equal(findRawColors(marked).length, 0);
    assert.equal(findMarkerErrors(marked).length, 0);
  });

  it('flags unmatched ds-raw-start', () => {
    const unclosed = `
      {/* ds-raw-start: editor control */}
      <div className="bg-slate-900" />
    `;
    const errors = findMarkerErrors(unclosed);
    assert.equal(errors.length, 1);
    assert.ok(errors[0].includes('Unmatched ds-raw-start'));
  });

  it('flags unmatched ds-raw-end', () => {
    const strayEnd = `
      <div className="bg-ds-surface" />
      {/* ds-raw-end */}
    `;
    const errors = findMarkerErrors(strayEnd);
    assert.equal(errors.length, 1);
    assert.ok(errors[0].includes('ds-raw-end without matching ds-raw-start'));
  });

  it('negative test: deliberately raw string fails with findings', () => {
    const rawSnippet = `
      export const BadWidget = () => (
        <div className="bg-slate-900 text-sky-400 border border-rose-500/80">
          <span style={{ color: '#f59e0b' }}>Warning</span>
        </div>
      );
    `;
    const findings = findRawColors(rawSnippet);
    assert.ok(findings.length >= 2, 'Deliberately raw string must fail with multiple findings');
    assert.ok(findings.some((f) => f.text.includes('bg-slate-900')));
    assert.ok(findings.some((f) => f.text.includes('#f59e0b')));
  });
});
