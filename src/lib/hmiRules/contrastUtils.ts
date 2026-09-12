/**
 * WCAG 2.1 Contrast & Relative Luminance Utilities
 */

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let clean = hex.trim().replace(/^#/, '');
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  if (clean.length === 8) {
    clean = clean.slice(0, 6);
  }
  if (clean.length !== 6) {
    return { r: 226, g: 232, b: 240 }; // #e2e8f0 fallback
  }
  const num = parseInt(clean, 16);
  if (isNaN(num)) {
    return { r: 226, g: 232, b: 240 };
  }
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function relativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function wcagContrastRatio(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}
