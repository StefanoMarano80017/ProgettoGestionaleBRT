import React, { useState, useMemo } from 'react';
import { Box, Container } from '@mui/material';
import { 
  TimesheetProvider, 
  useTimesheetContext, 
  useReferenceData, 
  useTimesheetStaging,
  useDayEditor,
  useEmployeeTimesheetLoader,
  useStableMergedDataMap,
  useStagedMetaMap,
  useBadgeData
} from '@domains/timesheet/hooks';
import { TimesheetMainLayout } from '@domains/timesheet/components';
import DayEntryDialog from '@domains/timesheet/components/calendar/DayEntryDialog';
import { findUserById } from '@mocks/UsersMock';
import useAuth from '@/domains/auth/hooks/useAuth';

/**
 * InnerDipendente
 * Core timesheet page logic - handles data loading and state management
 */
function InnerDipendente({ employeeId }) {
  const ctx = useTimesheetContext();
  const staging = useTimesheetStaging();
  const dayEditor = useDayEditor();
  
  // Load timesheet data
  useEmployeeTimesheetLoader(employeeId);

  // State management
  const [selectedDay, setSelectedDay] = useState(null);
  const [period, setPeriod] = useState('month');
  const [refDateLocal] = useState(new Date());

  // Data computation
  const { mergedData } = useStableMergedDataMap({ 
    dataMap: ctx?.dataMap || {}, 
    staging, 
    employeeId, 
    mode: 'single' 
  });
  
  const stagedMetaAll = useStagedMetaMap(staging);
  const stagedMeta = useMemo(() => stagedMetaAll[employeeId] || {}, [stagedMetaAll, employeeId]);

  const todayKey = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const isBadgiatoToday = useMemo(
    () => Boolean(mergedData?.[todayKey]?.length),
    [mergedData, todayKey]
  );

  // Badge data from mock
  const badgeData = useBadgeData(employeeId, isBadgiatoToday);

  // Reference data
  const { commesse: commesseList, loading: commesseLoading } = useReferenceData({
    commesse: true,
    personale: false,
    pmGroups: false,
    employeeId
  });

  // Computed values
  const refDate = selectedDay ? new Date(selectedDay) : refDateLocal;
  const missingPrevSet = new Set();

  // Handlers
  const handleDayDoubleClick = (day) => {
    setSelectedDay(day);
    dayEditor.openEditor(employeeId, day);
  };

  const getEmployeeName = () => {
    const user = findUserById(dayEditor.employeeId || employeeId);
    return user ? `${user.nome} ${user.cognome}` : (dayEditor.employeeId || employeeId);
  };

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', overflow: 'auto' }}>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <TimesheetMainLayout
          employeeId={employeeId}
          mergedData={mergedData}
          selectedDay={selectedDay}
          onDaySelect={setSelectedDay}
          onDayDoubleClick={handleDayDoubleClick}
          commesseList={commesseList}
          commesseLoading={commesseLoading}
          stagedMeta={stagedMeta}
          missingPrevSet={missingPrevSet}
          period={period}
          refDate={refDate}
          onPeriodChange={setPeriod}
          badgeData={badgeData}
        />

        <DayEntryDialog
          open={dayEditor.isOpen}
          onClose={dayEditor.closeEditor}
          date={dayEditor.date}
          employeeId={dayEditor.employeeId}
          employeeName={getEmployeeName()}
          data={mergedData}
          commesse={commesseList}
        />
      </Container>
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
  const effectiveId = propEmployeeId || user?.id || 'emp-001';
  
  return (
    <TimesheetProvider scope="single" employeeIds={[effectiveId]}>
      <InnerDipendente employeeId={effectiveId} />
    </TimesheetProvider>
  );
}
