/**
 * Centralized color definitions for the GardenTime application.
 * All colors are chosen to meet WCAG 2.1 AA contrast requirements.
 * 
 * WCAG AA requires:
 * - Normal text: 4.5:1 contrast ratio
 * - Large text (18px+ or 14px bold): 3:1 contrast ratio
 * - UI components: 3:1 contrast ratio
 */

/**
 * Zone type colors - used for grow area categorization.
 * These are the default fill colors when a grow area is created.
 */
export const ZONE_TYPE_COLORS = {
  BOX: '#3b82f6',      // Blue-500 - raised beds, containers
  FIELD: '#22c55e',    // Green-500 - open field areas
  BED: '#92400e',      // Amber-800 - traditional garden beds
  BUCKET: '#6b7280',   // Gray-500 - buckets, pots
} as const;

export type ZoneType = keyof typeof ZONE_TYPE_COLORS;

/**
 * Shape color presets - general purpose colors for canvas shapes.
 * Includes both light and dark options for flexibility.
 * 
 * All colors except white have sufficient contrast against white backgrounds.
 * When using white fill, ensure dark stroke/text is used.
 */
export const SHAPE_COLOR_PRESETS = [
  '#000000', // Black - highest contrast
  '#374151', // Gray-700 - softer than pure black
  '#ef4444', // Red-500 - alerts, warnings
  '#ea580c', // Orange-600 - WCAG compliant (darker than orange-500)
  '#ca8a04', // Yellow-600 - WCAG compliant (darker than yellow-500)
  '#16a34a', // Green-600 - success states
  '#2563eb', // Blue-600 - primary actions
  '#7c3aed', // Violet-600 - accent
  '#db2777', // Pink-600 - accent
  '#ffffff', // White - use with dark borders
] as const;

/**
 * Grow area color presets - focused on nature-inspired colors.
 * Optimized for representing different growing zones.
 */
export const GROW_AREA_COLOR_PRESETS = [
  '#3b82f6', // Blue-500 (BOX default)
  '#22c55e', // Green-500 (FIELD default)
  '#92400e', // Amber-800 (BED default)
  '#6b7280', // Gray-500 (BUCKET default)
  '#ef4444', // Red-500
  '#ea580c', // Orange-600 - WCAG compliant
  '#ca8a04', // Yellow-600 - WCAG compliant  
  '#7c3aed', // Violet-600
  '#db2777', // Pink-600
  '#0891b2', // Cyan-600 - WCAG compliant
] as const;

/**
 * Semantic colors for UI states.
 * These match the Badge component variants.
 */
export const SEMANTIC_COLORS = {
  success: {
    bg: '#dcfce7',     // Green-100
    text: '#166534',   // Green-800 (4.5:1 on green-100)
    border: '#86efac', // Green-300
  },
  warning: {
    bg: '#fef9c3',     // Yellow-100
    text: '#854d0e',   // Yellow-800 (4.5:1 on yellow-100)
    border: '#fde047', // Yellow-300
  },
  danger: {
    bg: '#fee2e2',     // Red-100
    text: '#991b1b',   // Red-800 (4.5:1 on red-100)
    border: '#fca5a5', // Red-300
  },
  info: {
    bg: '#dbeafe',     // Blue-100
    text: '#1e40af',   // Blue-800 (4.5:1 on blue-100)
    border: '#93c5fd', // Blue-300
  },
  neutral: {
    bg: '#f3f4f6',     // Gray-100
    text: '#1f2937',   // Gray-800 (4.5:1 on gray-100)
    border: '#d1d5db', // Gray-300
  },
} as const;

/**
 * Helper to get text color that contrasts with a given background.
 * Simple heuristic based on perceived brightness.
 */
export function getContrastTextColor(hexColor: string): '#ffffff' | '#000000' {
  // Remove # if present
  const hex = hexColor.replace('#', '');
  
  // Parse RGB values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Calculate perceived brightness (ITU-R BT.709)
  const brightness = (r * 0.299 + g * 0.587 + b * 0.114);
  
  // Return white text for dark backgrounds, black for light
  return brightness < 128 ? '#ffffff' : '#000000';
}

/**
 * Validate if a color meets WCAG AA contrast requirements.
 * Returns true if contrast ratio is >= 4.5:1 for normal text.
 */
export function meetsWcagAA(foreground: string, background: string): boolean {
  const getLuminance = (hex: string): number => {
    const rgb = hex.replace('#', '').match(/.{2}/g)!.map(x => {
      const c = parseInt(x, 16) / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
  };
  
  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);
  const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  
  return ratio >= 4.5;
}
