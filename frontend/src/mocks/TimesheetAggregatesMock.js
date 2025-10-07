import { getAllEmployeeTimesheets, NON_WORK, isWorkCode as _isWorkCode } from "@mocks/ProjectMock";
import { ROLES } from "@mocks/UsersMock";
import { rolesWithPersonalEntries } from "@domains/timesheet/hooks/utils/roleCapabilities.js";

// Reuse centralized non-work logic
const isWorkCode = (c) => _isWorkCode(c);

const sameMonth = (dateKey, year, month0) => {
  const [yy, mm] = dateKey.split("-").map(Number);
  return yy === year && mm === month0 + 1;
};

// Aggregato mensile per un dipendente: totale e per-commessa
// FIRMA INALTERATA - mantiene compatibilità completa con codice esistente
export async function getEmployeeMonthSummary(employeeId, year, month, opts = {}) {
  const tsMap = await getAllEmployeeTimesheets();
  const ts = tsMap[employeeId] || {};
  const byCommessa = new Map();
  let total = 0;
  const includeNonWork = Boolean(opts.includeNonWork);
  const nonWorkCounts = { total: 0 };
  // initialize counters for known NON_WORK codes (keeps future-proof for ROL etc.)
  Array.from(NON_WORK).forEach((k) => { nonWorkCounts[k] = 0; });

  Object.entries(ts).forEach(([key, records]) => {
    if (key.endsWith("_segnalazione")) return;
    if (!sameMonth(key, year, month)) return;
    (records || []).forEach((r) => {
      const ore = Number(r?.ore || 0);
      const codice = String(r?.commessa || '').toUpperCase();
      // Non-work handling
      if (!isWorkCode(codice)) {
        if (includeNonWork && ore > 0) {
          nonWorkCounts.total += ore;
          if (nonWorkCounts.hasOwnProperty(codice)) nonWorkCounts[codice] += ore;
        }
        return;
      }
      // Ignore invalid hours
      if (ore <= 0) return;
      
      // Defensive: only count if employee role allowed personal entries (for future role injection)
      // In current mock dataset we don't store role on entries; assumption: employeeId represents a personal-entry role.
      // If future enrichment adds r.userRole, enforce rolesWithPersonalEntries here:
      if (r.userRole && !rolesWithPersonalEntries.has(r.userRole)) return;
      
      // I campi opzionali (servizioId, sottocommessaId, note, etc.) sono ignorati per gli aggregati
      // TODO: Future enhancement - breakdown by servizioId per analisi dettagliate per servizio
      total += ore;
      byCommessa.set(r.commessa, (byCommessa.get(r.commessa) || 0) + ore);
    });
  });

  const commesse = Array.from(byCommessa.entries())
    .map(([commessa, ore]) => ({ commessa, ore }))
    .sort((a, b) => a.commessa.localeCompare(b.commessa));

  const result = { total, commesse };
  if (includeNonWork) result.nonWork = nonWorkCounts;

  return new Promise((resolve) => setTimeout(() => resolve(result), 120));
}

// Aggregato mensile globale per commessa (su un insieme di dipendenti filtrato)
// FIRMA INALTERATA - mantiene compatibilità completa con codice esistente
export async function getGlobalMonthByCommessa({ year, month, employeeIds = [], filterCommessa = "" }, opts = {}) {
  const tsMap = await getAllEmployeeTimesheets();
  const set = new Set(employeeIds);
  const agg = new Map();
  const includeNonWork = Boolean(opts.includeNonWork);
  const nonWorkCounts = { total: 0 };
  Array.from(NON_WORK).forEach((k) => { nonWorkCounts[k] = 0; });

  Object.entries(tsMap).forEach(([empId, ts]) => {
    if (set.size && !set.has(empId)) return;
    Object.entries(ts || {}).forEach(([key, records]) => {
      if (key.endsWith("_segnalazione")) return;
      if (!sameMonth(key, year, month)) return;
      (records || []).forEach((r) => {
        const ore = Number(r?.ore || 0);
        const codice = String(r?.commessa || '').toUpperCase();
        // Non-work handling
        if (!isWorkCode(codice)) {
          if (includeNonWork && ore > 0) {
            nonWorkCounts.total += ore;
            if (nonWorkCounts.hasOwnProperty(codice)) nonWorkCounts[codice] += ore;
          }
          return;
        }
        if (ore <= 0) return;
        if (r.userRole && !rolesWithPersonalEntries.has(r.userRole)) return;
        
        // I campi opzionali (servizioId, sottocommessaId, note, etc.) non influiscono sui totali
        // TODO: Future enhancement - aggregazione per servizioId per breakdown dettagliati
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

  // Preserve the original return shape (array of rows).
  // If includeNonWork is requested, attach a nonWork property to the returned array
  // so callers that expect an array still work, while advanced callers can read rows.nonWork.
  if (includeNonWork) {
    rows.nonWork = nonWorkCounts;
  }

  return new Promise((resolve) => setTimeout(() => resolve(rows), 120));
}