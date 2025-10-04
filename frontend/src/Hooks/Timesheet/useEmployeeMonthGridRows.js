import { useMemo } from 'react';
import { getDayStatus } from './calendar/useDayStatus';

// rows: elenco dipendenti [{ id, dipendente, azienda }]
// tsMap: { [empId]: { 'YYYY-MM-DD': [records], 'YYYY-MM-DD_segnalazione': {...} } }
export default function useEmployeeMonthGridRows({ rows = [], tsMap = {}, year, month, today = new Date() }) {
  const daysInMonth = useMemo(() => new Date(year, month + 1, 0).getDate(), [year, month]);

  const visualRows = useMemo(() => {
    return rows.map(r => {
      const empTs = tsMap[r.id] || {};
      const cells = [];
      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        const dayData = empTs[dateStr] || [];
        const segnalazione = empTs[`${dateStr}_segnalazione`];
        const totalHours = dayData.reduce((s, e) => s + Number(e.ore || 0), 0);
        const ferie = dayData.some(e => e.commessa === 'FERIE');
        const malattia = dayData.some(e => e.commessa === 'MALATTIA');
        const permesso = dayData.some(e => e.commessa === 'PERMESSO');
  const statusObj = getDayStatus(dayData, segnalazione, dateStr, today);
        const tooltipLines = [
          dayData.length ? `Ore totali: ${totalHours}h` : 'Nessun inserimento',
          ...dayData.map(e => `${e.commessa}: ${e.ore}h${e.descrizione ? ` — ${e.descrizione}` : ''}`),
          segnalazione ? `Segnalazione: ${segnalazione.descrizione}` : null,
        ].filter(Boolean);
        cells.push({
          dateStr,
            day: d,
          totalHours,
          ferie, malattia, permesso,
          segnalazione,
          status: statusObj.status,
          statusLabel: statusObj.label,
          tooltipContent: tooltipLines.join('\n'),
        });
      }
      return { ...r, cells };
    });
  }, [rows, tsMap, year, month, daysInMonth, today]);

  return { daysInMonth, visualRows };
}
