import { getAllEmployeeTimesheets } from "@mocks/ProjectMock";

const isWorkCode = (c) => c && !["FERIE", "MALATTIA", "PERMESSO"].includes(String(c).toUpperCase());
const sameMonth = (dateKey, year, month0) => {
  const [yy, mm] = dateKey.split("-").map(Number);
  return yy === year && mm === month0 + 1;
};

// Aggregato mensile per un dipendente: totale e per-commessa
export async function getEmployeeMonthSummary(employeeId, year, month) {
  const tsMap = await getAllEmployeeTimesheets();
  const ts = tsMap[employeeId] || {};
  const byCommessa = new Map();
  let total = 0;

  Object.entries(ts).forEach(([key, records]) => {
    if (key.endsWith("_segnalazione")) return;
    if (!sameMonth(key, year, month)) return;
    (records || []).forEach((r) => {
      const ore = Number(r?.ore || 0);
      if (!isWorkCode(r?.commessa) || ore <= 0) return;
      total += ore;
      byCommessa.set(r.commessa, (byCommessa.get(r.commessa) || 0) + ore);
    });
  });

  const commesse = Array.from(byCommessa.entries())
    .map(([commessa, ore]) => ({ commessa, ore }))
    .sort((a, b) => a.commessa.localeCompare(b.commessa));

  return new Promise((resolve) => setTimeout(() => resolve({ total, commesse }), 120));
}

// Aggregato mensile globale per commessa (su un insieme di dipendenti filtrato)
export async function getGlobalMonthByCommessa({ year, month, employeeIds = [], filterCommessa = "" }) {
  const tsMap = await getAllEmployeeTimesheets();
  const set = new Set(employeeIds);
  const agg = new Map();

  Object.entries(tsMap).forEach(([empId, ts]) => {
    if (set.size && !set.has(empId)) return;
    Object.entries(ts || {}).forEach(([key, records]) => {
      if (key.endsWith("_segnalazione")) return;
      if (!sameMonth(key, year, month)) return;
      (records || []).forEach((r) => {
        const ore = Number(r?.ore || 0);
        if (!isWorkCode(r?.commessa) || ore <= 0) return;
        agg.set(r.commessa, (agg.get(r.commessa) || 0) + ore);
      });
    });
  });

  let rows = Array.from(agg.entries())
    .map(([commessa, ore]) => ({ commessa, ore }))
    .sort((a, b) => a.commessa.localeCompare(b.commessa));

  if (filterCommessa.trim()) {
    const needle = filterCommessa.trim().toLowerCase();
    rows = rows.filter((r) => r.commessa.toLowerCase().includes(needle));
  }

  return new Promise((resolve) => setTimeout(() => resolve(rows), 120));
}