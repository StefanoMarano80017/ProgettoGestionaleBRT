import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Box, Stack, Button, IconButton, Typography } from '@mui/material';
import { ArrowBackIos, ArrowForwardIos } from '@mui/icons-material';
import { shortMonth, fullMonth, formatMonthShortLabel } from './utils';

/**
 * MonthSelector
 * Compact month navigation control used across calendar views.
 */
export function MonthSelector({
  year,
  month, // 0-based
  onChange, // (m, y)
  variant = 'windowed', // 'windowed' | 'full'
  labels = 'short', // 'short' | 'full'
  sx = {},
}) {
  const labelArr = useMemo(() => (labels === 'full' ? fullMonth : shortMonth), [labels]);

  const shiftMonth = (delta) => {
    const d = new Date(year, month + delta, 1);
    onChange?.(d.getMonth(), d.getFullYear());
  };

  if (variant === 'full') {
    return (
      <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} sx={{ mb: 1, ...sx }}>
        <IconButton size="small" onClick={() => onChange?.(month, year - 1)}>
          <ArrowBackIos fontSize="inherit" />
        </IconButton>
        <Typography variant="body2" sx={{ minWidth: 80, textAlign: 'center' }}>{year}</Typography>
        <IconButton size="small" onClick={() => onChange?.(month, year + 1)}>
          <ArrowForwardIos fontSize="inherit" />
        </IconButton>
        <Box sx={{ flex: 1 }} />
        <Stack direction="row" flexWrap="wrap" useFlexGap gap={1} justifyContent="center">
          {Array.from({ length: 12 }).map((_, m) => (
            <Button
              key={m}
              size="small"
              variant={m === month ? 'contained' : 'outlined'}
              sx={{ fontSize: '0.75rem' }}
              onClick={() => onChange?.(m, year)}
            >
              {labelArr[m]}
            </Button>
          ))}
        </Stack>
      </Stack>
    );
  }

  // windowed: show prev/next arrows with 5 month buttons around current
  const prev2Date = useMemo(() => new Date(year, month - 2, 1), [year, month]);
  const prev1Date = useMemo(() => new Date(year, month - 1, 1), [year, month]);
  const currDate  = useMemo(() => new Date(year, month, 1), [year, month]);
  const next1Date = useMemo(() => new Date(year, month + 1, 1), [year, month]);
  const next2Date = useMemo(() => new Date(year, month + 2, 1), [year, month]);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1, ...sx }}>
      <IconButton size="small" onClick={() => shiftMonth(-1)}>
        <ArrowBackIos fontSize="inherit" />
      </IconButton>

      <Button variant="outlined" size="small" sx={{ fontSize: '0.75rem' }} onClick={() => onChange?.(prev2Date.getMonth(), prev2Date.getFullYear())}>
        {formatMonthShortLabel(prev2Date, labelArr, year)}
      </Button>
      <Button variant="outlined" size="small" sx={{ fontSize: '0.75rem' }} onClick={() => onChange?.(prev1Date.getMonth(), prev1Date.getFullYear())}>
        {formatMonthShortLabel(prev1Date, labelArr, year)}
      </Button>
      <Button variant="contained" size="small" sx={{ fontSize: '0.75rem' }} onClick={() => onChange?.(currDate.getMonth(), currDate.getFullYear())}>
        {formatMonthShortLabel(currDate, labelArr, year)}
      </Button>
      <Button variant="outlined" size="small" sx={{ fontSize: '0.75rem' }} onClick={() => onChange?.(next1Date.getMonth(), next1Date.getFullYear())}>
        {formatMonthShortLabel(next1Date, labelArr, year)}
      </Button>
      <Button variant="outlined" size="small" sx={{ fontSize: '0.75rem' }} onClick={() => onChange?.(next2Date.getMonth(), next2Date.getFullYear())}>
        {formatMonthShortLabel(next2Date, labelArr, year)}
      </Button>

      <IconButton size="small" onClick={() => shiftMonth(1)}>
        <ArrowForwardIos fontSize="inherit" />
      </IconButton>
    </Box>
  );
}

MonthSelector.propTypes = {
  year: PropTypes.number.isRequired,
  month: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
  variant: PropTypes.oneOf(['windowed', 'full']),
  labels: PropTypes.oneOf(['short', 'full']),
  sx: PropTypes.object,
};

MonthSelector.displayName = 'MonthSelector';

export default React.memo(MonthSelector);
