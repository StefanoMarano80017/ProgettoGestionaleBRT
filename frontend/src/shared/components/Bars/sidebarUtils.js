import React from 'react';

export function getInitials(name, max = 2) {
  if (!name || typeof name !== 'string') return '';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  const picked = parts.length <= max ? parts : [parts[0], parts[parts.length - 1]];
  return picked.map(p => p[0]).join('').toUpperCase();
}

export function renderIcon(IconOrElement, sx) {
  if (!IconOrElement) return null;
  if (React.isValidElement(IconOrElement)) {
    return React.cloneElement(IconOrElement, { sx: { ...(IconOrElement.props?.sx || {}), ...sx } });
  }
  try { const Comp = IconOrElement; return React.createElement(Comp, { sx }); } catch { return null; }
}

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
