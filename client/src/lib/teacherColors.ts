const CALENDAR_COLORS = [
  "#4285F4", // Google Blue
  "#EA4335", // Google Red
  "#FBBC04", // Google Yellow
  "#34A853", // Google Green
  "#FF6D01", // Orange
  "#46BDC6", // Teal
  "#7986CB", // Indigo
  "#8E24AA", // Purple
  "#E91E63", // Pink
  "#795548", // Brown
  "#607D8B", // Blue Grey
  "#00BCD4", // Cyan
];

export function getTeacherColor(teacherId: string, calendarColor?: string | null): string {
  if (calendarColor) {
    return calendarColor;
  }
  
  let hash = 0;
  for (let i = 0; i < teacherId.length; i++) {
    const char = teacherId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  const index = Math.abs(hash) % CALENDAR_COLORS.length;
  return CALENDAR_COLORS[index];
}

export function getTeacherColorStyles(color: string): { background: string; border: string; text: string } {
  return {
    background: `${color}15`,
    border: color,
    text: color,
  };
}

export function getContrastColor(hexColor: string): string {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
}

export { CALENDAR_COLORS };
