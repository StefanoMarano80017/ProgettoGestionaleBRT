// Mock giornaliero: per ogni giorno dell'anno fino ad oggi, commesse VS-25-XX, ore, dipendente, descrizione
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
  "Contattare amministrazione per chiarimenti."
];

const today = new Date();
const start = new Date(today.getFullYear(), 0, 1);
const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());

const pad = (n) => (n < 10 ? `0${n}` : `${n}`);

let commessaCounter = 0;

export const projectsMock = {};

let segnalato = false;

for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
  const dateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  let dayCommesse = [];

  // Salta sabato (6) e domenica (0)
  if (d.getDay() === 0 || d.getDay() === 6) {
    projectsMock[dateStr] = [];
    continue;
  }

  let remainingHours = 8;
  // 10% ferie, 5% permesso, 5% malattia, 15% incompleti (<8 ore), 1 giorno segnalato dall'amministrazione
  const chance = Math.random();
  if (!segnalato && chance < 0.01) {
    // Primo giorno che capita viene segnalato
    commessaCounter++;
    dayCommesse.push({
      commessa: `VS-25-${pad(commessaCounter)}`,
      ore: getRandomInt(1, 7),
      dipendente: dipendenti[getRandomInt(0, dipendenti.length - 1)],
      descrizione: descrizioni[getRandomInt(0, descrizioni.length - 1)],
    });
    projectsMock[dateStr] = dayCommesse;
    projectsMock[dateStr + "_segnalazione"] = {
      descrizione: segnalazioni[getRandomInt(0, segnalazioni.length - 1)]
    };
    segnalato = true;
    continue;
  }
  if (chance < 0.1) {
    dayCommesse.push({
      commessa: `FERIE`,
      ore: 8,
      dipendente: dipendenti[getRandomInt(0, dipendenti.length - 1)],
      descrizione: "Giornata di ferie",
    });
    remainingHours = 0;
  } else if (chance < 0.15) {
    dayCommesse.push({
      commessa: `PERMESSO`,
      ore: 8,
      dipendente: dipendenti[getRandomInt(0, dipendenti.length - 1)],
      descrizione: "Permesso personale",
    });
    remainingHours = 0;
  } else if (chance < 0.2) {
    dayCommesse.push({
      commessa: `MALATTIA`,
      ore: 8,
      dipendente: dipendenti[getRandomInt(0, dipendenti.length - 1)],
      descrizione: "Assenza per malattia",
    });
    remainingHours = 0;
  } else if (chance < 0.35) {
    // Giorno incompleto: tra 1 e 7 ore
    const oreIncomplete = getRandomInt(1, 7);
    commessaCounter++;
    dayCommesse.push({
      commessa: `VS-25-${pad(commessaCounter)}`,
      ore: oreIncomplete,
      dipendente: dipendenti[getRandomInt(0, dipendenti.length - 1)],
      descrizione: descrizioni[getRandomInt(0, descrizioni.length - 1)],
    });
    remainingHours = 0;
  } else {
    // 1-3 commesse normali, ore random ma max 8
    const numCommesse = getRandomInt(1, 3);
    for (let i = 0; i < numCommesse && remainingHours > 0; i++) {
      commessaCounter++;
      const commessaName = `VS-25-${pad(commessaCounter)}`;
      let ore = i === numCommesse - 1 ? remainingHours : getRandomInt(1, remainingHours - (numCommesse - i - 1));
      dayCommesse.push({
        commessa: commessaName,
        ore,
        dipendente: dipendenti[getRandomInt(0, dipendenti.length - 1)],
        descrizione: descrizioni[getRandomInt(0, descrizioni.length - 1)],
      });
      remainingHours -= ore;
    }
  }
  projectsMock[dateStr] = dayCommesse;
}
