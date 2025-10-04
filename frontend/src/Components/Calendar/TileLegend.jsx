import React, { useMemo, memo } from 'react';
import PropTypes from 'prop-types';
import { Stack, Chip } from '@mui/material';
import { useTileLegendItems } from '@/Hooks/Timesheet/calendar';

/**
 * TileLegend
 * Small horizontal legend used in the calendar toolbar to explain icons/statuses.
 *
 * This component is intentionally presentational and memoized to avoid
 * re-renders when toolbar state changes elsewhere.
 */
export function TileLegend() {
  const items = useTileLegendItems();

  const rendered = useMemo(() => items.map((item) => {
    // Ensure icon sizing via sx override when an element is provided
    const icon = item.icon && React.isValidElement(item.icon)
      ? React.cloneElement(item.icon, { sx: { fontSize: 18, color: item.color, ...item.icon.props?.sx } })
      : item.icon;

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
  }), [items]);

  return (
    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
      {rendered}
    </Stack>
  );
}

TileLegend.displayName = 'TileLegend';

TileLegend.propTypes = {};

export default memo(TileLegend);
