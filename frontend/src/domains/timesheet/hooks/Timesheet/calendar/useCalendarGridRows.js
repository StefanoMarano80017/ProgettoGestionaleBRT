import { useMemo } from 'react';
import { getDayStatus } from './useDayStatus';
import formatDayTooltip from '@domains/timesheet/components/calendar/formatDayTooltip';

// Hook generico per costruire le righe (array di giorni) per un calendario mensile semplice.
// data: { 'YYYY-MM-DD': [records], 'YYYY-MM-DD_segnalazione': {...} }
export default function useCalendarGridRows({ data = {}, year, month, today = new Date() }) {
  const rows = useMemo(() => {
    if (year == null || month == null) return [];
    const lastDay = new Date(year, month + 1, 0).getDate();
    const out = [];
    for (let d = 1; d <= lastDay; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const dayData = data[dateStr] || [];
      const segnalazione = data[`${dateStr}_segnalazione`];
      const totalHours = dayData.reduce((s, r) => s + Number(r.ore || 0), 0);
      const ferie = dayData.some(r => r.commessa === 'FERIE');
      const malattia = dayData.some(r => r.commessa === 'MALATTIA');
      const permesso = dayData.some(r => r.commessa === 'PERMESSO');
  const statusObj = getDayStatus(dayData, segnalazione, dateStr, today);
      // Use shared formatter to produce a React node for tooltip content
      const tooltipContent = formatDayTooltip(dayData, segnalazione, totalHours);
      out.push({
        day: d,
        dateStr,
        totalHours,
        ferie,
        malattia,
        permesso,
        segnalazione,
  status: statusObj.status,
  statusLabel: statusObj.label,
        tooltipContent,
      });
    }
    return out;
  }, [data, year, month, today]);

  return { rows };
}
