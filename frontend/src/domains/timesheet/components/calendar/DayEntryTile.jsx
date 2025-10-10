import React, { useMemo, memo } from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, Tooltip } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { getTileSx } from './utils';
import StatusIcon from '@domains/timesheet/components/calendar/statusIcons';
import { resolveTileIcon } from './utils/resolveTileIcon';
import { getGlowColorFromStagedOp, getGlowShadow } from './utils/tileGlow';

/**
 * DayEntryTile
 * Presentational tile for a single day inside the calendar grid.
 * Handles selection outline, background color logic, icons, hours badge, and optional tooltip.
 */
const DayEntryTile = React.forwardRef(function DayEntryTile({
  dateStr,
  day,
  isSelected = false,
  isHoliday = false,
  isOutOfMonth = false,
  isWeekend = false,
  bgcolor = 'transparent',
  totalHours = 0,
  icon = null,
  iconSize = undefined,
  status = undefined,
  showHours = false,
  showDayNumber = true,
  tooltipContent,
  variant = 'default',
  onClick,
  onDoubleClick,
  stagedOp = null,
  stagedStatus = null,
  stagingEntry = null
}, ref) {
  const theme = useTheme();
  const isWide = variant === 'wide';
  const isCompact = variant === 'compact';
  
  // Normalize staged operation
  const normalizedStagedOp = useMemo(() => {
    if (stagedOp) return stagedOp;
    if (stagingEntry?.op && ['create', 'update', 'delete'].includes(stagingEntry.op)) {
      return stagingEntry.op;
    }
    if (stagedStatus === 'staged-insert') return 'create';
    if (stagedStatus === 'staged-update') return 'update';
    if (stagedStatus === 'staged-delete') return 'delete';
    return null;
  }, [stagedOp, stagingEntry?.op, stagedStatus]);

  // Icon resolution
  const iconMeta = useMemo(() => resolveTileIcon({ 
    icon, 
    status, 
    theme, 
    isCompact, 
    iconSize 
  }), [icon, status, theme, isCompact, iconSize]);

  // Glow effects
  const glowColor = useMemo(() => getGlowColorFromStagedOp(normalizedStagedOp, theme), [normalizedStagedOp, theme]);
  const glowShadow = useMemo(() => getGlowShadow(glowColor), [glowColor]);

  const tile = (
    <Box
      ref={ref}
      onClick={() => onClick?.(dateStr)}
      onDoubleClick={(e) => { e.stopPropagation(); onDoubleClick?.(dateStr); }}
      {...(normalizedStagedOp ? { 'data-staged-op': normalizedStagedOp } : {})}
      {...(status ? { 'data-status': status } : {})}
      sx={(t) => ({
        ...getTileSx(t, {
          isSelected,
          isHoliday,
          isWeekend,
          isOutOfMonth,
          status,
          hasBg: bgcolor !== "transparent",
          bgcolor,
          isWide: variant === 'wide',
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
        {iconMeta.explicit ? (
          React.cloneElement(iconMeta.element, { sx: iconMeta.sx })
        ) : (
          <StatusIcon theme={theme} status={status} size={iconMeta.size} />
        )}
      </Box>
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
});

DayEntryTile.displayName = 'DayEntryTile';

DayEntryTile.propTypes = {
  dateStr: PropTypes.string.isRequired,
  day: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  isSelected: PropTypes.bool,
  isHoliday: PropTypes.bool,
  isOutOfMonth: PropTypes.bool,
  isWeekend: PropTypes.bool,
  bgcolor: PropTypes.string,
  totalHours: PropTypes.number,
  icon: PropTypes.node,
  status: PropTypes.string,
  showHours: PropTypes.bool,
  showDayNumber: PropTypes.bool,
  tooltipContent: PropTypes.node,
  variant: PropTypes.oneOf(['default', 'wide', 'compact']),
  onClick: PropTypes.func,
  onDoubleClick: PropTypes.func,
  stagedOp: PropTypes.oneOf(['create', 'update', 'delete']),
  stagedStatus: PropTypes.string, // deprecated
  stagingEntry: PropTypes.shape({
    op: PropTypes.string,
    base: PropTypes.any,
    draft: PropTypes.any,
  }),
  iconSize: PropTypes.number,
};

// Custom memo comparison to prevent unnecessary re-renders
const areEqual = (prevProps, nextProps) => {
  const compareKeys = [
    'dateStr', 'day', 'isSelected', 'isHoliday', 'isOutOfMonth', 'isWeekend', 
    'bgcolor', 'totalHours', 'status', 'variant', 'tooltipContent', 'iconSize'
  ];
  
  // Compare primitive props
  for (const key of compareKeys) {
    if (prevProps[key] !== nextProps[key]) return false;
  }
  
  // Compare icon reference
  if (prevProps.icon !== nextProps.icon) return false;
  
  // Compare normalized staged op
  const prevNormalized = prevProps.stagedOp || 
    (prevProps.stagingEntry?.op && ['create', 'update', 'delete'].includes(prevProps.stagingEntry.op) ? prevProps.stagingEntry.op : null) ||
    (prevProps.stagedStatus === 'staged-insert' ? 'create' : 
     prevProps.stagedStatus === 'staged-update' ? 'update' : 
     prevProps.stagedStatus === 'staged-delete' ? 'delete' : null);
     
  const nextNormalized = nextProps.stagedOp || 
    (nextProps.stagingEntry?.op && ['create', 'update', 'delete'].includes(nextProps.stagingEntry.op) ? nextProps.stagingEntry.op : null) ||
    (nextProps.stagedStatus === 'staged-insert' ? 'create' : 
     nextProps.stagedStatus === 'staged-update' ? 'update' : 
     nextProps.stagedStatus === 'staged-delete' ? 'delete' : null);
     
  return prevNormalized === nextNormalized;
};

export default memo(DayEntryTile, areEqual);
