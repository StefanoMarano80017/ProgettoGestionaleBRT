import React from 'react';
import PropTypes from 'prop-types';
import { Box } from '@mui/material';
import TimesheetPageHeader from '@domains/timesheet/components/TimesheetPageHeader';
import TimesheetCalendarPanel from './TimesheetCalendarPanel.jsx';
import TimesheetDashboardPanel from './TimesheetDashboardPanel.jsx';

/**
 * Pure layout component for the dipendente timesheet page.
 * Receives all data/handlers as props and focuses on presentation.
 */
export default function DipendenteTimesheetView({
  employeeName,
  employeeId,
  mergedData,
  selectedDay,
  onDaySelect,
  onDayDoubleClick,
  highlightedDays,
  stagedMeta,
  period,
  onPeriodChange,
  refDate,
  badgeData,
  commesseList,
  commesseLoading,
}) {
  return (
    <>
      <TimesheetPageHeader employeeName={employeeName} />

      <Box
        sx={{
          mt: 2,
          display: 'flex',
          flexDirection: 'row',
          flexWrap: { xs: 'wrap', md: 'nowrap' },
          gap: 3,
          alignItems: 'stretch',
        }}
      >
        <Box
          sx={{
            flex: '0 0 auto',
            width: { xs: '100%', md: 420 },
            display: 'flex',
            flexDirection: 'column',
            height: { xs: 'auto', md: 960 },
          }}
        >
          <TimesheetCalendarPanel
            mergedData={mergedData}
            selectedDay={selectedDay}
            onDaySelect={onDaySelect}
            onDayDoubleClick={onDayDoubleClick}
            highlightedDays={highlightedDays}
            stagedMeta={stagedMeta}
            period={period}
            onPeriodChange={onPeriodChange}
            badgeData={badgeData}
          />
        </Box>

        <Box
          sx={{
            flex: '1 1 600px',
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            height: { xs: 'auto', md: 960 },
          }}
        >
          <TimesheetDashboardPanel
            employeeId={employeeId}
            commesseList={commesseList}
            commesseLoading={commesseLoading}
            mergedData={mergedData}
            period={period}
            refDate={refDate}
            selectedDay={selectedDay}
            onPeriodChange={onPeriodChange}
          />
        </Box>
      </Box>
    </>
  );
}

DipendenteTimesheetView.propTypes = {
  employeeName: PropTypes.string,
  employeeId: PropTypes.string.isRequired,
  mergedData: PropTypes.object,
  selectedDay: PropTypes.string,
  onDaySelect: PropTypes.func.isRequired,
  onDayDoubleClick: PropTypes.func.isRequired,
  highlightedDays: PropTypes.instanceOf(Set),
  stagedMeta: PropTypes.object,
  period: PropTypes.oneOf(['week', 'month', 'year', 'none']).isRequired,
  onPeriodChange: PropTypes.func.isRequired,
  refDate: PropTypes.instanceOf(Date).isRequired,
  badgeData: PropTypes.object,
  commesseList: PropTypes.array,
  commesseLoading: PropTypes.bool,
};