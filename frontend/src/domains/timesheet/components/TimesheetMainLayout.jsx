import React from 'react';
import { Box, Typography, Alert, Paper, Stack } from '@mui/material';
import PropTypes from 'prop-types';
import WorkCalendar from '@domains/timesheet/components/calendar/WorkCalendar';
import CommesseDashboard from '@shared/components/DipendenteHomePage/CommesseDashboard';
import TimesheetPageHeader from './TimesheetPageHeader';
import { BadgeCompact } from '@shared/components/BadgeCard';

/**
 * TimesheetMainLayout
 * Main layout component for timesheet page
 * Contains dashboard and calendar in two-column layout
 */
export function TimesheetMainLayout({
  employeeId,
  mergedData,
  selectedDay,
  onDaySelect,
  onDayDoubleClick,
  commesseList,
  commesseLoading,
  stagedMeta,
  highlightedDays,
  period,
  refDate,
  onPeriodChange,
  badgeData,
  employeeName,
}) {
  return (
    <>
      {/* Header with badge */}
      <TimesheetPageHeader employeeName={employeeName} />

      {/* Two-column bento layout */}
      <Box
        sx={{
          mt: 2,
          display: 'flex',
          flexDirection: 'row',
          flexWrap: { xs: 'wrap', md: 'nowrap' },
          gap: 3,
          alignItems: 'stretch'
        }}
      >
        {/* Left: Calendar */}
        <Box
          sx={{
            flex: '0 0 auto',
            width: { xs: '100%', md: 420 },
            display: 'flex',
            flexDirection: 'column',
            height: { xs: 'auto', md: 850 },
          }}
        >
          <Stack spacing={1.5}>
            {badgeData?.hasBadge && (
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
                bgcolor: theme.palette.mode === 'dark'
                  ? theme.palette.background.main
                  : theme.palette.background.main,
                overflow: 'hidden',
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
              />
            </Paper>
          </Stack>
        </Box>

        {/* Right: Dashboard */}
        <Box sx={{ 
          flex: '1 1 600px', 
          minWidth: 0, 
          display: 'flex', 
          flexDirection: 'column',
          height: { xs: 'auto', md: 850 }
        }}>
          {selectedDay && commesseLoading && (
            <Alert severity="info" sx={{ mb: 1 }}>
              Caricamento commesse...
            </Alert>
          )}

          <Box sx={{ 
            height: '100%', 
            borderRadius: 2,
            overflow: 'hidden'
          }}>
            <CommesseDashboard
              employeeId={employeeId}
              assignedCommesse={commesseList}
              data={mergedData}
              period={period}
              refDate={refDate}
              onPeriodChange={onPeriodChange}
            />
          </Box>
        </Box>
      </Box>
    </>
  );
}

TimesheetMainLayout.propTypes = {
  employeeId: PropTypes.string.isRequired,
  mergedData: PropTypes.object,
  selectedDay: PropTypes.string,
  onDaySelect: PropTypes.func.isRequired,
  onDayDoubleClick: PropTypes.func.isRequired,
  commesseList: PropTypes.array,
  commesseLoading: PropTypes.bool,
  stagedMeta: PropTypes.object,
  highlightedDays: PropTypes.instanceOf(Set),
  period: PropTypes.oneOf(['week', 'month', 'year', 'none']).isRequired,
  refDate: PropTypes.instanceOf(Date).isRequired,
  onPeriodChange: PropTypes.func.isRequired,
  badgeData: PropTypes.object,
  employeeName: PropTypes.string,
};

TimesheetMainLayout.displayName = 'TimesheetMainLayout';

export default TimesheetMainLayout;
