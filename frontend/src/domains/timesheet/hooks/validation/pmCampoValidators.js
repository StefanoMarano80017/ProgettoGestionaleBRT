import { NON_WORK_CODES } from '@domains/timesheet/hooks/utils/timesheetModel';

const NON_WORK = new Set(NON_WORK_CODES.map((code) => String(code || '').toUpperCase()));
const WORK_DAY_CAP = 8;

const ensureArray = (value) => (Array.isArray(value) ? value : []);

const normalizeDraft = (entries = []) => ensureArray(entries)
  .filter((item) => item && typeof item === 'object')
  .map((item, index) => ({
    _tmpId: item._id || item.id || `${index}`,
    commessa: typeof item.commessa === 'string' ? item.commessa.toUpperCase() : String(item.commessa || ''),
    ore: Number(item.ore) || 0,
  }))
  .filter((item) => item.ore > 0);

const sumBy = (entries, predicate = () => true) =>
  entries.reduce((sum, entry) => (predicate(entry) ? sum + entry.ore : sum), 0);

const isMalattia = (entry) => entry.commessa === 'MALATTIA';
const isFerie = (entry) => entry.commessa === 'FERIE';
const isPermesso = (entry) => entry.commessa === 'PERMESSO';
const isRol = (entry) => entry.commessa === 'ROL';

export function validateNonWorkRules({ nextDraft = [] } = {}) {
  const normalized = normalizeDraft(nextDraft).filter((entry) => NON_WORK.has(entry.commessa));
  if (normalized.length === 0) {
    return { ok: true };
  }

  const sumM = sumBy(normalized, isMalattia);
  const sumF = sumBy(normalized, isFerie);
  const sumP = sumBy(normalized, isPermesso);
  const sumR = sumBy(normalized, isRol);
  const sumPR = sumP + sumR;

  if (sumM > 0) {
    if (sumM !== WORK_DAY_CAP) {
      return { ok: false, error: 'MALATTIA deve essere pari a 8 ore.' };
    }
    if (sumF > 0 || sumPR > 0) {
      return { ok: false, error: 'MALATTIA è esclusiva e non può coesistere con altre assenze.' };
    }
    return { ok: true };
  }

  if (sumF > 0) {
    if (sumF !== WORK_DAY_CAP) {
      return { ok: false, error: 'FERIE deve essere pari a 8 ore.' };
    }
    if (sumPR > 0) {
      return { ok: false, error: 'FERIE non può combinarsi con PERMESSO o ROL.' };
    }
    return { ok: true };
  }

  if (sumPR === WORK_DAY_CAP) {
    return { ok: true };
  }

  if (sumPR > 0 && sumPR < WORK_DAY_CAP) {
    return { ok: true };
  }

  if (sumPR === 0) {
    return { ok: true };
  }

  return {
    ok: false,
    error: 'Combinazione assenze non valida. Usa MALATTIA=8 esclusiva, FERIE=8 esclusiva, PERMESSO/ROL parziali (<8) con lavoro oppure PERMESSO/ROL=8.'
  };
}

function collectExisting({ opId, dateKey, tsMap, personalMap, stagedEntries }) {
  const workEntries = ensureArray(tsMap?.[opId]?.[dateKey]);
  const personalEntries = ensureArray(personalMap?.[opId]?.[dateKey]);
  const stagedEntry = stagedEntries?.[opId]?.[dateKey];
  const stagedDraft = stagedEntry ? (stagedEntry.draft === null ? [] : ensureArray(stagedEntry.draft)) : null;
  const baseSnapshot = stagedEntry ? ensureArray(stagedEntry.base) : workEntries;
  return {
    workEntries,
    personalEntries,
    stagedDraft,
    baseSnapshot,
  };
}

export function validateDailyTotal({
  opId,
  dateKey,
  nextDraft = [],
  tsMap = {},
  personalMap = {},
  stagedEntries = {},
} = {}) {
  if (!opId || !dateKey) {
    return { ok: false, error: 'Parametri mancanti per la validazione ore giornaliere.' };
  }

  const draft = normalizeDraft(nextDraft);
  const { personalEntries, stagedDraft, baseSnapshot } = collectExisting({ opId, dateKey, tsMap, personalMap, stagedEntries });
  const nonWorkNormalized = normalizeDraft(personalEntries);

  const workDraft = draft.filter((entry) => !NON_WORK.has(entry.commessa));
  const nonWorkDraft = draft.filter((entry) => NON_WORK.has(entry.commessa));

  const existingWork = normalizeDraft(stagedDraft ?? baseSnapshot).filter((entry) => !NON_WORK.has(entry.commessa));

  const personalHours = sumBy(nonWorkNormalized);
  const nextPersonalHours = sumBy(nonWorkDraft);
  const nextWorkHours = sumBy(workDraft);

  const total = nextWorkHours + nextPersonalHours;

  if (total + personalHours - nextPersonalHours > WORK_DAY_CAP) {
    // If previous personal hours exist and we are not overriding them, include them.
    const previousNonWork = sumBy(nonWorkNormalized);
    const previousWork = sumBy(existingWork);
    const projected = previousWork + previousNonWork;
    if (projected > WORK_DAY_CAP) {
      return {
        ok: false,
        error: 'Totale giornaliero attuale supera 8 ore. Ridurre le ore prima di proseguire.',
      };
    }
  }

  if (total > WORK_DAY_CAP) {
    return {
      ok: false,
      error: `Totale giornaliero proposto (${total}h) supera il limite di ${WORK_DAY_CAP} ore.`,
    };
  }

  return { ok: true };
}

export function validatePmCampoDraft({
  opId,
  dateKey,
  draft,
  tsMap,
  personalMap,
  stagedEntries,
} = {}) {
  const totalResult = validateDailyTotal({ opId, dateKey, nextDraft: draft, tsMap, personalMap, stagedEntries });
  if (!totalResult.ok) return totalResult;
  const nonWorkResult = validateNonWorkRules({ nextDraft: draft });
  if (!nonWorkResult.ok) return nonWorkResult;
  return { ok: true };
}

export default {
  validateDailyTotal,
  validateNonWorkRules,
  validatePmCampoDraft,
};
