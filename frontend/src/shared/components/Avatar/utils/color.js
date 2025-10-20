/** Color utility helpers for avatar components. */

// Curated palette of visually pleasing colors for avatars
// Carefully selected for good contrast against light backgrounds
// and excellent readability of white text
const AVATAR_COLOR_PALETTE = [
  '#1976d2', // Blue
  '#388E3C', // Green
  '#D32F2F', // Red
  '#7B1FA2', // Purple
  '#00796B', // Teal
  '#F57C00', // Orange
  '#0288D1', // Light Blue
  '#C2185B', // Pink
  '#5E35B1', // Deep Purple
  '#00897B', // Teal Dark
  '#E64A19', // Deep Orange
  '#1565C0', // Blue Dark
  '#0097A7', // Cyan
  '#303F9F', // Indigo
  '#689F38', // Light Green
  '#E53935', // Red Bright
  '#00ACC1', // Cyan Bright
  '#FB8C00', // Orange Bright
  '#8E24AA', // Purple Bright
  '#43A047', // Green Bright
];

/**
 * Deterministically convert a string to a hex color using curated palette.
 * Same string always produces the same color, but from a professionally
 * selected palette of visually appealing colors.
 * @param {string} str - The seed string (name, email, etc.)
 * @returns {string} hex color
 */
export function stringToColor(str = '') {
  if (!str) return '#1976d2';
  
  // Simple hash function for deterministic selection
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Select color from curated palette
  const index = Math.abs(hash) % AVATAR_COLOR_PALETTE.length;
  return AVATAR_COLOR_PALETTE[index];
}

/**
 * Darken a hex color by a factor (0..1).
 * @param {string} hex
 * @param {number} factor fraction to darken
 * @returns {string} rgb string
 */
export function darkenColor(hex, factor = 0.2) {
  if (!/^#?[0-9a-fA-F]{6}$/.test(hex)) return hex; // naive guard
  const h = hex.startsWith('#') ? hex : `#${hex}`;
  const r = Math.floor(parseInt(h.slice(1, 3), 16) * (1 - factor));
  const g = Math.floor(parseInt(h.slice(3, 5), 16) * (1 - factor));
  const b = Math.floor(parseInt(h.slice(5, 7), 16) * (1 - factor));
  return `rgb(${r}, ${g}, ${b})`;
}
