import { NON_WORK_CODES } from "../utils/timesheetModel";

// Costruisce array di record NON_WORK coerenti con le regole dominio.
// Ogni record: { commessa: string, ore: number, descrizione?: string }
export function buildMalattia8() {
  return [{ commessa: "MALATTIA", ore: 8, descrizione: "Malattia" }];
}

export function buildFerie8() {
  return [{ commessa: "FERIE", ore: 8 }];
}

export function buildPermRol(perm, rol) {
  const p = Number(perm) || 0;
  const r = Number(rol) || 0;
  if (p + r !== 8) {
    throw new Error(`PERMESSO+ROL devono sommare 8h (attuale: ${p + r}).`);
  }
  const arr = [];
  if (p > 0) arr.push({ commessa: "PERMESSO", ore: p });
  if (r > 0) arr.push({ commessa: "ROL", ore: r });
  return arr;
}

export function buildMix(perm, rol) {
  const p = Number(perm) || 0;
  const r = Number(rol) || 0;
  if (p + r > 8) {
    throw new Error(`PERMESSO+ROL non possono superare 8h (attuale: ${p + r}).`);
  }
  const ferie = 8 - (p + r);
  const arr = [];
  if (p > 0) arr.push({ commessa: "PERMESSO", ore: p });
  if (r > 0) arr.push({ commessa: "ROL", ore: r });
  if (ferie > 0) arr.push({ commessa: "FERIE", ore: ferie });
  return arr;
}

export function containsMalattia(entries = []) {
  return (entries || []).some(e => String(e?.commessa).toUpperCase() === "MALATTIA");
}
