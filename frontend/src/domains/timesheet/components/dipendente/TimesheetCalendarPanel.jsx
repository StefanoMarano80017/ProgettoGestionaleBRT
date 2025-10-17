import React from 'react';
import PropTypes from 'prop-types';
import { Box, Paper, Stack } from '@mui/material';
import WorkCalendar from '@domains/timesheet/components/calendar/WorkCalendar';
import { BadgeCompact } from '@shared/components/BadgeCard';

/**
 * Calendar column for the dipendente timesheet layout.
 * Handles rendering of badge information and the monthly calendar.
 */
export default function TimesheetCalendarPanel({
  mergedData,
  selectedDay,
  onDaySelect,
  onDayDoubleClick,
  highlightedDays,
  stagedMeta,
  period,
  onPeriodChange,
  badgeData,
}) {
  const showBadge = Boolean(badgeData?.hasBadge);

  return (
    <Stack spacing={1.5} sx={{ height: '100%' }}>
      {showBadge && (
        <Box>
          <BadgeCompact
            isBadgiato={badgeData.isBadgiato}
            badgeNumber={badgeData.badgeNumber}
            lastBadgeTime={badgeData.lastBadgeTime}
            lastBadgeType={badgeData.lastBadgeType}
            lastBadgeLabel={badgeData.lastBadgeLabel}
            width="100%"
          />
        </Box>
      )}

      <Paper
        elevation={0}
        sx={(theme) => ({
          borderRadius: 3,
          border: '1px solid',
          borderColor: theme.palette.mode === 'dark'
            ? 'rgba(255, 255, 255, 0.08)'
            : theme.palette.divider,
          bgcolor: theme.palette.background.main,
          overflow: 'hidden',
          flex: 1,
          minHeight: 0,
        })}
      >
        <WorkCalendar
          data={mergedData}
          selectedDay={selectedDay}
          onDaySelect={onDaySelect}
          onDayDoubleClick={onDayDoubleClick}
          variant="wide"
          highlightedDays={highlightedDays}
          stagedMeta={stagedMeta}
          period={period}
          onPeriodChange={onPeriodChange}
          showRiepilogo
        />
      </Paper>
    </Stack>
  );
}

TimesheetCalendarPanel.propTypes = {
  mergedData: PropTypes.object,
  selectedDay: PropTypes.string,
  onDaySelect: PropTypes.func.isRequired,
  onDayDoubleClick: PropTypes.func.isRequired,
  highlightedDays: PropTypes.instanceOf(Set),
  stagedMeta: PropTypes.object,
  period: PropTypes.oneOf(['week', 'month', 'year', 'none']).isRequired,
  onPeriodChange: PropTypes.func.isRequired,
  badgeData: PropTypes.object,
};
