// useDayStatus: funzione pura per derivare stato/label/colore da una giornata
// Input: array di record (dayData), eventuale segnalazione, dateStr (YYYY-MM-DD), today (Date)
// Output: { label, status }
// Nota: il colore vero e proprio è demandato a useDayStatusColor (già esistente) per coerenza tema.

export function getDayStatus(dayData = [], segnalazione = null, dateStr, today = new Date()) {
  const totalHours = dayData.reduce((s, r) => s + Number(r.ore || 0), 0);
  const hasFerie = dayData.some((r) => r.commessa === 'FERIE');
  const hasMalattia = dayData.some((r) => r.commessa === 'MALATTIA');
  const hasPermesso = dayData.some((r) => r.commessa === 'PERMESSO');
  const hasRol = dayData.some((r) => r.commessa === 'ROL');
  const isFuture = dateStr ? new Date(dateStr) > today : false;

  if (!dayData.length && !segnalazione) {
    return isFuture ? { label: 'Futuro', status: 'future' } : { label: 'Vuoto', status: undefined };
  }
  if (hasFerie) return { label: 'Ferie', status: 'ferie' };
  if (hasMalattia) return { label: 'Malattia', status: 'malattia' };
  if (segnalazione) return { label: 'Segnalazione', status: 'admin-warning' };
  // Priority: ROL first, then PERMESSO (ROL is more specific/visible)
  if (hasRol && totalHours < 8) return { label: 'ROL/Parziale', status: 'rol' };
  if (hasPermesso && totalHours < 8) return { label: 'Permesso/Parziale', status: 'permesso' };
  if (totalHours === 8) return { label: 'Completo', status: 'complete' };
  if (totalHours > 0 && totalHours < 8) return { label: 'Parziale', status: 'partial' };
  return { label: 'Vuoto', status: undefined };
}

export default function useDayStatus() {
  return getDayStatus;
}
