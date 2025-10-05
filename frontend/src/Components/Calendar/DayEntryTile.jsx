import React, { useMemo, memo } from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, Tooltip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { getTileSx, isWeekend as utilIsWeekend } from './utils';
import StatusIcon from '@calendar/statusIcons';

/**
 * Resolve which icon element to render for the tile based on:
 * - explicit custom icon (optionally recolored by status or inferred type)
 * - status fallback via getStatusIcon
 * Applies compact sizing when requested.
 */
function resolveTileIcon({ icon, status, theme, isCompact, iconSize }) {
  if (icon && React.isValidElement(icon)) {
    let statusColor;
    if (status === 'ferie') {
      statusColor = theme.palette.customPink?.main || theme.palette.secondary.main;
    } else if (status === 'malattia') {
      statusColor = theme.palette.success.main;
    }
    if (!statusColor && icon.type) {
      const typeName = icon.type.displayName || icon.type.name || String(icon.type);
      if (typeName.includes('BeachAccess')) {
        statusColor = theme.palette.customPink?.main || theme.palette.secondary.main;
      } else if (typeName.includes('LocalHospital')) {
        statusColor = theme.palette.success.main;
      }
    }
    if (statusColor || isCompact || iconSize) {
      const existingSx = icon.props?.sx || {};
      const size = iconSize ?? (isCompact ? 10 : 14);
      const mergedSx = { ...existingSx, ...(statusColor ? { color: statusColor } : {}), fontSize: size };
      return React.cloneElement(icon, { sx: mergedSx });
    }
    return icon;
  }
  const si = <StatusIcon theme={theme} status={status} size={iconSize ?? (isCompact ? 10 : 14)} />;
  if (!si) return null;
  const statusSize = isCompact ? 10 : 14;
  if (React.isValidElement(si)) {
    const existingSx = si.props?.sx || {};
    return React.cloneElement(si, { sx: { ...existingSx, fontSize: iconSize ?? statusSize } });
  }
  return si;
}

/**
 * DayEntryTile
 * Presentational tile for a single day inside the calendar grid.
 * Handles selection outline, background color logic, icons, hours badge, and optional tooltip.
 */
export function DayEntryTile({
  dateStr,
  day,
  isSelected = false,
  isHoliday = false,
  isOutOfMonth = false,
  bgcolor = 'transparent',
  totalHours = 0,
  icon = null,
  iconSize = undefined,
  status = undefined,
  showHours = false,
  showDayNumber = true,
  tooltipContent,
  variant = 'default', // 'default' | 'wide' | 'compact'
  onClick,
  stagedStatus = null, // legacy: 'staged-insert' | 'staged-update' | 'staged-delete'
  stagedOp = null,    // new stable op: 'create' | 'update' | 'delete'
  stagingEntry = null, // optional full staging snapshot { op, base, draft }
  onDoubleClick, // new: open modal editor
}) {
  const isWide = variant === 'wide';
  const isCompact = variant === 'compact';
  const theme = useTheme();
  const isWeekend = useMemo(() => utilIsWeekend(dateStr), [dateStr]);
  const resolvedIcon = useMemo(() => resolveTileIcon({ icon, status, theme, isCompact, iconSize }), [icon, status, theme, isCompact, iconSize]);
  // Derive effective stagedStatus preferring new props (stagedOp / stagingEntry)
  const effectiveStagedStatus = useMemo(() => {
    const op = stagedOp || stagingEntry?.op || null;
    if (op === 'create') return 'staged-insert';
    if (op === 'delete') return 'staged-delete';
    if (op === 'update') return 'staged-update';
    return stagedStatus; // fallback legacy prop
  }, [stagedOp, stagingEntry?.op, stagedStatus]);

  const glowColor = useMemo(() => {
    if (!effectiveStagedStatus) return null;
    switch (effectiveStagedStatus) {
      case 'staged-insert': return theme.palette.success?.main || '#2e7d32';
      case 'staged-delete': return theme.palette.error?.main || '#d32f2f';
      case 'staged-update': return theme.palette.warning?.main || '#ed6c02';
      default: return null;
    }
  }, [effectiveStagedStatus, theme]);
  // Softer glow: thin outline + subtle blur with alpha
  const glowShadow = glowColor ? `0 0 0 1px ${glowColor}, 0 0 4px 1px ${glowColor}66` : undefined;

  const tile = (
    <Box
      onClick={() => onClick?.(dateStr)}
      onDoubleClick={(e) => { e.stopPropagation(); onDoubleClick?.(dateStr); }}
      {...(effectiveStagedStatus ? { 'data-staged-op': effectiveStagedStatus } : {})}
      sx={(t) => ({
        ...getTileSx(t, {
          isSelected,
          isHoliday,
          isWeekend,
          isOutOfMonth,
          status,
          hasBg: bgcolor !== "transparent",
          bgcolor,
          isWide,
        }),
        ...(glowShadow ? { boxShadow: glowShadow, position: 'relative', zIndex: 1, transition: 'box-shadow 160ms ease-in-out' } : { transition: 'box-shadow 160ms ease-in-out' }),
      })}
    >
      {/* Day number chip */}
      {showDayNumber && (
        <Typography
          variant="caption"
          sx={{
            position: "absolute",
            top: isWide ? 5 : 4,
            left: isWide ? 7 : 6,
            lineHeight: 1,
            px: 0.5,
            borderRadius: 0,
            // removed background per request; keep text weight and color from parent
          }}
        >
          {day}
        </Typography>
      )}

      {/* Hours label at bottom center */}
      <Typography
        variant="caption"
        sx={{ position: "absolute", bottom: 4, left: "50%", transform: "translateX(-50%)", lineHeight: 1 }}
      >
        {showHours ? (totalHours > 0 ? `${totalHours}h` : "-") : ""}
      </Typography>

      {/* Main icon (centered for default, top-right for compact). If not provided, infer from status */}
      {(resolvedIcon) && (
        <Box
          sx={{
            position: "absolute",
            // decide icon placement by variant (compact -> top-right, default -> centered)
            top: isCompact ? (isWide ? 5 : 6) : "50%",
            right: isCompact ? (isWide ? 7 : 6) : undefined,
            left: isCompact ? undefined : "50%",
            transform: isCompact ? "none" : "translate(-50%, -50%)",
            lineHeight: 0,
          }}
        >
          {resolvedIcon}
        </Box>
      )}
      {/* (dot indicator removed) */}
    </Box>
  );

  // Use default MUI Tooltip always (placement top)

  return tooltipContent ? (
    <Tooltip title={tooltipContent} arrow placement="top" disableInteractive>
      <Box sx={{ height: "100%" }}>{tile}</Box>
    </Tooltip>
  ) : (
    tile
  );
}

DayEntryTile.displayName = 'DayEntryTile';

DayEntryTile.propTypes = {
  dateStr: PropTypes.string.isRequired,
  day: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  isSelected: PropTypes.bool,
  isHoliday: PropTypes.bool,
  isOutOfMonth: PropTypes.bool,
  bgcolor: PropTypes.string,
  totalHours: PropTypes.number,
  icon: PropTypes.node,
  iconTopRight: PropTypes.bool,
  status: PropTypes.string,
  showHours: PropTypes.bool,
  showDayNumber: PropTypes.bool,
  tooltipContent: PropTypes.node,
  variant: PropTypes.oneOf(['default', 'wide', 'compact']),
  onClick: PropTypes.func,
  stagedStatus: PropTypes.string,
  stagedOp: PropTypes.string,
  stagingEntry: PropTypes.shape({
    op: PropTypes.string,
    base: PropTypes.any,
    draft: PropTypes.any,
  }),
  iconSize: PropTypes.number,
  onDoubleClick: PropTypes.func,
};

export default memo(DayEntryTile);
