import { updateOperaioPersonalDay } from '@mocks/ProjectMock';

// Best-effort apply staged payload to ProjectMock APIs.
// payload: [{ employeeId, updates: [{ dateKey, records }] }]
export default async function applyStagedToMock(payload) {
  // iterate and call mock APIs where possible
  for (const p of payload || []) {
    const { employeeId, updates } = p;
    if (!employeeId || !Array.isArray(updates)) continue;
    // Operaio personal entries: call updateOperaioPersonalDay
    if (String(employeeId).startsWith('op-')) {
      for (const u of updates) {
        const dateKey = u.dateKey;
        const entries = (u.records || [])
          .filter(r => r && ['FERIE','MALATTIA','PERMESSO'].includes(String(r.commessa).toUpperCase()))
          .map(r => ({ commessa: r.commessa, ore: Number(r.ore) || 0 }));
        await updateOperaioPersonalDay({ opId: employeeId, dateKey, entries });
      }
      continue;
    }
    // For employees (emp-...) we don't have a dedicated mock writer; the provider already writes window.__tsOverrides.
    // Nothing to do for now.
  }
}
