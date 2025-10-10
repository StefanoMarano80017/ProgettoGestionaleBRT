export function getGlowColorFromStagedOp(stagedOp, theme) {
  if (!stagedOp) return null;
  switch (stagedOp) {
    case 'create': return theme?.palette?.success?.main || '#2e7d32';
    case 'delete': return theme?.palette?.error?.main || '#d32f2f';
    case 'update': return theme?.palette?.warning?.main || '#ed6c02';
    default: return null;
  }
}

export function getGlowShadow(glowColor) {
  if (!glowColor) return undefined;
  return `0 0 0 1px ${glowColor}, 0 0 4px 1px ${glowColor}66`;
}