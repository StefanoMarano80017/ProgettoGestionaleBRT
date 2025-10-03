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
const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());

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
