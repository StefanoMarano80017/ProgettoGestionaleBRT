/*
 * Role capability model & filters
 * ---------------------------------------------------------------
 * Centralizes role-based visibility and edit permissions for timesheet entries.
 * The matrix follows the spec provided in the refactor brief.
 */

/** @typedef {(
 *  | 'DIPENDENTE'
 *  | 'OPERAIO'
 *  | 'PM_CAMPO'
 *  | 'COORDINATORE'
 *  | 'AMMINISTRATORE'
 *  | 'DIRETTORE_TECNICO'
 *  | 'DIRETTORE_GENERALE'
 * )} RoleType */

/** @typedef TimesheetEntry
 * @property {string} id
 * @property {string} userId
 * @property {RoleType} userRole
 * @property {string} commessa
 * @property {number} ore
 * @property {string=} descrizione
 * @property {string} dateKey
 */

/**
 * @typedef RoleCapabilities
 * @property {boolean} canViewAll
 * @property {boolean} canEditAll
 * @property {boolean} canBatchEdit
 * @property {boolean} canManageCommesse
 * @property {boolean} canAssignUsers
 * @property {boolean} canCreateEntriesForOthers
 * @property {boolean} hasPersonalEntriesInDB
 * @property {'self'|'shared'|'global'} scope
 */

/** @type {Record<RoleType, RoleCapabilities>} */
export const roleCapabilities = {
  DIPENDENTE: {
    canViewAll: false, canEditAll: false, canBatchEdit: false, canManageCommesse: false,
    canAssignUsers: false, canCreateEntriesForOthers: false, hasPersonalEntriesInDB: true, scope: 'self'
  },
  OPERAIO: {
    canViewAll: false, canEditAll: false, canBatchEdit: false, canManageCommesse: false,
    canAssignUsers: false, canCreateEntriesForOthers: false, hasPersonalEntriesInDB: true, scope: 'self'
  },
  PM_CAMPO: {
    canViewAll: false, canEditAll: true, canBatchEdit: true, canManageCommesse: false,
    canAssignUsers: false, canCreateEntriesForOthers: true, hasPersonalEntriesInDB: true, scope: 'shared'
  },
  COORDINATORE: {
    canViewAll: false, canEditAll: true, canBatchEdit: true, canManageCommesse: true,
    canAssignUsers: true, canCreateEntriesForOthers: true, hasPersonalEntriesInDB: true, scope: 'shared'
  },
  AMMINISTRATORE: {
    canViewAll: true, canEditAll: true, canBatchEdit: true, canManageCommesse: true,
    canAssignUsers: true, canCreateEntriesForOthers: true, hasPersonalEntriesInDB: false, scope: 'global'
  },
  DIRETTORE_TECNICO: {
    canViewAll: true, canEditAll: true, canBatchEdit: true, canManageCommesse: true,
    canAssignUsers: true, canCreateEntriesForOthers: true, hasPersonalEntriesInDB: false, scope: 'global'
  },
  DIRETTORE_GENERALE: {
    canViewAll: true, canEditAll: true, canBatchEdit: true, canManageCommesse: true,
    canAssignUsers: true, canCreateEntriesForOthers: true, hasPersonalEntriesInDB: false, scope: 'global'
  }
};

export function getRoleCapabilities(role) {
  return roleCapabilities[role] || null;
}

/** Helper: set of roles that can appear with personal entries */
export const rolesWithPersonalEntries = new Set(
  Object.entries(roleCapabilities)
    .filter(([, caps]) => caps.hasPersonalEntriesInDB)
    .map(([r]) => r)
);

/**
 * Filter entries visible to a given user.
 * @param {{id:string, role: RoleType}} user
 * @param {TimesheetEntry[]} allEntries
 * @returns {TimesheetEntry[]}
 */
export function filterEntriesByRole(user, allEntries) {
  const caps = getRoleCapabilities(user.role);
  if (!caps) return [];
  if (caps.scope === 'global') return allEntries;
  if (caps.scope === 'self') return allEntries.filter(e => e.userId === user.id);
  if (caps.scope === 'shared') {
    if (user.role === 'PM_CAMPO') {
      return allEntries.filter(e => e.userId === user.id || e.userRole === 'OPERAIO');
    }
    if (user.role === 'COORDINATORE') {
      return allEntries.filter(e => e.userId === user.id || e.userRole === 'OPERAIO' || e.userRole === 'DIPENDENTE');
    }
  }
  return [];
}

/** @typedef {{ entry: TimesheetEntry, canEdit: boolean }} FilteredEntry */

/**
 * Filter with edit flag.
 * @param {{id:string, role: RoleType}} user
 * @param {TimesheetEntry[]} allEntries
 * @returns {FilteredEntry[]}
 */
export function filterEntriesByRoleWithEdit(user, allEntries) {
  const visible = filterEntriesByRole(user, allEntries);
  const caps = getRoleCapabilities(user.role) || /** @type {RoleCapabilities} */({});
  return visible.map(entry => ({
    entry,
    canEdit: Boolean(
      caps.canEditAll ||
      entry.userId === user.id ||
      (caps.canCreateEntriesForOthers && ['OPERAIO','DIPENDENTE'].includes(entry.userRole))
    )
  }));
}

/**
 * Remove entries belonging to roles that should never have personal entries
 * (defensive; normally those roles will not appear as userRole).
 * @param {TimesheetEntry[]} entries
 * @returns {TimesheetEntry[]}
 */
export function filterAnalyticsEntries(entries) {
  return entries.filter(e => rolesWithPersonalEntries.has(e.userRole));
}

/**
 * Partition entries into { mine, others } for quick UI grouping.
 * @param {{id:string, role: RoleType}} user
 * @param {TimesheetEntry[]} entries
 */
export function partitionEntries(user, entries) {
  const mine = []; const others = [];
  for (const e of entries) {
    (e.userId === user.id ? mine : others).push(e);
  }
  return { mine, others };
}

// Future ideas: caching layer keyed by role+entry count hash; omitted for now.
