import { normalizeStagedOp } from './normalizeStagedOp';

/**
 * Compare only render-relevant props for DayEntryTile to minimize re-renders.
 * Intentionally ignores callbacks (onClick, onDoubleClick).
 */
export function areDayEntryTilePropsEqual(prevProps, nextProps) {
  // Fast path: primitive props we care about
  const keys = [
    'dateStr','day','isSelected','isHoliday','isOutOfMonth','isWeekend',
    'bgcolor','totalHours','status','variant','tooltipContent','iconSize'
  ];
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    if (prevProps[k] !== nextProps[k]) return false;
  }
  // Icon reference (do not deep compare)
  if (prevProps.icon !== nextProps.icon) return false;

  // Normalized staged op (centralized)
  const prevOp = normalizeStagedOp(prevProps);
  const nextOp = normalizeStagedOp(nextProps);
  if (prevOp !== nextOp) return false;

  return true;
}