export const CANVAS_WIDTH = 1920;
export const CANVAS_HEIGHT = 1080;

// Focused full-app screen rect in Presentation Mode (Canvas Width minus padding, Canvas Height minus Header & Dock)
export const FOCUSED_APP_RECT = {
  x: 20,
  y: 48,
  width: CANVAS_WIDTH - 40, // 1880
  height: CANVAS_HEIGHT - 48 - 84, // 948
};
