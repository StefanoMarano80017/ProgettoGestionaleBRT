import { pmGroupsMock, operaioPersonalMock, OPERAI } from '../frontend/src/mocks/ProjectMock.js';

function sumHoursForOpOnDate(opId, dateKey) {
  let total = 0;
  // personal
  const personal = operaioPersonalMock?.[opId]?.[dateKey] || [];
  personal.forEach(p => total += Number(p.ore) || 0);
  // groups
  Object.values(pmGroupsMock).forEach(g => {
    const list = g.timesheet?.[dateKey] || [];
    list.forEach(entry => { total += Number(entry.assegnazione?.[opId] || 0); });
  });
  return total;
}

function findViolations() {
  const violations = [];
  const dates = new Set();
  Object.values(pmGroupsMock).forEach(g => Object.keys(g.timesheet || {}).forEach(dk => dates.add(dk)));
  // also include personal dates
  Object.keys(operaioPersonalMock || {}).forEach(opId => Object.keys(operaioPersonalMock[opId] || {}).forEach(dk => dates.add(dk)));

  for (const op of OPERAI) {
    for (const d of Array.from(dates)) {
      if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(d)) continue;
      const total = sumHoursForOpOnDate(op.id, d);
      if (total > 8) violations.push({ opId: op.id, date: d, total });
    }
  }
  return violations;
}

const v = findViolations();
if (v.length === 0) {
  console.log('No violations found');
} else {
  console.log('Violations:');
  v.forEach(x => console.log(`${x.opId} ${x.date} => ${x.total}h`));
}
