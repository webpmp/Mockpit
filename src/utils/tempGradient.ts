export interface TempGradientColors {
  cold: string;
  neutral: string;
  hot: string;
}

export const DEFAULT_TEMP_GRADIENT_COLORS: TempGradientColors = {
  cold: '#38bdf8',
  neutral: '#94a3b8',
  hot: '#ef4444',
};

export function interpolateColorHex(color1: string, color2: string, factor: number): string {
  const f = Math.max(0, Math.min(1, factor));
  const parse = (hex: string) => {
    let clean = (hex || '#000000').replace('#', '');
    if (clean.length === 3) clean = clean.split('').map((c) => c + c).join('');
    const num = parseInt(clean, 16) || 0;
    return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
  };
  const c1 = parse(color1);
  const c2 = parse(color2);
  const r = Math.round(c1.r + f * (c2.r - c1.r));
  const g = Math.round(c1.g + f * (c2.g - c1.g));
  const b = Math.round(c1.b + f * (c2.b - c1.b));
  return `rgb(${r}, ${g}, ${b})`;
}

export function getTemperatureColor(
  temp: number,
  minTemp: number,
  maxTemp: number,
  colors: TempGradientColors = DEFAULT_TEMP_GRADIENT_COLORS
): string {
  const comfortTemp = Math.min(maxTemp - 1, Math.max(minTemp + 1, 72));
  if (temp <= comfortTemp) {
    const range = comfortTemp - minTemp;
    const ratio = range > 0 ? (temp - minTemp) / range : 0;
    return interpolateColorHex(colors.cold, colors.neutral, ratio);
  } else {
    const range = maxTemp - comfortTemp;
    const ratio = range > 0 ? (temp - comfortTemp) / range : 0;
    return interpolateColorHex(colors.neutral, colors.hot, ratio);
  }
}
