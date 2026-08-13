const AVATAR_PALETTE = [
  '#0284c7', // Sky
  '#059669', // Emerald
  '#7c3aed', // Violet
  '#ea580c', // Orange
  '#db2777', // Pink
  '#2563eb', // Blue
  '#d97706', // Amber
  '#0d9488', // Teal
  '#9333ea', // Purple
  '#c026d3', // Fuchsia
];

export function getAvatarColor(name: string): string {
  if (!name) return AVATAR_PALETTE[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_PALETTE.length;
  return AVATAR_PALETTE[index];
}

export function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
