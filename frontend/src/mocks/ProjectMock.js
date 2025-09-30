// Mock giornaliero con commesse limitate e skip weekend/festivi

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const dipendenti = ["Mario Rossi", "Luca Bianchi", "Giulia Verdi", "Anna Neri"];
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

// Solo queste commesse
const COMMESSE = ["VS-25-01", "VS-25-02", "VS-25-03"];

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

export const projectsMock = {};

for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
  const key = toKey(d);

  // Skip weekend e festivi
  if (isWeekend(d) || holidaySet.has(key)) continue;

  const dayRecords = [];

  // FERIE (~2%) o MALATTIA (~2%) a giornata intera (solo feriali)
  const roll = Math.random();
  if (roll < 0.02) {
    dayRecords.push({
      dipendente: dipendenti[getRandomInt(0, dipendenti.length - 1)],
      commessa: "FERIE",
      ore: 8,
      descrizione: "Giornata di ferie",
    });
  } else if (roll < 0.04) {
    dayRecords.push({
      dipendente: dipendenti[getRandomInt(0, dipendenti.length - 1)],
      commessa: "MALATTIA",
      ore: getRandomInt(6, 8),
      descrizione: "Malattia",
    });
  } else {
    // Giorno lavorativo normale
    let targetHours = 8;

    // Piccola probabilità di giornata incompleta
    if (Math.random() < 0.12) targetHours = getRandomInt(0, 7);

    // PERMESSO parziale (1-4h) mescolato ad altre commesse (solo se rimane capienza)
    if (targetHours > 0 && Math.random() < 0.2) {
      const permHours = getRandomInt(1, Math.min(4, targetHours));
      dayRecords.push({
        dipendente: dipendenti[getRandomInt(0, dipendenti.length - 1)],
        commessa: "PERMESSO",
        ore: permHours,
        descrizione: "Permesso parziale",
      });
      targetHours -= permHours;
    }

    // Riempi il resto con solo VS-25-01/02/03 in blocchi 1-4h
    while (targetHours > 0) {
      const block = getRandomInt(1, Math.min(4, targetHours));
      const commessaId = COMMESSE[getRandomInt(0, COMMESSE.length - 1)];
      dayRecords.push({
        dipendente: dipendenti[getRandomInt(0, dipendenti.length - 1)],
        commessa: commessaId,
        ore: block,
        descrizione: descrizioni[getRandomInt(0, descrizioni.length - 1)],
      });
      targetHours -= block;
    }

    // Piccola probabilità di segnalazione amministrativa
    if (Math.random() < 0.03) {
      projectsMock[`${key}_segnalazione`] = {
        descrizione: segnalazioni[getRandomInt(0, segnalazioni.length - 1)],
      };
    }
  }

  if (dayRecords.length > 0) {
    projectsMock[key] = dayRecords;
  }
}
