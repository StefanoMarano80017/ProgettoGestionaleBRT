/** Color utility helpers for avatar components. */

/**
 * Deterministically convert a string to a hex color.
 * @param {string} str
 * @returns {string} hex color
 */
export function stringToColor(str = '') {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff;
    color += (`00${value.toString(16)}`).slice(-2);
  }
  return color;
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
