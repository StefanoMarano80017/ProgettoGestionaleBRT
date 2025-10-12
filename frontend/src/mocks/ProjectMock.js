// Mock giornaliero per dipendenti: genera timesheet per ogni dipendente e commesse assegnate
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ===== CANONICAL PURE HELPERS (STEP 1) =====
/**
 * Canonical sets and helpers for strict business rule enforcement
 */
const NON_WORK = new Set(["FERIE", "MALATTIA", "PERMESSO", "ROL"]);
export { NON_WORK };

const isNonWork = (c) => NON_WORK.has(String(c || "").toUpperCase());
const isWork = (c) => !isNonWork(c);
export const isWorkCode = (c) => isWork(c);

function toCode(s) {
  return String(s || "").toUpperCase();
}

function sumByCode(entries, code) {
  const C = toCode(code);
  return (entries || []).reduce((acc, e) => acc + (toCode(e.commessa) === C ? Number(e.ore) || 0 : 0), 0);
}

/** Consolidate by code (max one row per code), remove 0h */
function consolidateNonWork(entries) {
  const map = new Map(); // code -> hours
  (entries || []).forEach((e) => {
    const code = toCode(e.commessa);
    if (!NON_WORK.has(code)) return;
    const h = Math.max(0, Number(e.ore) || 0);
    if (h <= 0) return;
    map.set(code, (map.get(code) || 0) + h);
  });
  return Array.from(map.entries()).map(([commessa, ore]) => ({ commessa, ore }));
}

/** Clamp/trim work rows so total day (work + nonwork) ≤ 8 */
function trimWorkToCap(workRows, nonWorkHours) {
  let cap = Math.max(0, 8 - (Number(nonWorkHours) || 0));
  if (cap >= 8) return workRows; // no trimming needed
  if (cap <= 0) return [];
  const out = [];
  for (const row of workRows || []) {
    const h = Math.max(0, Number(row.ore) || 0);
    if (h <= 0) continue;
    if (cap <= 0) break;
    const take = Math.min(h, cap);
    out.push({ ...row, ore: take });
    cap -= take;
  }
  return out;
}

// Dipendenti (allineati ai mock UsersMock)
const EMPLOYEES = [
  // DIPENDENTE role (10 employees)
  { id: "emp-001", name: "Mario Rossi", azienda: "BRT" },
  { id: "emp-002", name: "Luigi Bianchi", azienda: "INWAVE" },
  { id: "emp-003", name: "Anna Verdi", azienda: "STEP" },
  { id: "emp-004", name: "Giulia Conti", azienda: "BRT" },
  { id: "emp-005", name: "Marco Neri", azienda: "INWAVE" },
  { id: "emp-006", name: "Elisa Ferri", azienda: "STEP" },
  { id: "emp-007", name: "Paolo Mancini", azienda: "BRT" },
  { id: "emp-008", name: "Sara Galli", azienda: "INWAVE" },
  { id: "emp-009", name: "Davide Moretti", azienda: "STEP" },
  { id: "emp-010", name: "Chiara Riva", azienda: "BRT" },
  // OPERAIO role (16 operai) - Include for admin grid visibility
  { id: "op-001", name: "Luca Operaio", azienda: "BRT" },
  { id: "op-002", name: "Giorgio Operaio", azienda: "BRT" },
  { id: "op-003", name: "Sandro Operaio", azienda: "INWAVE" },
  { id: "op-004", name: "Enrico Operaio", azienda: "STEP" },
  { id: "op-005", name: "Diego Operaio", azienda: "STEP" },
  { id: "op-006", name: "Paolo Operaio", azienda: "BRT" },
  { id: "op-007", name: "Alessio Operaio", azienda: "BRT" },
  { id: "op-008", name: "Michele Operaio", azienda: "INWAVE" },
  { id: "op-009", name: "Stefano Operaio", azienda: "STEP" },
  { id: "op-010", name: "Franco Operaio", azienda: "INWAVE" },
  { id: "op-011", name: "Nicolò Operaio", azienda: "BRT" },
  { id: "op-012", name: "Matteo Operaio", azienda: "BRT" },
  { id: "op-013", name: "Andrea Operaio", azienda: "INWAVE" },
  { id: "op-014", name: "Lorenzo Operaio", azienda: "INWAVE" },
  { id: "op-015", name: "Gianni Operaio", azienda: "STEP" },
  { id: "op-016", name: "Fabio Operaio", azienda: "STEP" },
  // PM_CAMPO role (1 employee)
  { id: "pmc-001", name: "Paolo Campo", azienda: "BRT" },
  // COORDINATORE role (1 employee)
  { id: "coord-001", name: "Cora Dinatore", azienda: "INWAVE" },
];

// Operai (non loggabili) per PM Campo
// NOTE: Ensure UsersMock mirrors this list so PM Campo features can access metadata
export const OPERAI = [
  { id: "op-001", name: "Luca Operaio", azienda: "BRT" },
  { id: "op-002", name: "Giorgio Operaio", azienda: "BRT" },
  { id: "op-003", name: "Sandro Operaio", azienda: "INWAVE" },
  { id: "op-004", name: "Enrico Operaio", azienda: "STEP" },
  { id: "op-005", name: "Diego Operaio", azienda: "STEP" },
  { id: "op-006", name: "Paolo Operaio", azienda: "BRT" },
  { id: "op-007", name: "Alessio Operaio", azienda: "BRT" },
  { id: "op-008", name: "Michele Operaio", azienda: "INWAVE" },
  { id: "op-009", name: "Stefano Operaio", azienda: "STEP" },
  { id: "op-010", name: "Franco Operaio", azienda: "INWAVE" },
  { id: "op-011", name: "Nicolò Operaio", azienda: "BRT" },
  { id: "op-012", name: "Matteo Operaio", azienda: "BRT" },
  { id: "op-013", name: "Andrea Operaio", azienda: "INWAVE" },
  { id: "op-014", name: "Lorenzo Operaio", azienda: "INWAVE" },
  { id: "op-015", name: "Gianni Operaio", azienda: "STEP" },
  { id: "op-016", name: "Fabio Operaio", azienda: "STEP" },
];

// Solo queste commesse principali (per riferimento)
const COMMESSE = ["VS-25-01", "VS-25-02", "VS-25-03"];

// Sottocommesse assegnate per dipendente (dipendenti lavorano su sottocommesse specifiche)
// IMPORTANTE: Questi sono IDs di SOTTOCOMMESSE con tipo di lavoro (DL, INST, PROG, MANUT, RILIEVI)
// EXPANDED TO ALL 17 EMPLOYEES with varied commessa assignments
const EMPLOYEE_COMMESSE = {
  // DIPENDENTE employees (varied assignments across commesse)
  "emp-001": ["VS-25-01-DL", "VS-25-01-INST", "VS-25-03-PROG"], // DL+Collaudo, Installazione, Progettazione
  "emp-002": ["VS-25-01-DL", "VS-25-03-PROG"], // DL+Collaudo, Progettazione
  "emp-003": ["VS-25-02-MANUT"], // Manutenzione Generale
  "emp-004": ["VS-25-01-INST", "VS-25-02-MANUT"], // Installazione, Manutenzione
  "emp-005": ["VS-25-03-PROG"], // Progettazione Completa
  "emp-006": ["VS-25-02-MANUT", "VS-25-03-PROG"], // Manutenzione, Progettazione
  "emp-007": ["VS-25-01-INST"], // Solo Installazione
  "emp-008": ["VS-25-01-DL", "VS-25-02-MANUT"], // DL+Collaudo, Manutenzione
  "emp-009": ["VS-25-03-PROG", "VS-25-01-INST"], // Progettazione, Installazione
  "emp-010": ["VS-25-01-DL", "VS-25-01-INST", "VS-25-02-MANUT"], // DL+Collaudo, Installazione, Manutenzione
  
  // OPERAIO employees (typically installation and maintenance work)
  "op-001": ["VS-25-01-INST", "VS-25-02-MANUT"], // Installazione, Manutenzione
  "op-002": ["VS-25-01-INST"], // Solo Installazione
  "op-003": ["VS-25-02-MANUT"], // Solo Manutenzione
  "op-004": ["VS-25-01-INST", "VS-25-02-MANUT"], // Installazione, Manutenzione
  "op-005": ["VS-25-03-PROG"], // Progettazione (operaio specializzato)
  "op-006": ["VS-25-01-INST", "VS-25-03-PROG"],
  "op-007": ["VS-25-01-INST", "VS-25-02-MANUT"],
  "op-008": ["VS-25-02-MANUT"],
  "op-009": ["VS-25-01-INST"],
  "op-010": ["VS-25-03-PROG", "VS-25-02-MANUT"],
  "op-011": ["VS-25-01-INST", "VS-25-02-MANUT"],
  "op-012": ["VS-25-02-MANUT"],
  "op-013": ["VS-25-03-PROG"],
  "op-014": ["VS-25-01-INST", "VS-25-03-PROG"],
  "op-015": ["VS-25-02-MANUT", "VS-25-03-PROG"],
  "op-016": ["VS-25-01-INST"],
  
  // PM_CAMPO (field project manager - all types of work)
  "pmc-001": ["VS-25-01-DL", "VS-25-01-INST", "VS-25-02-MANUT", "VS-25-03-PROG"], // All sottocommesse
  
  // COORDINATORE (coordinator - oversight and planning)
  "coord-001": ["VS-25-01-DL", "VS-25-03-PROG"], // DL+Collaudo, Progettazione
  
  default: ["VS-25-01-DL", "VS-25-01-INST", "VS-25-03-PROG"], // Default: multiple sottocommesse
};
export { EMPLOYEE_COMMESSE };

const descrizioni = [
  "Sviluppo modulo login",
  "Fix bug dashboard",
  "Analisi requisiti cliente",
  "Refactoring codice",
  "Test funzionali",
  "Aggiornamento documentazione",
  "Meeting con il team",
  "Gestione ticket",
  "Ottimizzazione query",
  "Supporto utente",
];
const segnalazioni = [
  "Ore inserite non conformi alle policy aziendali.",
  "Richiesta giustificazione per assenza.",
  "Verificare dettaglio attività inserite.",
  "Contattare amministrazione per chiarimenti.",
];

const today = new Date();
const start = new Date(today.getFullYear(), 0, 1);
// Genera fino ad oggi (niente dati futuri)
const end = new Date(today);

const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
const toKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const isWeekend = (d) => d.getDay() === 0 || d.getDay() === 6;

// Festivi fissi IT (senza calcolo Pasqua/Lunedì dell’Angelo)
function getFixedHolidays(year) {
  const fixed = [
    [1, 1],   // Capodanno
    [1, 6],   // Epifania
    [4, 25],  // Liberazione
    [5, 1],   // Lavoro
    [6, 2],   // Repubblica
    [8, 15],  // Ferragosto
    [11, 1],  // Ognissanti
    [12, 8],  // Immacolata
    [12, 25], // Natale
    [12, 26], // Santo Stefano
  ];
  const set = new Set();
  fixed.forEach(([m, d]) => {
    const date = new Date(year, m - 1, d);
    set.add(toKey(date));
  });
  return set;
}
const holidaySet = getFixedHolidays(today.getFullYear());

// Timesheet per dipendente: { [employeeId]: { "YYYY-MM-DD": Record[] , "YYYY-MM-DD_segnalazione": {...} } }
export const employeeTimesheetMock = {};

// Timesheet per gruppi (PM Campo)
// Struttura: { [groupId]: { name, members: [opIds], azienda, timesheet: { 'YYYY-MM-DD': [ { commessa, oreTot, assegnazione: { opId: ore } } ] } } }
export const pmGroupsMock = {};

// Timesheet personali per operaio (voci non legate ai gruppi): FERIE/MALATTIA/PERMESSO
// Struttura: { [opId]: { 'YYYY-MM-DD': [ { commessa: 'FERIE'|'MALATTIA'|'PERMESSO', ore } ] } }
export const operaioPersonalMock = {};

export function getOperaioPersonalMap() {
  // Ritorna una copia per evitare mutazioni esterne
  return new Promise((resolve) => setTimeout(() => {
    const copy = {};
    Object.entries(operaioPersonalMock).forEach(([opId, days]) => {
      copy[opId] = {};
      Object.entries(days || {}).forEach(([dk, arr]) => {
        copy[opId][dk] = (arr || []).map((e) => ({ commessa: e.commessa, ore: Number(e.ore) || 0 }));
      });
    });
    resolve(copy);
  }, 80));
}

import { findUserById } from '@mocks/UsersMock';
import { ensureEmployeeBalances, getEmployeeBalances, consumeBalances, refundBalances } from "./TimesheetBalancesMock";

// Initialize balances for all employees
// Realistic annual quotas: PERMESSO ~104h (13 days), ROL ~80h (10 days)
// These reflect typical Italian labor contract allowances
for (const emp of EMPLOYEES) {
  ensureEmployeeBalances(emp.id, { permesso: 104, rol: 80 });
}
for (const op of OPERAI) {
  ensureEmployeeBalances(op.id, { permesso: 104, rol: 80 });
}

console.log('[ProjectMock] Balances initialized: PERMESSO=104h, ROL=80h per employee/operaio');

// STEP 3: REFACTORED SEED GENERATION FOR EMPLOYEES
// NO partial FERIE. Include ROL. No duplicate non-work rows. Respect balances.
for (const emp of EMPLOYEES) {
  const assigned = EMPLOYEE_COMMESSE[emp.id] ?? EMPLOYEE_COMMESSE.default;
  const ts = {};
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const key = toKey(d);
    if (isWeekend(d) || holidaySet.has(key)) continue;

    const dayRecords = [];
    const roll = Math.random();

    // 2% chance: MALATTIA (8h exclusive, no work)
    if (roll < 0.02) {
      dayRecords.push({
        dipendente: emp.name,
        commessa: "MALATTIA",
        ore: 8,
        descrizione: "Malattia",
      });
      // No work, no balances consumed
    }
    // 6% chance: Full-day absence (FERIE or PERMESSO/ROL=8)
    else if (roll < 0.08) {
      if (Math.random() < 0.5) {
        // FERIE 8h
        dayRecords.push({
          dipendente: emp.name,
          commessa: "FERIE",
          ore: 8,
          descrizione: "Giornata di ferie",
        });
      } else {
        // PERMESSO/ROL = 8h (replacement for FERIE)
        // Pick a split limited by balances
        const balances = getEmployeeBalances(emp.id);
        let wantP = getRandomInt(0, 8);
        let wantR = 8 - wantP;
        // Clamp to available balances
        const gotP = Math.min(wantP, balances.permesso);
        const gotR = Math.min(wantR, balances.rol);
        if (gotP + gotR === 8) {
          // Use PERMESSO/ROL
          if (gotP > 0) {
            dayRecords.push({
              dipendente: emp.name,
              commessa: "PERMESSO",
              ore: gotP,
              descrizione: "Permesso giornata intera",
            });
          }
          if (gotR > 0) {
            dayRecords.push({
              dipendente: emp.name,
              commessa: "ROL",
              ore: gotR,
              descrizione: "ROL giornata intera",
            });
          }
          // Consume balances
          try {
            consumeBalances(emp.id, { permesso: gotP, rol: gotR });
          } catch {
            // Insufficient balance, fallback to FERIE
            dayRecords.length = 0;
            dayRecords.push({
              dipendente: emp.name,
              commessa: "FERIE",
              ore: 8,
              descrizione: "Giornata di ferie (fallback)",
            });
          }
        } else {
          // Insufficient balances, use FERIE instead
          dayRecords.push({
            dipendente: emp.name,
            commessa: "FERIE",
            ore: 8,
            descrizione: "Giornata di ferie (fallback)",
          });
        }
      }
      // No work allowed on full-day absence
    }
    // Workday (maybe with partial PERMESSO/ROL)
    else {
      let targetHours = 8;
      let nonWorkHours = 0;

      // Giornata incompleta (~12%)
      if (Math.random() < 0.12) targetHours = getRandomInt(1, 7);

      // 20% chance: add partial PERMESSO/ROL (1-3h) if balances allow
      if (Math.random() < 0.2) {
        const balances = getEmployeeBalances(emp.id);
        let wantP = getRandomInt(0, Math.min(3, targetHours));
        let wantR = getRandomInt(0, Math.min(3 - wantP, targetHours - wantP));
        const gotP = Math.min(wantP, balances.permesso);
        const gotR = Math.min(wantR, balances.rol);
        if (gotP + gotR > 0) {
          if (gotP > 0) {
            dayRecords.push({
              dipendente: emp.name,
              commessa: "PERMESSO",
              ore: gotP,
              descrizione: "Permesso parziale",
            });
          }
          if (gotR > 0) {
            dayRecords.push({
              dipendente: emp.name,
              commessa: "ROL",
              ore: gotR,
              descrizione: "ROL parziale",
            });
          }
          nonWorkHours = gotP + gotR;
          // Consume balances
          try {
            consumeBalances(emp.id, { permesso: gotP, rol: gotR });
          } catch {
            // Should not happen but defensive
            nonWorkHours = 0;
            // Remove entries we just added
            const removeCount = (gotP > 0 ? 1 : 0) + (gotR > 0 ? 1 : 0);
            dayRecords.splice(dayRecords.length - removeCount, removeCount);
          }
        }
      }

      // Fill up to targetHours with work blocks (capped by 8 - nonWorkHours)
      const workCap = Math.max(0, Math.min(targetHours, 8 - nonWorkHours));
      let remaining = workCap;
      while (remaining > 0) {
        const block = getRandomInt(1, Math.min(4, remaining));
        const commessaId =
          assigned[getRandomInt(0, assigned.length - 1)] || COMMESSE[getRandomInt(0, COMMESSE.length - 1)];
        dayRecords.push({
          dipendente: emp.name,
          commessa: commessaId,
          ore: block,
          descrizione: descrizioni[getRandomInt(0, descrizioni.length - 1)],
        });
        remaining -= block;
      }

      // Piccola probabilità di segnalazione amministrativa
      if (Math.random() < 0.03) {
        ts[`${key}_segnalazione`] = {
          descrizione: segnalazioni[getRandomInt(0, segnalazioni.length - 1)],
        };
      }
    }

    if (dayRecords.length > 0) {
      // Consolidate non-work entries (no duplicates)
      const nonWorkEntries = dayRecords.filter((r) => NON_WORK.has(toCode(r.commessa)));
      const workEntries = dayRecords.filter((r) => !NON_WORK.has(toCode(r.commessa)));
      const consolidatedNonWork = consolidateNonWork(nonWorkEntries);
      const nonWorkTotal = consolidatedNonWork.reduce((s, e) => s + e.ore, 0);

      // Trim work entries if needed
      const trimmedWork = trimWorkToCap(workEntries, nonWorkTotal);

      // Merge and enrich
      const finalRecords = [...consolidatedNonWork, ...trimmedWork];
      const userMeta = findUserById(emp.id);
      const role = userMeta?.roles?.[0] || "DIPENDENTE";
      ts[key] = finalRecords.map((r, idx) => ({
        ...r,
        dipendente: emp.name,
        userId: emp.id,
        userRole: role,
        dateKey: key,
        id: `${emp.id}-${key}-${idx}`,
        _id: `${emp.id}-${key}-${idx}`,
      }));
    }
  }

  employeeTimesheetMock[emp.id] = ts;
}

// Per compatibilità: esporta un dataset “default” (emp-001)
export const projectsMock = employeeTimesheetMock["emp-001"] || {};

// API mock asincrone
export function getTimesheetForEmployee(employeeId) {
  return new Promise((resolve) =>
    setTimeout(() => resolve(employeeTimesheetMock[employeeId] || {}), 150)
  );
}

export function getActiveCommesseForEmployee(employeeId) {
  const list = EMPLOYEE_COMMESSE[employeeId] ?? EMPLOYEE_COMMESSE.default;
  return new Promise((resolve) => setTimeout(() => resolve(list.slice()), 120));
}

// NUOVO: elenco dipendenti
export function getEmployees() {
  return new Promise((resolve) =>
    setTimeout(() => resolve(EMPLOYEES.map((e) => ({ ...e }))), 100)
  );
}

// Operai per azienda (per PM Campo)
export function getOperaiByAzienda(azienda) {
  return new Promise((resolve) =>
    setTimeout(() => resolve(OPERAI.filter((o) => !azienda || o.azienda === azienda).map((o) => ({ ...o }))), 80)
  );
}

// NUOVO: tutti i timesheet per tutti i dipendenti
export function getAllEmployeeTimesheets() {
  return new Promise((resolve) =>
    setTimeout(() => resolve({ ...employeeTimesheetMock }), 150)
  );
}

// NUOVO: invio segnalazione a dipendente (mostrata nelle sue pagine)
export function sendSegnalazione(employeeId, dateKey, descrizione) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        if (!employeeTimesheetMock[employeeId]) employeeTimesheetMock[employeeId] = {};
        employeeTimesheetMock[employeeId][`${dateKey}_segnalazione`] = { descrizione };
        resolve({ ok: true });
      } catch (e) {
        reject(e);
      }
    }, 120);
  });
}

// NUOVO: batch save timesheet entries for staging confirmation
export function batchSaveTimesheetEntries(payload) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        payload.forEach(batch => {
          const { employeeId, updates } = batch;
          if (!employeeTimesheetMock[employeeId]) {
            employeeTimesheetMock[employeeId] = {};
          }
          
          updates.forEach(update => {
            const { dateKey, records } = update;
            if (records && records.length > 0) {
                // Add canonical fields to each record
                const enrichedRecords = records.map((r, idx) => ({
                  ...r,
                  userId: employeeId,
                  userRole: 'DIPENDENTE', // default role
                  dateKey: dateKey,
                  id: r.id || `${employeeId}-${dateKey}-${idx}`,
                  _id: r._id || `${employeeId}-${dateKey}-${idx}`,
                }));

                // Defensive check: warn if total hours for the day exceed 8
                // and there are NON_WORK entries (FERIE/MALATTIA/PERMESSO) involved.
                try {
                  const total = enrichedRecords.reduce((s, rec) => s + (Number(rec.ore) || 0), 0);
                  const nonWorkTotal = enrichedRecords
                    .filter((rec) => NON_WORK.has(String(rec.commessa)))
                    .reduce((s, rec) => s + (Number(rec.ore) || 0), 0);
                  const workTotal = total - nonWorkTotal;
                  if (total > 8 && nonWorkTotal > 0) {
                    console.warn(`[ProjectMock] Save collision: employee=${employeeId} date=${dateKey} totalHours=${total} (work=${workTotal} nonWork=${nonWorkTotal}). Non-work entries combined with work exceed 8h.`);
                  }
                } catch (err) {
                  // Never fail the save because of logging issues
                  console.warn('[ProjectMock] Warning check failed', err);
                }

                employeeTimesheetMock[employeeId][dateKey] = enrichedRecords;
            } else {
              // Empty records array means delete the day
              delete employeeTimesheetMock[employeeId][dateKey];
            }
          });
        });
        resolve({ success: true, saved: payload.length });
      } catch (e) {
        reject(e);
      }
    }, 200); // Simulate network delay
  });
}

// === PM CAMPO: Gruppi ===
let nextGroupId = 1;
export function createPmGroup({ name, members = [], azienda }) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const id = `grp-${nextGroupId++}`;
      pmGroupsMock[id] = { id, name, members: members.slice(), azienda, timesheet: {} };
      resolve({ ...pmGroupsMock[id] });
    }, 100);
  });
}

export function listPmGroups(azienda) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const list = Object.values(pmGroupsMock).filter((g) => !azienda || g.azienda === azienda).map((g) => ({ ...g, members: g.members.slice() }));
      resolve(list);
    }, 80);
  });
}

export function updatePmGroup(groupId, { name, members, azienda }) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!pmGroupsMock[groupId]) return reject(new Error("Gruppo non trovato"));
      if (name !== undefined) pmGroupsMock[groupId].name = name;
      if (members !== undefined) pmGroupsMock[groupId].members = members.slice();
      if (azienda !== undefined) pmGroupsMock[groupId].azienda = azienda;
      resolve({ ...pmGroupsMock[groupId], members: pmGroupsMock[groupId].members.slice() });
    }, 100);
  });
}

export function deletePmGroup(groupId) {
  return new Promise((resolve) => {
    setTimeout(() => {
      delete pmGroupsMock[groupId];
      resolve({ ok: true });
    }, 80);
  });
}

// Assegna ore a un gruppo su una commessa in una data, applicando le stesse ore a tutti gli operai
export function assignHoursToGroup({ groupId, dateKey, commessa, oreTot }) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const grp = pmGroupsMock[groupId];
      if (!grp) return reject(new Error("Gruppo non trovato"));
      if (!grp.members || grp.members.length === 0) return reject(new Error("Il gruppo non ha membri"));
      if (!grp.timesheet[dateKey]) grp.timesheet[dateKey] = [];
      const tot = Number(oreTot) || 0;
      // Apply full hours to each member instead of splitting
      const proposed = {};
      grp.members.forEach((opId) => {
        proposed[opId] = tot;
      });
      // Valida rispetto ad altri gruppi + voci personali
      const sumByOp = {};
      Object.values(pmGroupsMock).forEach((g) => {
        const list = g.timesheet?.[dateKey] || [];
        list.forEach((entry) => {
          Object.entries(entry.assegnazione || {}).forEach(([opId, ore]) => {
            sumByOp[opId] = (sumByOp[opId] || 0) + (Number(ore) || 0);
          });
        });
      });
      // Somma voci personali
      Object.keys(proposed).forEach((opId) => {
        const personal = operaioPersonalMock?.[opId]?.[dateKey] || [];
        personal.forEach((p) => {
          sumByOp[opId] = (sumByOp[opId] || 0) + (Number(p.ore) || 0);
        });
      });
      // Aggiungi proposta corrente
      Object.entries(proposed).forEach(([opId, ore]) => {
        sumByOp[opId] = (sumByOp[opId] || 0) + (Number(ore) || 0);
      });
  const violator = Object.entries(sumByOp).find(([, h]) => Number(h) > 8);
    if (violator) return reject(new Error("Superato il limite di 8h considerando anche le voci personali (FERIE/MALATTIA/PERMESSO/ROL). Ridurre le ore totali o riassegnare."));

      grp.timesheet[dateKey].push({ commessa, oreTot: tot, assegnazione: proposed });
      resolve({ ...grp });
    }, 120);
  });
}

// Sovrascrive le voci del gruppo per una data con nuove entries [{ commessa, oreTot }],
// applicando le stesse ore a tutti i membri del gruppo.
export function updateGroupDayEntries({ groupId, dateKey, entries }) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const grp = pmGroupsMock[groupId];
      if (!grp) return reject(new Error("Gruppo non trovato"));
      if (!grp.members || grp.members.length === 0) return reject(new Error("Il gruppo non ha membri"));
      // Build proposal with full hours to each member instead of splitting
      const next = [];
      for (const e of entries || []) {
        const oreTot = Number(e.oreTot) || 0;
        const assegnazione = {};
        grp.members.forEach((opId) => {
          assegnazione[opId] = oreTot;
        });
        next.push({ commessa: e.commessa, oreTot, assegnazione });
      }

      // Valida: nessun operaio deve superare 8h totali nella data (sommando tutti i gruppi)
      const sumByOp = {};
      // Somma ore da altri gruppi nella stessa data
      Object.values(pmGroupsMock).forEach((g) => {
        if (!g.members) return;
        const list = g.timesheet?.[dateKey] || [];
        // Per il gruppo corrente, usa ancora i vecchi dati per somma base (verrà sostituito)
        if (g.id === groupId) return;
        list.forEach((entry) => {
          Object.entries(entry.assegnazione || {}).forEach(([opId, ore]) => {
            sumByOp[opId] = (sumByOp[opId] || 0) + (Number(ore) || 0);
          });
        });
      });
      // Somma voci personali
      grp.members.forEach((opId) => {
        const personal = operaioPersonalMock?.[opId]?.[dateKey] || [];
        personal.forEach((p) => {
          sumByOp[opId] = (sumByOp[opId] || 0) + (Number(p.ore) || 0);
        });
      });
      // Aggiungi proposta next per il gruppo corrente
      next.forEach((entry) => {
        Object.entries(entry.assegnazione || {}).forEach(([opId, ore]) => {
          sumByOp[opId] = (sumByOp[opId] || 0) + (Number(ore) || 0);
        });
      });
      // Verifica limite 8h
  const violator = Object.entries(sumByOp).find(([, h]) => Number(h) > 8);
    if (violator) return reject(new Error("Superato il limite di 8h considerando anche voci personali e altri gruppi (FERIE/MALATTIA/PERMESSO/ROL). Ridurre le ore."));

      // Applica
      grp.timesheet[dateKey] = next;
      resolve({ ...grp });
    }, 120);
  });
}

// Aggiorna le ore per commessa di un singolo operaio in una data, su tutte le squadre che lo includono.
// entries: [{ commessa, ore }]
export function updateOperaioDayAssignments({ opId, dateKey, entries }) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        const wanted = new Map();
        for (const e of entries || []) {
          const ore = Number(e.ore) || 0;
          if (e.commessa) wanted.set(String(e.commessa), ore);
        }
        if (wanted.size === 0) return resolve({ ok: true });

        // Calcola somma finale proposta per l'operaio
        let proposedTotal = 0;
        Object.values(pmGroupsMock).forEach((grp) => {
          if (!grp?.members?.includes(opId)) return;
          const list = grp.timesheet?.[dateKey];
          if (!Array.isArray(list)) return;
          list.forEach((entry) => {
            const base = Number(entry.assegnazione?.[opId] || 0);
            const override = wanted.has(entry.commessa) ? Number(wanted.get(entry.commessa) || 0) : base;
            proposedTotal += override;
          });
        });
        // Somma anche voci personali (FERIE/MALATTIA/PERMESSO)
        const personal = operaioPersonalMock?.[opId]?.[dateKey] || [];
        personal.forEach((p) => { proposedTotal += Number(p.ore) || 0; });
        if (proposedTotal > 8) return reject(new Error("Totale giornaliero > 8h per l'operaio. Ridurre le ore."));

        // Applica modifiche
        Object.values(pmGroupsMock).forEach((grp) => {
          if (!grp?.members?.includes(opId)) return;
          const list = grp.timesheet?.[dateKey];
          if (!Array.isArray(list)) return;
          list.forEach((entry) => {
            if (!wanted.has(entry.commessa)) return;
            if (!entry.assegnazione) entry.assegnazione = {};
            entry.assegnazione[opId] = Number(wanted.get(entry.commessa) || 0);
            entry.oreTot = Object.values(entry.assegnazione).reduce((s, v) => s + (Number(v) || 0), 0);
          });
        });
        resolve({ ok: true });
      } catch (e) {
        reject(e);
      }
    }, 120);
  });
}

// Aggiorna le voci personali (FERIE/MALATTIA/PERMESSO/ROL) per un operaio in una data
// entries: [{ commessa: 'FERIE'|'MALATTIA'|'PERMESSO'|'ROL', ore }]
// STEP 2: STRICT RULE ENFORCEMENT
export function updateOperaioPersonalDay({ opId, dateKey, entries }) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        // A) Sanitize to NON_WORK only (FERIE, MALATTIA, PERMESSO, ROL) with ore>0
        const sanitized = (entries || [])
          .map((e) => ({ commessa: toCode(e.commessa), ore: Number(e.ore) || 0 }))
          .filter((e) => NON_WORK.has(e.commessa) && e.ore > 0);

        // CONSOLIDATE them via consolidateNonWork
        const consolidated = consolidateNonWork(sanitized);

        // B) Compute sums
        const sumF = sumByCode(consolidated, "FERIE");
        const sumM = sumByCode(consolidated, "MALATTIA");
        const sumP = sumByCode(consolidated, "PERMESSO");
        const sumR = sumByCode(consolidated, "ROL");
        const sumPR = sumP + sumR;

        // Helper: compute work hours for opId on dateKey
        const computeWorkHours = () => {
          let workHours = 0;
          Object.values(pmGroupsMock).forEach((grp) => {
            if (!grp?.members?.includes(opId)) return;
            const list = grp.timesheet?.[dateKey] || [];
            list.forEach((entry) => {
              workHours += Number(entry.assegnazione?.[opId] || 0);
            });
          });
          return workHours;
        };

        // RULE A) MALATTIA
        if (sumM > 0) {
          if (sumM !== 8) throw new Error("MALATTIA deve essere 8 ore ed esclusiva.");
          if (sumF > 0 || sumPR > 0) throw new Error("MALATTIA è esclusiva nella giornata.");
          const workHours = computeWorkHours();
          if (workHours > 0) throw new Error("MALATTIA è esclusiva - rimuovere il lavoro assegnato.");
          // Does NOT consume balances
        }
        // RULE B) FERIE
        else if (sumF > 0) {
          if (sumF !== 8) throw new Error("FERIE deve essere 8 ore.");
          if (sumPR > 0) throw new Error("FERIE è esclusiva. Usa PERMESSO/ROL=8 al posto di FERIE, non insieme.");
          const workHours = computeWorkHours();
          if (workHours > 0) throw new Error("FERIE è esclusiva - rimuovere il lavoro assegnato.");
          // Does NOT consume balances
        }
        // RULE C) Full-day PERMESSO/ROL = 8
        else if (sumF === 0 && sumPR === 8) {
          const workHours = computeWorkHours();
          if (workHours > 0) throw new Error("Assenza a giornata intera (PERMESSO/ROL=8h) non può coesistere con lavoro.");
          
          // Refund previous balances for this date
          const prevEntries = operaioPersonalMock[opId]?.[dateKey] || [];
          const prevP = sumByCode(prevEntries, "PERMESSO");
          const prevR = sumByCode(prevEntries, "ROL");
          if (prevP > 0 || prevR > 0) {
            refundBalances(opId, { permesso: prevP, rol: prevR });
          }
          
          // Consume new balances
          consumeBalances(opId, { permesso: sumP, rol: sumR });
        }
        // RULE D) Partial PERMESSO/ROL (0 < sumPR < 8)
        else if (sumF === 0 && sumM === 0 && sumPR > 0 && sumPR < 8) {
          const workHours = computeWorkHours();
          if (workHours + sumPR > 8) {
            throw new Error("Totale giornaliero (lavoro + PERMESSO + ROL) deve essere ≤ 8 ore.");
          }
          
          // Refund previous balances for this date
          const prevEntries = operaioPersonalMock[opId]?.[dateKey] || [];
          const prevP = sumByCode(prevEntries, "PERMESSO");
          const prevR = sumByCode(prevEntries, "ROL");
          if (prevP > 0 || prevR > 0) {
            refundBalances(opId, { permesso: prevP, rol: prevR });
          }
          
          // Consume new balances
          consumeBalances(opId, { permesso: sumP, rol: sumR });
        }
        // RULE E) Empty non-work (clear any existing)
        else if (sumF === 0 && sumM === 0 && sumPR === 0) {
          // Refund previous balances before clearing
          const prevEntries = operaioPersonalMock[opId]?.[dateKey] || [];
          const prevP = sumByCode(prevEntries, "PERMESSO");
          const prevR = sumByCode(prevEntries, "ROL");
          if (prevP > 0 || prevR > 0) {
            refundBalances(opId, { permesso: prevP, rol: prevR });
          }
          
          if (!operaioPersonalMock[opId]) operaioPersonalMock[opId] = {};
          delete operaioPersonalMock[opId][dateKey];
          return resolve({ ok: true });
        }
        // RULE F) Invalid combination
        else {
          throw new Error(
            "Combinazione assenze non valida. Regole: MALATTIA=8 esclusiva; FERIE=8 esclusiva; oppure PERMESSO/ROL parziali (<8) con lavoro; oppure PERMESSO/ROL=8 in sostituzione FERIE."
          );
        }

        // G) Persistence: store consolidated entries (omit codes with 0h)
        if (!operaioPersonalMock[opId]) operaioPersonalMock[opId] = {};
        if (consolidated.length === 0) {
          delete operaioPersonalMock[opId][dateKey];
        } else {
          operaioPersonalMock[opId][dateKey] = consolidated;
        }

        resolve({ ok: true });
      } catch (e) {
        reject(e);
      }
    }, 120);
  });
}

// Seed iniziale per PM Campo: crea alcune squadre e inserisce ore su alcune date
(() => {
  try {
    if (Object.keys(pmGroupsMock).length > 0) return; // già popolato
    const brtOps = OPERAI.filter((o) => o.azienda === "BRT").map((o) => o.id);
    const inwaveOps = OPERAI.filter((o) => o.azienda === "INWAVE").map((o) => o.id);
    const stepOps = OPERAI.filter((o) => o.azienda === "STEP").map((o) => o.id);

    const today = new Date();
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);

    const seedGroup = (id, name, members, azienda, entriesByDate) => {
      pmGroupsMock[id] = { id, name, members: members.slice(0), azienda, timesheet: {} };
      Object.entries(entriesByDate).forEach(([date, entries]) => {
        const list = [];
        for (const e of entries) {
          // Se l'entry fornisce una assegnazione per-operaio, usala; altrimenti riparto uniforme
          if (e.assegnazione) {
            const assegnazione = { ...e.assegnazione };
            const oreTot = Object.values(assegnazione).reduce((s, v) => s + (Number(v) || 0), 0);
            list.push({ commessa: e.commessa, oreTot, assegnazione });
          } else {
            const oreTot = Number(e.oreTot) || 0;
            const perHead = members.length > 0 ? Math.floor(oreTot / members.length) : 0;
            const remainder = members.length > 0 ? oreTot % members.length : 0;
            const assegnazione = {};
            members.forEach((opId, idx) => {
              assegnazione[opId] = perHead + (idx < remainder ? 1 : 0);
            });
            list.push({ commessa: e.commessa, oreTot, assegnazione });
          }
        }
        pmGroupsMock[id].timesheet[date] = list;
      });
    };

    // STEP 3: REFACTORED SEED for operai personal entries
    // NO partial FERIE. Include ROL. No duplicates. Respect balances.
    const seedPersonalForOperai = () => {
      const year = today.getFullYear();
      const start = new Date(year, 0, 1);
      const end = new Date(today);
      OPERAI.forEach((op) => {
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const key = toKey(d);
          if (isWeekend(d) || holidaySet.has(key)) continue;

          const roll = Math.random();
          // 2% MALATTIA (8h exclusive)
          if (roll < 0.02) {
            if (!operaioPersonalMock[op.id]) operaioPersonalMock[op.id] = {};
            operaioPersonalMock[op.id][key] = [{ commessa: "MALATTIA", ore: 8 }];
          }
          // 6% full-day absence: FERIE or PERMESSO/ROL=8
          else if (roll < 0.08) {
            if (Math.random() < 0.5) {
              // FERIE 8h
              if (!operaioPersonalMock[op.id]) operaioPersonalMock[op.id] = {};
              operaioPersonalMock[op.id][key] = [{ commessa: "FERIE", ore: 8 }];
            } else {
              // PERMESSO/ROL = 8 (split randomly, limited by balances)
              const balances = getEmployeeBalances(op.id);
              let wantP = getRandomInt(0, 8);
              let wantR = 8 - wantP;
              const gotP = Math.min(wantP, balances.permesso);
              const gotR = Math.min(wantR, balances.rol);
              if (gotP + gotR === 8) {
                const parts = [];
                if (gotP > 0) parts.push({ commessa: "PERMESSO", ore: gotP });
                if (gotR > 0) parts.push({ commessa: "ROL", ore: gotR });
                if (!operaioPersonalMock[op.id]) operaioPersonalMock[op.id] = {};
                operaioPersonalMock[op.id][key] = parts;
                // Consume balances
                try {
                  consumeBalances(op.id, { permesso: gotP, rol: gotR });
                } catch {
                  // Fallback to FERIE if consume fails
                  operaioPersonalMock[op.id][key] = [{ commessa: "FERIE", ore: 8 }];
                }
              } else {
                // Insufficient, use FERIE
                if (!operaioPersonalMock[op.id]) operaioPersonalMock[op.id] = {};
                operaioPersonalMock[op.id][key] = [{ commessa: "FERIE", ore: 8 }];
              }
            }
          }
          // 20% chance: partial PERMESSO/ROL on workday (1-3h)
          else if (roll < 0.28) {
            const balances = getEmployeeBalances(op.id);
            let wantP = getRandomInt(0, 3);
            let wantR = getRandomInt(0, Math.max(0, 3 - wantP));
            const gotP = Math.min(wantP, balances.permesso);
            const gotR = Math.min(wantR, balances.rol);
            if (gotP + gotR > 0) {
              const parts = [];
              if (gotP > 0) parts.push({ commessa: "PERMESSO", ore: gotP });
              if (gotR > 0) parts.push({ commessa: "ROL", ore: gotR });
              if (!operaioPersonalMock[op.id]) operaioPersonalMock[op.id] = {};
              operaioPersonalMock[op.id][key] = parts;
              // Consume balances
              try {
                consumeBalances(op.id, { permesso: gotP, rol: gotR });
              } catch {
                // Should not happen but defensive: remove entry
                delete operaioPersonalMock[op.id][key];
              }
            }
          }
          // Else: no personal entries (work will be filled by groups)
        }
      });
    };

    // Helper per aggiungere voci giornaliere (tutti i feriali fino ad oggi) considerando le voci personali
    const addDailyEntriesUntilToday = (members, rotateOffset = 0) => {
      const entriesByDate = {};
      const year = today.getFullYear();
      const yearStart = new Date(year, 0, 1);
      const endDate = new Date(today);
      let dayIndex = 0;
      for (let d = new Date(yearStart); d <= endDate; d.setDate(d.getDate() + 1)) {
        const key = toKey(d);
        if (isWeekend(d) || holidaySet.has(key)) continue;
        // Calcola ore disponibili per ogni membro tenendo conto delle voci personali
        // e delle assegnazioni gia' presenti in altri gruppi (pmGroupsMock)
        const assegnazione = {};
        let oreTot = 0;
        members.forEach((opId) => {
          const personal = operaioPersonalMock?.[opId]?.[key] || [];
          const personalH = personal.reduce((s, r) => s + (Number(r.ore) || 0), 0);
          // Somma ore già assegnate a questo operaio da gruppi seedati in precedenza
          let existing = 0;
          Object.values(pmGroupsMock).forEach((g) => {
            const list = g.timesheet?.[key] || [];
            list.forEach((entry) => {
              existing += Number(entry.assegnazione?.[opId] || 0);
            });
          });
          const avail = Math.max(0, 8 - personalH - existing);
          assegnazione[opId] = avail;
          oreTot += avail;
        });
        if (oreTot <= 0) continue; // tutti occupati da personali
        const commessa = COMMESSE[(dayIndex + rotateOffset) % COMMESSE.length];
        entriesByDate[key] = [{ commessa, assegnazione }];
        dayIndex++;
      }
      return entriesByDate;
    };

    const d1 = toKey(today);
    const d0 = toKey(yesterday);

    // BRT - Squadra Alfa (usa primi 2 BRT)
  const brtCore = brtOps.slice(0, Math.min(4, brtOps.length));
  const g1Id = "grp-1";
  const g1Members = brtCore.slice(0, 2);
  // Prima genera personali
  seedPersonalForOperai();

  const g1YearEntries = addDailyEntriesUntilToday(g1Members, 0);
    // aggiungi anche alcuni casi specifici già presenti
    // Instead of forcing oreTot (which may ignore personal entries), compute per-op assignment
    const makeAssignmentForDate = (dateKey, targetPerMember) => {
      const assegn = {};
      g1Members.forEach((opId) => {
        const personal = operaioPersonalMock?.[opId]?.[dateKey] || [];
        const personalH = personal.reduce((s, r) => s + (Number(r.ore) || 0), 0);
        // existing hours from already-seeded groups on this date
        let existing = 0;
        Object.values(pmGroupsMock).forEach((g) => {
          const list = g.timesheet?.[dateKey] || [];
          list.forEach((entry) => {
            existing += Number(entry.assegnazione?.[opId] || 0);
          });
        });
        const allowed = Math.max(0, 8 - personalH - existing);
        assegn[opId] = Math.min(allowed, Number(targetPerMember) || 0);
      });
      return { commessa: "VS-25-01", assegnazione: assegn };
    };
    g1YearEntries[d1] = [makeAssignmentForDate(d1, 8)];
    // for d0 use target 5 hours per member (but still respect personal/other groups)
    const makeAssignmentForDateD0 = (dateKey, targetPerMember) => {
      const assegn = {};
      g1Members.forEach((opId) => {
        const personal = operaioPersonalMock?.[opId]?.[dateKey] || [];
        const personalH = personal.reduce((s, r) => s + (Number(r.ore) || 0), 0);
        let existing = 0;
        Object.values(pmGroupsMock).forEach((g) => {
          const list = g.timesheet?.[dateKey] || [];
          list.forEach((entry) => { existing += Number(entry.assegnazione?.[opId] || 0); });
        });
        const allowed = Math.max(0, 8 - personalH - existing);
        assegn[opId] = Math.min(allowed, Number(targetPerMember) || 0);
      });
      return { commessa: "VS-25-02", assegnazione: assegn };
    };
    g1YearEntries[d0] = [makeAssignmentForDateD0(d0, 5)];
    seedGroup(g1Id, "Squadra Alfa", g1Members, "BRT", g1YearEntries);

    // INWAVE - Squadra Beta (due membri se disponibili)
    const g2Id = "grp-2";
    const g2Members = inwaveOps.slice(0, 2);
  const g2YearEntries = addDailyEntriesUntilToday(g2Members, 1);
    seedGroup(g2Id, "Squadra Beta", g2Members, "INWAVE", g2YearEntries);

    // STEP - Squadra Gamma (due membri)
    const g3Id = "grp-3";
    const g3Members = stepOps.slice(0, 2);
    if (g3Members.length > 0) {
  const g3YearEntries = addDailyEntriesUntilToday(g3Members, 2);
      seedGroup(g3Id, "Squadra Gamma", g3Members, "STEP", g3YearEntries);
    }

    // NUOVO GRUPPO: Squadra Delta (BRT) con altri 2 BRT (evita sovrapposizioni con Alfa se possibile)
    const g4Id = "grp-4";
  const g4Members = brtCore.slice(2, 4);
    if (g4Members.length >= 2) {
  const g4YearEntries = addDailyEntriesUntilToday(g4Members, 0);
      seedGroup(g4Id, "Squadra Delta", g4Members, "BRT", g4YearEntries);
    }

    // Allinea il contatore ID gruppi al prossimo disponibile
    // Ensure previous month completeness: for each operaio, for each working day of the previous month,
    // top-up with personal entries so total hours == 8 (respecting existing group and personal entries).
    const fillPreviousMonthCompleteness = () => {
      const prevMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const y = prevMonthDate.getFullYear();
      const m = prevMonthDate.getMonth();
      const lastDay = new Date(y, m + 1, 0).getDate();
      for (let day = 1; day <= lastDay; day++) {
        const d = new Date(y, m, day);
        const key = toKey(d);
        if (isWeekend(d) || holidaySet.has(key)) continue;
        OPERAI.forEach((op, idx) => {
          const opId = op.id;
          // compute existing total
          let total = 0;
          // personal
          const personal = operaioPersonalMock?.[opId]?.[key] || [];
          personal.forEach(p => { total += Number(p.ore) || 0; });
          // groups
          Object.values(pmGroupsMock).forEach(g => {
            const list = g.timesheet?.[key] || [];
            list.forEach(entry => { total += Number(entry.assegnazione?.[opId] || 0); });
          });
          if (total >= 8) return; // already satisfied
          const needed = 8 - total;
          // create personal top-up (use rotating commessa to vary)
          const commessa = COMMESSE[(day + idx) % COMMESSE.length] || COMMESSE[0];
          if (!operaioPersonalMock[opId]) operaioPersonalMock[opId] = {};
          if (!operaioPersonalMock[opId][key]) operaioPersonalMock[opId][key] = [];
          operaioPersonalMock[opId][key].push({ commessa, ore: needed, descrizione: 'Top-up mese precedente' });
        });
      }
    };
    fillPreviousMonthCompleteness();

    nextGroupId = Math.max(nextGroupId, 5);
  } catch {
    // ignora errori
  }
})();
