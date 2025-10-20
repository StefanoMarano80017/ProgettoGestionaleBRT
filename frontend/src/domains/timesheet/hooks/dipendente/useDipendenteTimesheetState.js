import { useCallback, useMemo, useState } from 'react';
import { getRangeForPeriod, enumerateDateKeys, toDateKey, parseDateKey } from '@domains/timesheet/components/admin-grid/utils/periodUtils';
import { findUserById } from '@mocks/UsersMock';
import { useTimesheetContext } from '../TimesheetContext.js';
import useTimesheetStaging from '../staging/useTimesheetStaging.js';
import useStagedMetaMap from '../staging/useStagedMetaMap.js';
import useDayEditor from '../useDayEditor.js';
import useEmployeeTimesheetLoader from '../useEmployeeTimesheetLoader.js';
import useStableMergedDataMap from '../useStableMergedDataMap.js';
import useReferenceData from '../useReferenceData.js';
import useBadgeData from '../useBadgeData.js';

/**
 * Centralised state and data orchestration for Dipendente timesheet page.
 * Encapsulates all data-loading hooks and memoised computations so that
 * the page component can focus on composition.
 */
export function useDipendenteTimesheetState(employeeId) {
  const ctx = useTimesheetContext();
  const staging = useTimesheetStaging();
  const stagedMetaAll = useStagedMetaMap(staging);
  const dayEditor = useDayEditor();

  // Trigger data loading for the current employee
  useEmployeeTimesheetLoader(employeeId);

  // Base references
  const todayRef = useMemo(() => new Date(), []);
  const todayKey = useMemo(() => toDateKey(todayRef), [todayRef]);

  const [selectedDay, setSelectedDay] = useState(todayKey);
  const [period, setPeriod] = useState('none');

  const defaultRefDate = useMemo(() => {
    const year = Number.isFinite(ctx?.year) ? ctx.year : todayRef.getFullYear();
    const month = Number.isFinite(ctx?.month) ? ctx.month : todayRef.getMonth();
    return new Date(year, month, 1);
  }, [ctx?.year, ctx?.month, todayRef]);

  const { mergedData } = useStableMergedDataMap({
    dataMap: ctx?.dataMap || {},
    staging,
    employeeId,
    mode: 'single',
  });

  const stagedMeta = useMemo(() => stagedMetaAll?.[employeeId] || {}, [stagedMetaAll, employeeId]);

  const isBadgiatoToday = useMemo(
    () => Boolean(mergedData?.[todayKey]?.length),
    [mergedData, todayKey]
  );

  const badgeData = useBadgeData(employeeId, isBadgiatoToday);

  const { commesse: commesseList = [], loading: commesseLoading } = useReferenceData({
    commesse: true,
    personale: false,
    pmGroups: false,
    employeeId,
  });

  const selectedDate = useMemo(() => parseDateKey(selectedDay), [selectedDay]);
  const isSelectedInCurrentMonth = useMemo(() => {
    if (!selectedDate) return false;
    return (
      selectedDate.getFullYear() === defaultRefDate.getFullYear() &&
      selectedDate.getMonth() === defaultRefDate.getMonth()
    );
  }, [selectedDate, defaultRefDate]);

  const refDate = useMemo(() => {
    if (period === 'none') {
      return selectedDate || defaultRefDate;
    }
    if (selectedDate && isSelectedInCurrentMonth) {
      return selectedDate;
    }
    return defaultRefDate;
  }, [period, selectedDate, isSelectedInCurrentMonth, defaultRefDate]);

  const periodRange = useMemo(() => {
    if (period === 'none') return null;
    return getRangeForPeriod(period, refDate);
  }, [period, refDate]);

  const highlightedDays = useMemo(() => {
    if (!periodRange) return new Set();
    const keys = enumerateDateKeys(periodRange);
    const activeYear = Number.isFinite(ctx?.year) ? ctx.year : refDate.getFullYear();
    const activeMonth = Number.isFinite(ctx?.month) ? ctx.month : refDate.getMonth();
    const monthKey = `${activeYear}-${String(activeMonth + 1).padStart(2, '0')}`;
    return new Set(keys.filter((key) => key.startsWith(monthKey)));
  }, [periodRange, ctx?.year, ctx?.month, refDate]);

  const employeeName = useMemo(() => {
    const lookupId = dayEditor.employeeId || employeeId;
    const user = findUserById(lookupId);
    if (user) return `${user.nome} ${user.cognome}`;
    return lookupId || employeeId;
  }, [dayEditor.employeeId, employeeId]);

  const handleDaySelect = useCallback((day) => {
    console.log(`Day selected: ${day} (day of week: ${new Date(day).getDay()})`);
    setSelectedDay(day);
  }, []);

  const handleDayDoubleClick = useCallback((day) => {
    setSelectedDay(day);
    dayEditor.openEditor(employeeId, day);
  }, [dayEditor, employeeId]);

  return {
    mergedData,
    selectedDay,
    onDaySelect: handleDaySelect,
    onDayDoubleClick: handleDayDoubleClick,
    period,
    onPeriodChange: setPeriod,
    refDate,
    highlightedDays,
    stagedMeta,
    commesseList,
    commesseLoading,
    badgeData,
    employeeName,
    dialogState: {
      open: dayEditor.isOpen,
      onClose: dayEditor.closeEditor,
      date: dayEditor.date,
      employeeId: dayEditor.employeeId,
    },
  };
}

export default useDipendenteTimesheetState;
