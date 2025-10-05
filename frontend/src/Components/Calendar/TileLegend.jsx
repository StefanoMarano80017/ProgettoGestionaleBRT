import React, { useMemo, memo } from 'react';
import PropTypes from 'prop-types';
import { Stack, Chip, Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useTileLegendItems } from '@/Hooks/Timesheet/calendar';

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
 * Small horizontal legend used in the calendar toolbar to explain icons/statuses.
 *
 * This component is intentionally presentational and memoized to avoid
 * re-renders when toolbar state changes elsewhere.
 */
export function TileLegend() {
  const items = useTileLegendItems();
  const theme = useTheme();
  const colorMap = STATUS_COLOR_MAP(theme);

  const rendered = useMemo(() => items.map((item) => {
    const statusKey = item.status;
    const iconColor = item.color || colorMap[statusKey] || theme.palette.text.secondary;

    let icon = item.icon;
    if (icon && React.isValidElement(icon)) {
      // Try htmlColor prop (many MUI icons honor this); also enforce via sx + wrapper
      const mergedSx = { fontSize: 14, color: iconColor, ...(icon.props?.sx || {}) };
      icon = React.cloneElement(icon, { htmlColor: iconColor, sx: mergedSx });
      icon = <Box sx={{ lineHeight: 0, display: 'flex', alignItems: 'center', color: iconColor }}>{icon}</Box>;
    }

    return (
      <Chip
        key={item.status}
        size="small"
        icon={icon}
        label={item.label}
        variant="outlined"
        sx={{ borderRadius: 1, borderColor: 'divider', bgcolor: 'transparent', px: 0.75, py: 0.25 }}
      />
    );
  }), [items, colorMap, theme.palette.text.secondary]);

  return (
    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
      {rendered}
    </Stack>
  );
}

TileLegend.displayName = 'TileLegend';

TileLegend.propTypes = {};

export default memo(TileLegend);
