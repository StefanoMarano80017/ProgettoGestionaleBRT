import React from 'react';

/**
 * Utility helpers for the Sidebar and related navigation components.
 * Keep these UI-agnostic so they can be reused in tests or other components.
 */

/**
 * Returns the initials for a provided full name string.
 * Splits on whitespace and takes the first character of each token.
 * Consecutive spaces are ignored.
 * @param {string} name Full display name (e.g. "Mario Rossi").
 * @param {number} [max=2] Maximum number of initials to keep (default 2: first + last token).
 * @returns {string} Upper‑cased initials.
 */
export function getInitials(name, max = 2) {
  if (!name || typeof name !== 'string') return '';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  const picked = parts.length <= max ? parts : [parts[0], parts[parts.length - 1]];
  return picked.map(p => p[0]).join('').toUpperCase();
}

/**
 * Safely renders a MUI icon either from a React element instance or an icon component reference.
 * @param {React.ReactElement|React.ComponentType|undefined} IconOrElement
 * @param {object} sx style overrides applied/merged into the icon.
 * @returns {React.ReactElement|null}
 */
export function renderIcon(IconOrElement, sx) {
  if (!IconOrElement) return null;
  // If already a valid React element, merge sx props.
  if (React.isValidElement(IconOrElement)) {
    return React.cloneElement(IconOrElement, {
      sx: { ...(IconOrElement.props?.sx || {}), ...sx },
    });
  }
  // Otherwise assume it's a component (e.g. imported MUI icon component)
  try {
    const Comp = IconOrElement; // eslint-disable-line react/display-name
    return React.createElement(Comp, { sx });
  } catch {
    return null;
  }
}

/**
 * Derive primary and hover colors for a sidebar item based on selection + theme mode.
 * Keeps palette fallbacks centralized so component remains lean.
 * @param {object} theme MUI theme
 * @param {boolean} selected whether the item is active
 * @returns {{color: string, hoverColor: string}}
 */
export function computeSidebarItemColors(theme, selected) {
  if (selected) {
    const active = theme.palette.customBlue1?.main || theme.palette.primary.main;
    return { color: active, hoverColor: active };
  }
  const base = theme.palette.mode === 'light'
    ? (theme.palette.customBlue3?.main || theme.palette.primary.main)
    : (theme.palette.customGray?.main || theme.palette.text.secondary);
  const hover = theme.palette.primary?.main || theme.palette.customBlue3?.main || base;
  return { color: base, hoverColor: hover };
}
