import React, { useState, useMemo } from 'react';
import { Box } from '@mui/material';
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
import { getRangeForPeriod, enumerateDateKeys } from '@domains/timesheet/components/admin-grid/utils/periodUtils';

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
  const todayRef = useMemo(() => new Date(), []);

  const defaultRefDate = useMemo(() => {
    const year = Number.isFinite(ctx?.year) ? ctx.year : todayRef.getFullYear();
    const month = Number.isFinite(ctx?.month) ? ctx.month : todayRef.getMonth();
    return new Date(year, month, 1);
  }, [ctx?.year, ctx?.month, todayRef]);

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
  const refDate = useMemo(() => (selectedDay ? new Date(selectedDay) : defaultRefDate), [selectedDay, defaultRefDate]);

  const periodRange = useMemo(() => {
    if (period === 'none') return null;
    return getRangeForPeriod(period, refDate);
  }, [period, refDate]);

  const highlightedDates = useMemo(() => {
    if (!periodRange) return new Set();
    const keys = enumerateDateKeys(periodRange);
    const activeYear = Number.isFinite(ctx?.year) ? ctx.year : refDate.getFullYear();
    const activeMonth = Number.isFinite(ctx?.month) ? ctx.month : refDate.getMonth();
    const monthKey = `${activeYear}-${String(activeMonth + 1).padStart(2, '0')}`;
    return new Set(keys.filter((key) => key.startsWith(monthKey)));
  }, [periodRange, ctx?.year, ctx?.month, refDate]);

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
      <Box sx={{ width: '100%', py: 4, px: { xs: 2, md: 4 } }}>
        <TimesheetMainLayout
          employeeId={employeeId}
          mergedData={mergedData}
          selectedDay={selectedDay}
          onDaySelect={setSelectedDay}
          onDayDoubleClick={handleDayDoubleClick}
          commesseList={commesseList}
          commesseLoading={commesseLoading}
          stagedMeta={stagedMeta}
          highlightedDays={highlightedDates}
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
  const effectiveId = propEmployeeId || user?.id || 'emp-001';
  
  return (
    <TimesheetProvider scope="single" employeeIds={[effectiveId]}>
      <InnerDipendente employeeId={effectiveId} />
    </TimesheetProvider>
  );
}
