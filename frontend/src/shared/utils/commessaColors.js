/**
 * Utility functions for generating consistent colors for commesse and special entries
 * 
 * Color Algorithm Strategy:
 * - Work type suffixes (DL, INST, PROG, MANUT, RILIEVI) dominate the color (80% weight)
 * - Same work type across different projects will have similar color families
 * - Project prefix adds variation (20% weight) for distinction
 * 
 * Example color families by work type:
 * - DL (Direzione Lavori): Blue tones
 * - INST (Installazione): Green/Teal tones  
 * - PROG (Progettazione): Purple/Violet tones
 * - MANUT (Manutenzione): Orange/Amber tones
 * - RILIEVI (Rilievi): Cyan/Turquoise tones
 */

// Special entry color mappings (matching legend colors)
const SPECIAL_ENTRY_COLORS = {
  'FERIE': '#D8315B', // customPink
  'MALATTIA': '#34C759', // customGreen (success)
  'PERMESSO': '#0288d1', // info blue
  'ROL': '#0288d1', // info blue
};

/**
 * Deterministically convert a string to a hex color using enhanced hash algorithm
 * Optimized for sottocommessa IDs with work type suffixes (VS-25-01-DL, VS-25-01-INST, etc.)
 * The algorithm gives extra weight to the suffix after the last hyphen for maximum color variation
 * @param {string} str - Sottocommessa ID (e.g., "VS-25-01-DL")
 * @returns {string} hex color
 */
function stringToColor(str = '') {
  if (!str) return '#1976d2';
  
  // Split by last hyphen to isolate the work type suffix (DL, INST, PROG, MANUT, etc.)
  const parts = str.split('-');
  const suffix = parts[parts.length - 1] || ''; // e.g., "DL", "INST", "PROG"
  const prefix = parts.slice(0, -1).join('-'); // e.g., "VS-25-01"
  
  // Hash the suffix with EXTREME weight (work type determines base color)
  let suffixHash = 5381;
  for (let i = 0; i < suffix.length; i++) {
    const char = suffix.charCodeAt(i);
    // Each character in suffix gets exponentially more weight
    suffixHash = ((suffixHash << 7) + suffixHash) + (char * Math.pow(3, i + 1));
  }
  
  // Hash the prefix normally (provides variation within same work type)
  let prefixHash = 5381;
  for (let i = 0; i < prefix.length; i++) {
    const char = prefix.charCodeAt(i);
    prefixHash = ((prefixHash << 5) + prefixHash) + char; // Standard DJB2
  }
  
  // Combine hashes: suffix dominates (80%), prefix adds variation (20%)
  let hash = Math.abs(suffixHash * 4 + prefixHash);
  
  // Advanced bit mixing for better distribution
  hash ^= (hash >>> 16);
  hash ^= (hash >>> 8);
  hash *= 0x85ebca6b; // Prime multiplier
  hash ^= (hash >>> 13);
  
  // Generate hue - suffix determines the color family
  // Different work types will be in different color zones
  const hue = hash % 360;
  
  // Higher saturation range for vibrant, distinguishable colors
  const saturation = 70 + (hash % 20); // 70-90%
  const lightness = 50 + ((hash >> 12) % 15); // 50-65%
  
  // Convert HSL to RGB
  const hslToRgb = (h, s, l) => {
    s /= 100;
    l /= 100;
    
    const k = n => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    
    return [
      Math.round(255 * f(0)),
      Math.round(255 * f(8)),
      Math.round(255 * f(4))
    ];
  };
  
  const [r, g, b] = hslToRgb(hue, saturation, lightness);
  
  const toHex = (val) => {
    const hex = val.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
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
