import { useMemo } from 'react';
import { getDayStatus } from './useDayStatus';

/** Unifies calendar variants.
 * mode:
 *  - 'linear' -> days of month only
 *  - 'grid42' -> 42-cell matrix (weeks * 7) with padding
 */
export function useCalendarModel({ year, month, data = {}, mode = 'linear', today = new Date() }) {
  return useMemo(() => {
    if (year == null || month == null) return { days: [] };
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const buildDay = (d, inMonth = true) => {
      if (!inMonth) return { key: `pad-${d}`, isPadding: true };
      const dateStr = `${year}-${String(month + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const dayData = data[dateStr] || [];
      const segnalazione = data[`${dateStr}_segnalazione`];
      const status = getDayStatus(dayData, segnalazione, dateStr, today);
      const totalHours = dayData.reduce((s,r)=>s+Number(r.ore||0),0);
      return { key: dateStr, dateStr, day: d, status: status.status, statusLabel: status.label, totalHours, segnalazione, dayData };
    };

    if (mode === 'linear') {
      return { days: Array.from({ length: daysInMonth }, (_,i)=>buildDay(i+1,true)), mode };
    }

    // grid42
    const firstDow = new Date(year, month, 1).getDay(); // 0=Sun
    const startOffset = (firstDow + 6) % 7; // Monday=0
    const cells = [];
    // padding before
    for (let i=0;i<startOffset;i++) cells.push(buildDay(`pre-${i}`, false));
    // real days
    for (let d=1; d<=daysInMonth; d++) cells.push(buildDay(d,true));
    // padding after
    while (cells.length < 42) cells.push(buildDay(`post-${cells.length}`, false));
    return { days: cells, mode };
  }, [year, month, data, mode, today]);
}
export default useCalendarModel;
