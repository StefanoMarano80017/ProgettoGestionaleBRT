/**
 * Utility functions for generating consistent colors for commesse and special entries
 * 
 * Color Algorithm Strategy:
 * - Uses a curated palette of 20 carefully selected, visually pleasing colors
 * - Work type suffixes (DL, INST, PROG, MANUT, etc.) get themed color families
 * - Same work type across different projects will have similar color families (blues for DL, teals for INST, etc.)
 * - Project prefix determines which color from the family is selected
 * - All colors are professionally chosen for high contrast and visual appeal
 * 
 * Color families by work type:
 * - DL (Direzione Lavori): Blue family (4 shades)
 * - INST (Installazione): Teal/Cyan family (4 shades)
 * - PROG (Progettazione): Purple family (4 shades)
 * - MANUT (Manutenzione): Orange family (4 shades)
 * - RILIEVI (Rilievi): Cyan/Blue mix family (4 shades)
 * - STR (Strutturale): Green family (4 shades)
 * - UPG (Upgrade): Pink family (4 shades)
 * - Unknown types: Main curated palette (20 colors)
 */

// Special entry color mappings (matching legend colors)
const SPECIAL_ENTRY_COLORS = {
  'FERIE': '#D8315B', // customPink
  'MALATTIA': '#34C759', // customGreen (success)
  'PERMESSO': '#0288d1', // info blue
  'ROL': '#0288d1', // info blue
};

// Curated palette of visually pleasing, highly distinguishable colors
// Carefully selected for good contrast and visual appeal
const COLOR_PALETTE = [
  '#1976d2', // Blue
  '#00897B', // Teal
  '#7B1FA2', // Purple
  '#E64A19', // Deep Orange
  '#0288D1', // Light Blue
  '#C2185B', // Pink
  '#5E35B1', // Deep Purple
  '#00ACC1', // Cyan
  '#D84315', // Red Orange
  '#6A1B9A', // Purple Dark
  '#0277BD', // Blue Dark
  '#00796B', // Teal Dark
  '#F57C00', // Orange
  '#303F9F', // Indigo
  '#1565C0', // Blue Bright
  '#AD1457', // Pink Dark
  '#00838F', // Cyan Dark
  '#4527A0', // Deep Purple Dark
  '#EF6C00', // Orange Dark
  '#2E7D32', // Green Dark
];

// Work type color families for consistent theming
const WORK_TYPE_COLORS = {
  'DL': ['#1976d2', '#0288D1', '#1565C0', '#0277BD'], // Blues
  'INST': ['#00897B', '#00ACC1', '#00796B', '#00838F'], // Teals/Cyans
  'PROG': ['#7B1FA2', '#5E35B1', '#6A1B9A', '#4527A0'], // Purples
  'MANUT': ['#E64A19', '#D84315', '#F57C00', '#EF6C00'], // Oranges
  'RILIEVI': ['#00ACC1', '#00838F', '#0288D1', '#0277BD'], // Cyan/Blue mix
  'STR': ['#2E7D32', '#388E3C', '#43A047', '#66BB6A'], // Greens
  'UPG': ['#C2185B', '#AD1457', '#D81B60', '#E91E63'], // Pinks
};

/**
 * Deterministically convert a string to a hex color using curated palette
 * Optimized for sottocommessa IDs with work type suffixes (VS-25-01-DL, VS-25-01-INST, etc.)
 * Uses a carefully selected palette of visually pleasing colors
 * @param {string} str - Sottocommessa ID (e.g., "VS-25-01-DL")
 * @returns {string} hex color
 */
function stringToColor(str = '') {
  if (!str) return '#1976d2';
  
  // Split by last hyphen to isolate the work type suffix (DL, INST, PROG, MANUT, etc.)
  const parts = str.split('-');
  const suffix = parts[parts.length - 1] || ''; // e.g., "DL", "INST", "PROG"
  const prefix = parts.slice(0, -1).join('-'); // e.g., "VS-25-01"
  
  // Check if we have a color family for this work type
  if (WORK_TYPE_COLORS[suffix]) {
    const colorFamily = WORK_TYPE_COLORS[suffix];
    
    // Hash the prefix to select a color from the family
    let hash = 0;
    for (let i = 0; i < prefix.length; i++) {
      hash = ((hash << 5) - hash) + prefix.charCodeAt(i);
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Select color from family based on hash
    const index = Math.abs(hash) % colorFamily.length;
    return colorFamily[index];
  }
  
  // For unknown work types or general commesse, use the main palette
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Select from curated palette
  const index = Math.abs(hash) % COLOR_PALETTE.length;
  return COLOR_PALETTE[index];
}

/**
 * Generate a consistent color from a commessa name using hash
 * Handles both special entries (FERIE, MALATTIA, etc.) and regular commesse
 * @param {string} commessaName - The name of the commessa
 * @returns {string} - Hex color string
 */
export function getCommessaColor(commessaName = '') {
  if (!commessaName) return '#1976d2'; // default blue
  
  const upperName = String(commessaName).toUpperCase();
  
  // Check if it's a special entry with predefined color
  if (SPECIAL_ENTRY_COLORS[upperName]) {
    return SPECIAL_ENTRY_COLORS[upperName];
  }
  
  // For regular commesse, use hash-based color generation
  return stringToColor(commessaName);
}

/**
 * Get a lighter version of the commessa color (for backgrounds)
 * @param {string} commessaName - The name of the commessa
 * @param {number} alpha - Opacity (0-1)
 * @returns {string} - RGBA color string
 */
export function getCommessaColorLight(commessaName, alpha = 0.1) {
  const hex = getCommessaColor(commessaName);
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Generate color palette for multiple commesse
 * @param {Array<string>} commesse - Array of commessa names
 * @returns {Map<string, string>} - Map of commessa name to color
 */
export function getCommessaColorMap(commesse = []) {
  const colorMap = new Map();
  commesse.forEach(commessa => {
    colorMap.set(commessa, getCommessaColor(commessa));
  });
  return colorMap;
}
