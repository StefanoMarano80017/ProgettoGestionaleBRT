/**
 * aggregatePeriod
 * Generic aggregation over a weekly / monthly / yearly period.
 *
 * @param {Object} params
 * @param {Object} params.tsMap - { employeeId: { 'YYYY-MM-DD': [ { commessa, ore } ] } }
 * @param {string[]} params.employeeIds - employees included in aggregation
 * @param {'week'|'month'|'year'} params.period
 * @param {Date} [params.referenceDate] - base date for week calculations (defaults today or selDate)
 * @param {number} params.year - numeric year (for month/year periods)
 * @param {number} params.month - month index 0..11 (for month period)
 * @param {boolean} [params.includeAbsences] - if true include FERIE/MALATTIA/PERMESSO rows
 * @returns {{ period: string, range: { start: Date, end: Date }, rows: Array<{commessa:string, ore:number}>, total:number, absences?: { ferie:{hours:number,days:number}, malattia:{hours:number,days:number}, permesso:{hours:number,days:number} } }}
 */
export function aggregatePeriod({ tsMap = {}, employeeIds = [], period = 'month', referenceDate, year, month, includeAbsences = false }) {
  const today = new Date();
  const ref = referenceDate instanceof Date ? new Date(referenceDate) : (referenceDate ? new Date(referenceDate) : new Date(today));
  ref.setHours(0,0,0,0);

  // Helpers
  const clone = (d) => new Date(d.getTime());
  const startOfWeek = (d) => {
    const dt = clone(d);
    const day = dt.getDay(); // 0 Sun .. 6 Sat; use Monday as first day
    const diff = (day + 6) % 7; // convert so Monday=0
    dt.setDate(dt.getDate() - diff);
    dt.setHours(0,0,0,0);
    return dt;
  };
  const endOfWeek = (s) => { const e = clone(s); e.setDate(e.getDate() + 6); return e; };
  const startOfMonth = (y,m) => { const d = new Date(y, m, 1); d.setHours(0,0,0,0); return d; };
  const endOfMonth = (y,m) => { const d = new Date(y, m + 1, 0); d.setHours(0,0,0,0); return d; };
  const startOfYear = (y) => { const d = new Date(y,0,1); d.setHours(0,0,0,0); return d; };
  const endOfYear = (y) => { const d = new Date(y,11,31); d.setHours(0,0,0,0); return d; };
  const pad = (n) => (n < 10 ? `0${n}` : `${n}`);

  let start; let end;
  if (period === 'week') {
    start = startOfWeek(ref);
    end = endOfWeek(start);
  } else if (period === 'year') {
    const y = (typeof year === 'number' ? year : ref.getFullYear());
    start = startOfYear(y);
    end = endOfYear(y);
  } else { // month
    const y = (typeof year === 'number' ? year : ref.getFullYear());
    const m = (typeof month === 'number' ? month : ref.getMonth());
    start = startOfMonth(y, m);
    end = endOfMonth(y, m);
  }

  // Build set of date keys in range for quick membership test
  const dateKeys = new Set();
  for (let d = new Date(start); d.getTime() <= end.getTime(); d.setDate(d.getDate()+1)) {
    dateKeys.add(`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`);
  }

  const commessaMap = new Map();
  const abs = { ferie:{hours:0,days:0}, malattia:{hours:0,days:0}, permesso:{hours:0,days:0} };
  const countedAbsDays = { ferie:new Set(), malattia:new Set(), permesso:new Set() };

  const isAbs = (c) => ['FERIE','MALATTIA','PERMESSO'].includes(String(c).toUpperCase());

  employeeIds.forEach(empId => {
    const empTs = tsMap[empId] || {};
    Object.entries(empTs).forEach(([key, list]) => {
      if (!dateKeys.has(key)) return;
      if (!Array.isArray(list)) return;
      list.forEach(rec => {
        const ore = Number(rec?.ore) || 0;
        if (!ore) return;
        const commessa = rec?.commessa;
        if (!commessa) return;
        const upper = String(commessa).toUpperCase();
        if (includeAbsences && isAbs(upper)) {
          if (upper === 'FERIE') {
            abs.ferie.hours += ore; countedAbsDays.ferie.add(key);
          } else if (upper === 'MALATTIA') {
            abs.malattia.hours += ore; countedAbsDays.malattia.add(key);
          } else if (upper === 'PERMESSO') {
            abs.permesso.hours += ore; countedAbsDays.permesso.add(key);
          }
        }
        if (!isAbs(upper)) {
          commessaMap.set(commessa, (commessaMap.get(commessa) || 0) + ore);
        } else if (includeAbsences) {
          // also list absence codes as pseudo-commesse for single employee view
          commessaMap.set(upper, (commessaMap.get(upper) || 0) + ore);
        }
      });
    });
  });

  // finalize absence day counts
  if (includeAbsences) {
    abs.ferie.days = countedAbsDays.ferie.size;
    abs.malattia.days = countedAbsDays.malattia.size;
    abs.permesso.days = countedAbsDays.permesso.size;
  }

  const rows = Array.from(commessaMap.entries())
    .map(([commessa, ore]) => ({ commessa, ore }))
    .sort((a,b) => a.commessa.localeCompare(b.commessa));
  const total = rows.reduce((s,r) => s + r.ore, 0);
  const result = { period, range: { start, end }, rows, total };
  if (includeAbsences) result.absences = abs;
  return result;
}

export default aggregatePeriod;
