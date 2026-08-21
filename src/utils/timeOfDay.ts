export function isCurrentlyAM(): boolean {
  return new Date().getHours() < 12;
}
