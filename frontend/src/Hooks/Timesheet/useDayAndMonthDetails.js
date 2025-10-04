import { useState, useCallback } from 'react';
import { useTimesheetApi } from './useTimesheetApi';

export function useDayAndMonthDetails({ tsMap, year, month }) {
  const { api } = useTimesheetApi();
  const [dayRecords, setDayRecords] = useState([]);
  const [daySegnalazione, setDaySegnalazione] = useState(null);
  const [monthSummary, setMonthSummary] = useState({ total: 0, commesse: [] });
  const [detailsReady, setDetailsReady] = useState(false);

  const loadFor = useCallback(async (empRow, dateKey) => {
    if (!empRow || !dateKey) return;
    const empTs = tsMap[empRow.id] || {};
    setDayRecords(empTs[dateKey] || []);
    setDaySegnalazione(empTs[`${dateKey}_segnalazione`] || null);
    const summary = await api.getEmployeeMonthSummary(empRow.id, year, month);
    setMonthSummary(summary);
    setDetailsReady(true);
  }, [tsMap, api, year, month]);

  const loadMonthSummary = useCallback(async (empRow) => {
    if (!empRow) return;
    const summary = await api.getEmployeeMonthSummary(empRow.id, year, month);
    setMonthSummary(summary);
    setDetailsReady(true);
  }, [api, year, month]);

  const refreshCurrent = useCallback(async (selEmp, selDate) => {
    if (!selEmp || !selDate) return;
    await loadFor(selEmp, selDate);
  }, [loadFor]);

  return { dayRecords, daySegnalazione, monthSummary, detailsReady, loadFor, loadMonthSummary, refreshCurrent, setDayRecords, setDaySegnalazione, setMonthSummary };
}
export default useDayAndMonthDetails;
