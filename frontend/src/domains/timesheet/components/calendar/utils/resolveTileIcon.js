export function resolveTileIcon({ icon, status, theme, isCompact, iconSize }) {
  // If an explicit React element is provided, optionally recolor/resize it; otherwise delegate to StatusIcon via status.
  if (icon && icon.$$typeof) {
    let statusColor;
    if (status === 'ferie') {
      statusColor = theme?.palette?.customPink?.main || theme?.palette?.secondary?.main;
    } else if (status === 'malattia') {
      statusColor = theme?.palette?.success?.main;
    }
    const size = iconSize ?? (isCompact ? 16 : 20);
    const existingSx = (icon.props && icon.props.sx) || {};
    const mergedSx = { ...existingSx, ...(statusColor ? { color: statusColor } : {}), fontSize: size };
    return { explicit: true, element: icon, sx: mergedSx, size };
  }
  // No explicit icon → caller should render <StatusIcon status=... size=...>.
  const size = iconSize ?? (isCompact ? 16 : 20);
  return { explicit: false, element: null, sx: {}, size };
}