import React from 'react';
import { Box } from '@mui/material';
import { useSearchParams } from 'react-router-dom';
import { TimesheetProvider, useDipendenteTimesheetState } from '@domains/timesheet/hooks';
import { DipendenteTimesheetView } from '@domains/timesheet/components';
import DayEntryDialog from '@domains/timesheet/components/calendar/DayEntryDialog';
import useAuth from '@/domains/auth/hooks/useAuth';

function DipendenteTimesheetContainer({ employeeId }) {
  const {
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
    employeeName,
    dialogState,
  } = useDipendenteTimesheetState(employeeId);

  const dialogEmployeeId = dialogState.employeeId || employeeId;

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: 3 }}>
      <Box sx={{ width: '100%', px: { xs: 2, md: 4 } }}>
        <DipendenteTimesheetView
          employeeName={employeeName}
          employeeId={employeeId}
          mergedData={mergedData}
          selectedDay={selectedDay}
          onDaySelect={onDaySelect}
          onDayDoubleClick={onDayDoubleClick}
          highlightedDays={highlightedDays}
          stagedMeta={stagedMeta}
          period={period}
          onPeriodChange={onPeriodChange}
          refDate={refDate}
          badgeData={badgeData}
          commesseList={commesseList}
          commesseLoading={commesseLoading}
        />

        <DayEntryDialog
          open={dialogState.open}
          onClose={dialogState.onClose}
          date={dialogState.date}
          employeeId={dialogEmployeeId}
          employeeName={employeeName}
          data={mergedData}
          commesse={commesseList}
        />
      </Box>
    </Box>
  );
}

/**
 * DipendenteTimesheet
 * Main timesheet page component for employees
 * Provides context and renders inner component
 */
export default function DipendenteTimesheet({ employeeId: propEmployeeId }) {
  const { user } = useAuth() || {};
  const [searchParams] = useSearchParams();
  const queryEmployeeId = searchParams.get('employeeId');
  const effectiveId = propEmployeeId || queryEmployeeId || user?.id || 'emp-001';
  
  return (
    <TimesheetProvider key={effectiveId} scope="single" employeeIds={[effectiveId]}>
      <DipendenteTimesheetContainer employeeId={effectiveId} />
    </TimesheetProvider>
  );
}
