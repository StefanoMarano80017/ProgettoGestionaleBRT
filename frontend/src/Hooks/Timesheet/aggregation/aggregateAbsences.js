// aggregateAbsences: calcola giorni & ore per FERIE / MALATTIA / PERMESSO
// data: { 'YYYY-MM-DD': [ { commessa, ore } ] }
// year, monthIndex (0-based)
export function aggregateAbsences(data = {}, year, monthIndex) {
  if (year == null || monthIndex == null) return base();
  const res = base();
  const monthStr = String(monthIndex + 1).padStart(2, '0');
  for (const key of Object.keys(data)) {
    if (!key.startsWith(`${year}-${monthStr}-`)) continue;
    const list = data[key];
    if (!Array.isArray(list)) continue;
    const counted = { ferie:false, malattia:false, permesso:false };
    for (const rec of list) {
      const ore = Number(rec.ore || 0);
      if (rec.commessa === 'FERIE') {
        res.ferie.hours += ore; if (!counted.ferie) { res.ferie.days++; counted.ferie = true; }
      } else if (rec.commessa === 'MALATTIA') {
        res.malattia.hours += ore; if (!counted.malattia) { res.malattia.days++; counted.malattia = true; }
      } else if (rec.commessa === 'PERMESSO') {
        res.permesso.hours += ore; if (!counted.permesso) { res.permesso.days++; counted.permesso = true; }
      }
    }
  }
  return res;
}

function base() {
  return {
    ferie: { hours: 0, days: 0 },
    malattia: { hours: 0, days: 0 },
    permesso: { hours: 0, days: 0 },
  };
}

export default aggregateAbsences;
