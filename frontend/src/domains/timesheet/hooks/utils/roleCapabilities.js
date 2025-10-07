/* Canonical roleCapabilities implementation (legacy path removed). */

// Basic capability map (extend as needed)
export const roleCapabilities = {
	amministratore: { canEditAll: true, canViewAll: true, canApprove: true },
	coordinatore: { canEditAll: true, canViewAll: true, canApprove: true },
	dipendente: { canEditOwn: true, canViewOwn: true },
};

export function getRoleCapabilities(role) {
	return roleCapabilities[role] || {};
}

export const rolesWithPersonalEntries = ['dipendente'];

export const canEditPersonalAbsences = (role) =>
	["DIPENDENTE","PM_CAMPO","COORDINATORE","AMMINISTRATORE"].includes(String(role || '').toUpperCase());

export function filterEntriesByRole(role, entries, currentUserId) {
	const caps = getRoleCapabilities(role);
	if (caps.canViewAll || caps.canEditAll) return entries;
	if (caps.canViewOwn) return entries.filter(e => e.userId === currentUserId);
	return [];
}

export function filterEntriesByRoleWithEdit(role, entries, currentUserId) {
	const caps = getRoleCapabilities(role);
	if (caps.canEditAll) return entries.map(e => ({ ...e, canEdit: true }));
	if (caps.canEditOwn) return entries.map(e => ({ ...e, canEdit: e.userId === currentUserId }));
	return entries.map(e => ({ ...e, canEdit: false }));
}

export function filterAnalyticsEntries(role, entries) {
	// Placeholder: refine analytics filtering if required
	return filterEntriesByRole(role, entries);
}

export function partitionEntries(entries, predicate) {
	const pass = []; const fail = [];
	entries.forEach(e => (predicate(e) ? pass : fail).push(e));
	return [pass, fail];
}
