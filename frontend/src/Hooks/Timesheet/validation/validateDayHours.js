// validateDayHours: calcola totali e valida un limite massimo (default 8h)
export function validateDayHours({ rows = [], personal = [], limit = 8 }) {
  const total = rows.reduce((s, r) => s + (Number(r.ore) || 0), 0);
  const personalTotal = personal.reduce((s, r) => s + (Number(r.ore) || 0), 0);
  const grandTotal = total + personalTotal;
  const ok = grandTotal <= limit;
  return { total, personalTotal, grandTotal, ok, error: ok ? null : `Totale giornaliero > ${limit}h` };
}
export default validateDayHours;
