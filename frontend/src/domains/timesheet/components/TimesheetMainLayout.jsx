import React from 'react';
import { Box, Typography, Alert } from '@mui/material';
import PropTypes from 'prop-types';
import WorkCalendar from '@domains/timesheet/components/calendar/WorkCalendar';
import CommesseDashboard from '@shared/components/DipendenteHomePage/CommesseDashboard';
import TimesheetPageHeader from './TimesheetPageHeader';

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
  missingPrevSet,
  period,
  refDate,
  onPeriodChange,
  badgeData
}) {
  return (
    <Box
      sx={{
        borderRadius: 2,
        bgcolor: 'customBackground.main',
        py: 3,
        px: { xs: 2, md: 6 },
        mb: 4,
        display: 'flex',
        flexDirection: 'column',
        gap: 1
      }}
    >
      {/* Header with badge */}
      <TimesheetPageHeader badgeData={badgeData} />

      {/* Two-column bento layout */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          flexWrap: { xs: 'wrap', md: 'nowrap' },
          gap: 3,
          alignItems: 'stretch'
        }}
      >
        {/* Left: Dashboard */}
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

        {/* Right: Calendar */}
        <Box
          sx={{
            flex: '0 0 auto',
            width: { xs: '100%', md: 420 },
            display: 'flex',
            flexDirection: 'column',
            height: { xs: 'auto', md: 850 },
            bgcolor: 'background.default',
            borderRadius: 2,
            p: 2
          }}
        >
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              fontStyle: 'italic',
              textAlign: 'center',
              mb: 2
            }}
          >
            Fai doppio click su un giorno per modificare le ore lavorate.
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }} />

          <WorkCalendar
            data={mergedData}
            selectedDay={selectedDay}
            onDaySelect={onDaySelect}
            onDayDoubleClick={onDayDoubleClick}
            variant="wide"
            highlightedDays={missingPrevSet}
            stagedMeta={stagedMeta}
          />
        </Box>
      </Box>
    </Box>
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
  missingPrevSet: PropTypes.instanceOf(Set),
  period: PropTypes.oneOf(['week', 'month', 'year']).isRequired,
  refDate: PropTypes.instanceOf(Date).isRequired,
  onPeriodChange: PropTypes.func.isRequired,
  badgeData: PropTypes.object
};

TimesheetMainLayout.displayName = 'TimesheetMainLayout';

export default TimesheetMainLayout;
