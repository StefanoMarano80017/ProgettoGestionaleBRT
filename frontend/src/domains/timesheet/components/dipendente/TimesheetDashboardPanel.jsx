import React from 'react';
import PropTypes from 'prop-types';
import { Alert, Box, Stack } from '@mui/material';
import CommesseDashboard from '@shared/components/DipendenteHomePage/CommesseDashboard';

/**
 * Dashboard column for the dipendente timesheet layout.
 * Isolates the commesse dashboard and related loading states.
 */
export default function TimesheetDashboardPanel({
  employeeId,
  commesseList,
  commesseLoading,
  mergedData,
  period,
  refDate,
  selectedDay,
  onPeriodChange,
}) {
  return (
    <Stack spacing={1.5} sx={{ height: '100%' }}>
      {selectedDay && commesseLoading && (
        <Alert severity="info">Caricamento commesse...</Alert>
      )}

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        <CommesseDashboard
          employeeId={employeeId}
          assignedCommesse={commesseList}
          data={mergedData}
          period={period}
          refDate={refDate}
          selectedDay={selectedDay}
          onPeriodChange={onPeriodChange}
        />
      </Box>
    </Stack>
  );
}

TimesheetDashboardPanel.propTypes = {
  employeeId: PropTypes.string.isRequired,
  commesseList: PropTypes.array,
  commesseLoading: PropTypes.bool,
  mergedData: PropTypes.object,
  period: PropTypes.oneOf(['week', 'month', 'year', 'none']).isRequired,
  refDate: PropTypes.instanceOf(Date).isRequired,
  selectedDay: PropTypes.string,
  onPeriodChange: PropTypes.func.isRequired,
};
