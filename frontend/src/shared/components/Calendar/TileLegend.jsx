import React, { useMemo, memo } from 'react';
import PropTypes from 'prop-types';
import { Stack, Box, Tooltip, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useTileLegendItems } from '@domains/timesheet/hooks/calendar';

const STATUS_COLOR_MAP = (theme) => ({
  'staged-insert': theme.palette.success?.main,
  'staged-update': theme.palette.warning?.main,
  'staged-delete': theme.palette.error?.main,
  'prev-incomplete': theme.palette.warning?.light || theme.palette.warning?.main,
  ferie: theme.palette.customPink?.main || theme.palette.secondary.main,
  malattia: theme.palette.success?.main,
});

/**
 * TileLegend
 * Compact horizontal legend with icon-only items and tooltips.
 * Redesigned for minimal space usage while maintaining clarity.
 */
export function TileLegend() {
  const items = useTileLegendItems();
  const theme = useTheme();
  const colorMap = STATUS_COLOR_MAP(theme);

  const rendered = useMemo(() => items.map((item, idx) => {
    const statusKey = item.status || item.key || `legend-${idx}`;
    const iconColor = item.color || colorMap[statusKey] || theme.palette.text.secondary;

    let icon = item.icon;
    if (icon && React.isValidElement(icon)) {
      // Enforce icon color and size
      const mergedSx = { fontSize: 18, color: iconColor, ...(icon.props?.sx || {}) };
      icon = React.cloneElement(icon, { htmlColor: iconColor, sx: mergedSx });
    }

    return (
      <Tooltip 
        key={statusKey}
        title={
          <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
            {item.label}
          </Typography>
        }
        arrow
        placement="top"
        enterDelay={300}
        enterNextDelay={200}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 32,
            height: 32,
            borderRadius: 1.5,
            border: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            cursor: 'help',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              borderColor: iconColor,
              bgcolor: theme.palette.mode === 'dark' 
                ? 'rgba(255, 255, 255, 0.05)' 
                : 'rgba(0, 0, 0, 0.02)',
              transform: 'translateY(-2px)',
              boxShadow: `0 4px 8px ${theme.palette.mode === 'dark' 
                ? 'rgba(0, 0, 0, 0.4)' 
                : 'rgba(0, 0, 0, 0.1)'}`,
            }
          }}
        >
          {icon}
        </Box>
      </Tooltip>
    );
  }), [items, colorMap, theme]);

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      gap: 1,
      mt: 2
    }}>
      {/* Legend Label */}
      <Typography 
        variant="caption" 
        sx={{ 
          color: 'text.secondary',
          fontWeight: 600,
          textTransform: 'uppercase',
          fontSize: '0.65rem',
          letterSpacing: 0.5,
          px: 0.5
        }}
      >
        Legenda
      </Typography>
      
      {/* Compact Icon Grid */}
      <Stack 
        direction="row" 
        spacing={1} 
        flexWrap="wrap" 
        useFlexGap 
        alignItems="center"
        sx={{ px: 0.5 }}
      >
        {rendered}
      </Stack>
    </Box>
  );
}

TileLegend.displayName = 'TileLegend';

TileLegend.propTypes = {};

export default memo(TileLegend);
