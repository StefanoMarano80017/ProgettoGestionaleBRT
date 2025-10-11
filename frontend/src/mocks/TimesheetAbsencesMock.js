// Mock helper per assenze (FERIE / MALATTIA / PERMESSO)
// Usa i dati già presenti in getAllEmployeeTimesheets() (ProjectMock)

import { getAllEmployeeTimesheets, NON_WORK } from '@mocks/ProjectMock';
import { findUserById } from '@mocks/UsersMock';

function isWithinMonth(dateKey, year, month0) {
  const [yy, mm] = dateKey.split('-').map(Number);
  return yy === year && mm === month0 + 1;
}

function inRange(dateKey, fromKey, toKey) {
  const d = new Date(dateKey);
  return d >= new Date(fromKey) && d <= new Date(toKey);
}

/**
 * Ritorna il riepilogo assenze per mese per un set di dipendenti
 * @param {Object} params { year, month, employeeIds=[] }
 */
export async function getAbsenceSummary({ year, month, employeeIds = [] }) {
  const all = await getAllEmployeeTimesheets();
  await new Promise((r) => setTimeout(r, 80));

  const ids = (employeeIds && employeeIds.length) ? employeeIds : Object.keys(all);

  const results = [];

  for (const empId of ids) {
    const ts = all[empId] || {};
    const user = findUserById(empId) || {};

  const totals = { FERIE: 0, MALATTIA: 0, PERMESSO: 0, ROL: 0, total: 0 };
  const hoursPerType = { FERIE: [], MALATTIA: [], PERMESSO: [], ROL: [] };
    const daysSeen = new Set();

    Object.entries(ts).forEach(([dateKey, records]) => {
      if (dateKey.endsWith('_segnalazione')) return;
      if (!isWithinMonth(dateKey, year, month)) return;
      (records || []).forEach((r) => {
        const code = String(r?.commessa || '').toUpperCase();
    if (!NON_WORK.has(code)) return;
        const ore = Number(r?.ore || 0) || 0;
        if (ore <= 0) return;
        totals[code] += ore;
        totals.total += ore;
        daysSeen.add(dateKey);
        hoursPerType[code].push({ date: dateKey, ore });
      });
    });

    results.push({
      employeeId: empId,
      employeeName: user ? `${user.nome || user.name || ''} ${user.cognome || ''}`.trim() : empId,
      azienda: user?.azienda || null,
      period: { year, month },
      totals,
      daysCount: daysSeen.size,
      hoursPerType,
    });
  }

  return results;
}

/**
 * Ritorna il ledger giornaliero delle assenze per un dipendente in mese
 * @param {Object} params { year, month, employeeId }
 */
export async function getAbsenceLedger({ year, month, employeeId }) {
  const all = await getAllEmployeeTimesheets();
  await new Promise((r) => setTimeout(r, 60));

  const ts = (all[employeeId] || {});
  const ledger = {};

  Object.entries(ts).forEach(([dateKey, records]) => {
    if (dateKey.endsWith('_segnalazione')) return;
    if (!isWithinMonth(dateKey, year, month)) return;
    (records || []).forEach((r) => {
      const code = String(r?.commessa || '').toUpperCase();
  if (!NON_WORK.has(code)) return;
      const ore = Number(r?.ore || 0) || 0;
      if (ore <= 0) return;
      if (!ledger[dateKey]) ledger[dateKey] = [];
      ledger[dateKey].push({ type: code, ore, descrizione: r?.descrizione });
    });
  });

  return ledger;
}

/**
 * Ritorna riepilogo assenze su range arbitrario [from, to] (ISO date strings)
 * @param {Object} params { from, to, employeeIds = [] }
 */
export async function getAbsenceRangeSummary({ from, to, employeeIds = [] }) {
  const all = await getAllEmployeeTimesheets();
  await new Promise((r) => setTimeout(r, 100));

  const fromKey = new Date(from);
  const toKey = new Date(to);
  if (isNaN(fromKey) || isNaN(toKey)) throw new Error('Invalid from/to dates');

  const ids = (employeeIds && employeeIds.length) ? employeeIds : Object.keys(all);
  const results = [];

  for (const empId of ids) {
    const ts = all[empId] || {};
    const user = findUserById(empId) || {};

  const totals = { FERIE: 0, MALATTIA: 0, PERMESSO: 0, ROL: 0, total: 0 };
  const hoursPerType = { FERIE: [], MALATTIA: [], PERMESSO: [], ROL: [] };
    const daysSeen = new Set();

    Object.entries(ts).forEach(([dateKey, records]) => {
      if (dateKey.endsWith('_segnalazione')) return;
      if (!inRange(dateKey, from, to)) return;
      (records || []).forEach((r) => {
        const code = String(r?.commessa || '').toUpperCase();
    if (!NON_WORK.has(code)) return;
        const ore = Number(r?.ore || 0) || 0;
        if (ore <= 0) return;
        totals[code] += ore;
        totals.total += ore;
        daysSeen.add(dateKey);
        hoursPerType[code].push({ date: dateKey, ore });
      });
    });

    results.push({
      employeeId: empId,
      employeeName: user ? `${user.nome || user.name || ''} ${user.cognome || ''}`.trim() : empId,
      azienda: user?.azienda || null,
      period: { from, to },
      totals,
      daysCount: daysSeen.size,
      hoursPerType,
    });
  }

  return results;
}

export default {
  getAbsenceSummary,
  getAbsenceLedger,
  getAbsenceRangeSummary,
};

/**
 * Ritorna il bilancio ferie annuale per i dipendenti richiesti
 * @param {Object} params { year, employeeIds = [], quotaAnnuaHours = 160 }
 */
export async function getVacationBalances({ year, employeeIds = [], quotaAnnuaHours = 160 } = {}) {
  const all = await getAllEmployeeTimesheets();
  await new Promise((r) => setTimeout(r, 80));

  const ids = (employeeIds && employeeIds.length) ? employeeIds : Object.keys(all);
  const results = [];

  for (const empId of ids) {
    const ts = all[empId] || {};
    const user = findUserById(empId) || {};

    // Sum all FERIE in the given year
    let usedHours = 0;
    Object.entries(ts).forEach(([dateKey, records]) => {
      if (dateKey.endsWith('_segnalazione')) return;
      // Ensure year match
      const yy = Number(dateKey.split('-')[0]);
      if (yy !== year) return;
      (records || []).forEach((r) => {
        const code = String(r?.commessa || '').toUpperCase();
        const ore = Number(r?.ore || 0) || 0;
        if (ore <= 0) return;
        if (code === 'FERIE') usedHours += ore;
      });
    });

    const residual = Math.max(0, quotaAnnuaHours - usedHours);

    results.push({
      employeeId: empId,
      employeeName: user ? `${user.nome || user.name || ''} ${user.cognome || ''}`.trim() : empId,
      azienda: user?.azienda || null,
      quotaAnnuaHours: Number(quotaAnnuaHours) || 160,
      usedHours,
      residualHours: residual,
    });
  }

  return results;
}