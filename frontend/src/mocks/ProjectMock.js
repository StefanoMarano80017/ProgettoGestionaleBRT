// Mock giornaliero per dipendenti: genera timesheet per ogni dipendente e commesse assegnate

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Dipendenti (allineati ai mock UsersMock)
const EMPLOYEES = [
  { id: "emp-001", name: "Mario Rossi", azienda: "BRT" },
  { id: "emp-002", name: "Luigi Bianchi", azienda: "INWAVE" },
  { id: "emp-003", name: "Anna Verdi", azienda: "STEP" },
  { id: "emp-004", name: "Giulia Conti", azienda: "BRT" },
  { id: "emp-005", name: "Marco Neri", azienda: "INWAVE" },
];

// Operai (non loggabili) per PM Campo
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
];

// Solo queste commesse
const COMMESSE = ["VS-25-01", "VS-25-02", "VS-25-03"];

// Commesse assegnate per dipendente (puoi modificare a piacere)
const EMPLOYEE_COMMESSE = {
  "emp-001": ["VS-25-01", "VS-25-02", "VS-25-03"],
  "emp-002": ["VS-25-01", "VS-25-03"],
  "emp-003": ["VS-25-02"],
  "emp-004": ["VS-25-01", "VS-25-02"],
  "emp-005": ["VS-25-03"],
  default: ["VS-25-01", "VS-25-02", "VS-25-03"],
};

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

// Generazione dati per ogni dipendente
for (const emp of EMPLOYEES) {
  const assigned = EMPLOYEE_COMMESSE[emp.id] ?? EMPLOYEE_COMMESSE.default;
  const ts = {};
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const key = toKey(d);
    if (isWeekend(d) || holidaySet.has(key)) continue;

    const dayRecords = [];

    // FERIE (~2%) o MALATTIA (~2%) a giornata intera (solo feriali)
    const roll = Math.random();
    if (roll < 0.02) {
      dayRecords.push({
        dipendente: emp.name,
        commessa: "FERIE",
        ore: 8,
        descrizione: "Giornata di ferie",
      });
    } else if (roll < 0.04) {
      dayRecords.push({
        dipendente: emp.name,
        commessa: "MALATTIA",
        ore: getRandomInt(6, 8),
        descrizione: "Malattia",
      });
    } else {
      // Giorno lavorativo normale
      let targetHours = 8;

      // Giornata incompleta (~12%)
      if (Math.random() < 0.12) targetHours = getRandomInt(0, 7);

      // PERMESSO parziale (1-4h)
      if (targetHours > 0 && Math.random() < 0.2) {
        const permHours = getRandomInt(1, Math.min(4, targetHours));
        dayRecords.push({
          dipendente: emp.name,
          commessa: "PERMESSO",
          ore: permHours,
          descrizione: "Permesso parziale",
        });
        targetHours -= permHours;
      }

      // Riempi il resto con commesse assegnate all'emp
      while (targetHours > 0) {
        const block = getRandomInt(1, Math.min(4, targetHours));
        const commessaId = assigned[getRandomInt(0, assigned.length - 1)] || COMMESSE[getRandomInt(0, COMMESSE.length - 1)];
        dayRecords.push({
          dipendente: emp.name,
          commessa: commessaId,
          ore: block,
          descrizione: descrizioni[getRandomInt(0, descrizioni.length - 1)],
        });
        targetHours -= block;
      }

      // Piccola probabilità di segnalazione amministrativa
      if (Math.random() < 0.03) {
        ts[`${key}_segnalazione`] = {
          descrizione: segnalazioni[getRandomInt(0, segnalazioni.length - 1)],
        };
      }
    }

    if (dayRecords.length > 0) {
      ts[key] = dayRecords;
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

// Assegna ore a un gruppo su una commessa in una data, con riparto uniforme sugli operai
export function assignHoursToGroup({ groupId, dateKey, commessa, oreTot }) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const grp = pmGroupsMock[groupId];
      if (!grp) return reject(new Error("Gruppo non trovato"));
      if (!grp.members || grp.members.length === 0) return reject(new Error("Il gruppo non ha membri"));
      if (!grp.timesheet[dateKey]) grp.timesheet[dateKey] = [];
      const tot = Number(oreTot) || 0;
      const perHead = Math.floor(tot / grp.members.length);
      const remainder = tot % grp.members.length;
      const proposed = {};
      grp.members.forEach((opId, idx) => {
        proposed[opId] = perHead + (idx < remainder ? 1 : 0);
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
      if (violator) return reject(new Error("Superato il limite di 8h considerando le voci personali. Ridurre le ore totali o riassegnare."));

      grp.timesheet[dateKey].push({ commessa, oreTot: tot, assegnazione: proposed });
      resolve({ ...grp });
    }, 120);
  });
}

// Sovrascrive le voci del gruppo per una data con nuove entries [{ commessa, oreTot }],
// ricalcolando la distribuzione per i membri del gruppo.
export function updateGroupDayEntries({ groupId, dateKey, entries }) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const grp = pmGroupsMock[groupId];
      if (!grp) return reject(new Error("Gruppo non trovato"));
      if (!grp.members || grp.members.length === 0) return reject(new Error("Il gruppo non ha membri"));
      // Costruisci proposta "next" con riparto uniforme
      const next = [];
      for (const e of entries || []) {
        const oreTot = Number(e.oreTot) || 0;
        const perHead = Math.floor(oreTot / grp.members.length);
        const remainder = oreTot % grp.members.length;
        const assegnazione = {};
        grp.members.forEach((opId, idx) => {
          assegnazione[opId] = perHead + (idx < remainder ? 1 : 0);
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
      if (violator) return reject(new Error("Superato il limite di 8h (considerando personale e altri gruppi). Ridurre le ore."));

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

// Aggiorna le voci personali (FERIE/MALATTIA/PERMESSO) per un operaio in una data
// entries: [{ commessa: 'FERIE'|'MALATTIA'|'PERMESSO', ore }]
export function updateOperaioPersonalDay({ opId, dateKey, entries }) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        const ALLOWED = new Set(["FERIE", "MALATTIA", "PERMESSO"]);
        const sanitized = (entries || [])
          .map((e) => ({ commessa: String(e.commessa || ""), ore: Number(e.ore) || 0 }))
          .filter((e) => ALLOWED.has(e.commessa) && e.ore > 0);

        // Calcola totale proposto: personale + ore dai gruppi correnti
        let total = sanitized.reduce((s, e) => s + (Number(e.ore) || 0), 0);
        Object.values(pmGroupsMock).forEach((grp) => {
          if (!grp?.members?.includes(opId)) return;
          const list = grp.timesheet?.[dateKey] || [];
          list.forEach((entry) => { total += Number(entry.assegnazione?.[opId] || 0); });
        });
        if (total > 8) return reject(new Error("Totale giornaliero > 8h considerando anche le voci personali. Ridurre le ore."));

        if (!operaioPersonalMock[opId]) operaioPersonalMock[opId] = {};
        if (sanitized.length === 0) delete operaioPersonalMock[opId][dateKey];
        else operaioPersonalMock[opId][dateKey] = sanitized;
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

    // SEED voci personali per operai (fino ad oggi)
    const seedPersonalForOperai = () => {
      const year = today.getFullYear();
      const start = new Date(year, 0, 1);
      const end = new Date(today);
      const ALLOWED = ["FERIE", "MALATTIA", "PERMESSO"];
      OPERAI.forEach((op) => {
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const key = toKey(d);
          if (isWeekend(d) || holidaySet.has(key)) continue;
          // Probabilità
          const roll = Math.random();
          let entry = null;
          if (roll < 0.025) entry = { commessa: "MALATTIA", ore: getRandomInt(6, 8) };
          else if (roll < 0.055) entry = { commessa: "FERIE", ore: 8 };
          else if (roll < 0.11) entry = { commessa: "PERMESSO", ore: getRandomInt(1, 4) };
          if (entry) {
            if (!operaioPersonalMock[op.id]) operaioPersonalMock[op.id] = {};
            operaioPersonalMock[op.id][key] = [entry];
          }
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
    const g1Id = "grp-1";
    const g1Members = brtOps.slice(0, 2);
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
    const g4Members = brtOps.slice(-2);
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
