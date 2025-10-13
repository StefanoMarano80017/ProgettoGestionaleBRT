const _balances = new Map();

/**
 * Initialize balances for an employee (idempotent).
 * Default: permesso=24h, rol=16h. Allow overrides via seed if provided.
 */
export function ensureEmployeeBalances(employeeId, { permesso=24, rol=16 } = {}) {
  if (!_balances.has(employeeId)) {
    _balances.set(employeeId, { permesso: Number(permesso)||0, rol: Number(rol)||0 });
  }
  return getEmployeeBalances(employeeId);
}

export function getEmployeeBalances(employeeId) {
  const b = _balances.get(employeeId);
  return b ? { ...b } : { permesso: 0, rol: 0 };
}

/**
 * Try to consume balances. Negative inputs are not allowed.
 * Throws if insufficient balance.
 */
export function consumeBalances(employeeId, { permesso=0, rol=0 }) {
  const cur = _balances.get(employeeId) || { permesso: 0, rol: 0 };
  const needP = Number(permesso)||0;
  const needR = Number(rol)||0;
  if (needP < 0 || needR < 0) throw new Error("Quantità bilancio negativa non valida.");
  if (cur.permesso < needP) throw new Error("Saldo PERMESSO insufficiente.");
  if (cur.rol < needR) throw new Error("Saldo ROL insufficiente.");
  const next = { permesso: cur.permesso - needP, rol: cur.rol - needR };
  _balances.set(employeeId, next);
  return { ...next };
}

/**
 * Refund (used for edits/overwrites on the same day).
 */
export function refundBalances(employeeId, { permesso=0, rol=0 }) {
  const cur = _balances.get(employeeId) || { permesso: 0, rol: 0 };
  const next = { permesso: cur.permesso + (Number(permesso)||0), rol: cur.rol + (Number(rol)||0) };
  _balances.set(employeeId, next);
  return { ...next };
}

/** DEV: reset all (optional helper if you need it in tests) */
export function __resetAllBalances() { _balances.clear(); }