import { useMemo } from 'react';

// Ritorna un Set con le festività italiane (incl. Lunedì di Pasqua) per l'anno indicato
export function useItalianHolidays(year) {
  return useMemo(() => {
    if (!year) return new Set();
    const set = new Set();
    [
      `${year}-01-01`, // Capodanno
      `${year}-01-06`, // Epifania
      `${year}-04-25`, // Liberazione
      `${year}-05-01`, // Lavoro
      `${year}-06-02`, // Repubblica
      `${year}-08-15`, // Ferragosto
      `${year}-11-01`, // Ognissanti
      `${year}-12-08`, // Immacolata
      `${year}-12-25`, // Natale
      `${year}-12-26`, // Santo Stefano
    ].forEach(d => set.add(d));

    // Calcolo Pasqua (algoritmo di Butcher) -> Lunedì dell'Angelo
    const easter = computeEasterDate(year);
    const easterMonday = new Date(easter);
    easterMonday.setDate(easter.getDate() + 1);
    set.add(formatDate(easterMonday));

    return set;
  }, [year]);
}

function computeEasterDate(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1; // 0-based
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month, day);
}

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default useItalianHolidays;
