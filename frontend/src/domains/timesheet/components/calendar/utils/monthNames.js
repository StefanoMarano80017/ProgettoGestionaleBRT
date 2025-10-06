export const shortMonth = ["Gen","Feb","Mar","Apr","Mag","Giu","Lug","Ago","Set","Ott","Nov","Dic"];
export const fullMonth = [
  "Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno",
  "Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"
];

/**
 * Format a month label; if year differs from baseYear, append year.
 */
export function formatMonthShortLabel(dateObj, labelArr, baseYear) {
  const base = labelArr[dateObj.getMonth()];
  return `${base}${dateObj.getFullYear() !== baseYear ? ' ' + dateObj.getFullYear() : ''}`;
}
