// Utility: check completeness of timesheet for a given id in a given month/year
export function getMonthDays(year, month) {
  const arr = [];
  const lastDay = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= lastDay; d++) {
    const dt = new Date(year, month, d);
    arr.push(dt);
  }
  return arr;
}

const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
const toKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// Check completeness: tsMap is object { id: { 'YYYY-MM-DD': [records] } }
// Returns array of missing date keys (working days where total hours < 8)
export function checkMonthCompletenessForId({ tsMap = {}, id, year, month, isHoliday = () => false }) {
  const days = getMonthDays(year, month);
  const missing = [];
  const map = tsMap || {};
  for (const d of days) {
    // skip weekends
    const wk = d.getDay();
    if (wk === 0 || wk === 6) continue;
    const key = toKey(d);
    if (isHoliday(key)) continue;
    const list = (map[id] && map[id][key]) || [];
    let total = 0;
    (list || []).forEach(r => { total += Number(r?.ore || 0); });
    if (total < 8) missing.push({ date: key, total });
  }
  return missing;
}

export default checkMonthCompletenessForId;
