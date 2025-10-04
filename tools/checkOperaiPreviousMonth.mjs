import { operaioPersonalMock, pmGroupsMock, OPERAI } from '../frontend/src/mocks/ProjectMock.js';

function sumHoursForOpOnDate(opId, dateKey) {
  let total = 0;
  const personal = operaioPersonalMock?.[opId]?.[dateKey] || [];
  personal.forEach(p => total += Number(p.ore) || 0);
  Object.values(pmGroupsMock).forEach(g => {
    const list = g.timesheet?.[dateKey] || [];
    list.forEach(entry => { total += Number(entry.assegnazione?.[opId] || 0); });
  });
  return total;
}

function checkPreviousMonthComplete() {
  const today = new Date();
  const prev = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const y = prev.getFullYear();
  const m = prev.getMonth();
  const lastDay = new Date(y, m + 1, 0).getDate();
  const missing = [];
  for (let day = 1; day <= lastDay; day++) {
    const d = new Date(y, m, day);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    if (isWeekend) continue;
    OPERAI.forEach(op => {
      const total = sumHoursForOpOnDate(op.id, key);
      if (total !== 8) missing.push({ opId: op.id, date: key, total });
    });
  }
  return missing;
}

const res = checkPreviousMonthComplete();
if (res.length === 0) console.log('Previous month complete for all operai');
else {
  console.log('Missing entries for previous month:');
  res.forEach(r => console.log(`${r.opId} ${r.date} => ${r.total}h`));
}
