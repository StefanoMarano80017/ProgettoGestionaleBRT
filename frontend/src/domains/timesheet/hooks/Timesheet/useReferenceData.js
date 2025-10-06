import { useState, useEffect } from 'react';
import { useTimesheetApi } from './useTimesheetApi';

/** Unified reference data loader.
 * options: { commesse?: boolean, personale?: boolean, pmGroups?: boolean }
 * For now we reuse mock API functions.
 */
export function useReferenceData(opts = { commesse: true, personale: true, pmGroups: true, employeeId: undefined }) {
  const { api } = useTimesheetApi();
  const { employeeId, commesse, personale, pmGroups } = { employeeId: undefined, ...opts };
  const [state, setState] = useState({ commesse: [], personale: {}, pmGroups: [], loading: false, error: '' });

  useEffect(() => {
    let mounted = true;
    (async () => {
      setState(s => ({ ...s, loading: true, error: '' }));
      try {
        const [commesseData, personaleData, pmGroupsData] = await Promise.all([
          commesse ? api.getActiveCommesseForEmployee?.(employeeId || {}) : Promise.resolve([]),
          personale ? api.getOperaioPersonalMap?.() : Promise.resolve({}),
          pmGroups ? api.listPmGroups?.() : Promise.resolve([]),
        ]);
        if (!mounted) return;
        setState(s => ({ ...s, commesse: commesseData, personale: personaleData, pmGroups: pmGroupsData, loading: false }));
      } catch (e) {
        if (!mounted) return;
        setState(s => ({ ...s, error: e?.message || 'Errore reference data', loading: false }));
      }
    })();
    return () => { mounted = false; };
  }, [api, commesse, personale, pmGroups, employeeId]);

  return state;
}
export default useReferenceData;
