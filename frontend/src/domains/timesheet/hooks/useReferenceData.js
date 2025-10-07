import { useState, useEffect } from 'react';
import { useTimesheetApi } from './useTimesheetApi.js';
import { listServizi } from '@mocks/ServiziMock';
import { listCommesse } from '@mocks/CommesseMock';

export function useReferenceData(opts = { commesse: true, personale: true, pmGroups: true, employeeId: undefined }) {
  const { api } = useTimesheetApi();
  const { employeeId, commesse, personale, pmGroups } = { employeeId: undefined, ...opts };
  const [state, setState] = useState({ 
    commesse: [], 
    personale: {}, 
    pmGroups: [], 
    servizi: [], 
    commesseAttive: [], 
    commesseConChiuse: [], 
    loading: false, 
    error: '' 
  });
  
  useEffect(() => {
    let mounted = true;
    (async () => {
      setState(s => ({ ...s, loading: true, error: '' }));
      try {
        const [commesseData, personaleData, pmGroupsData, serviziData, commesseAttiveData, commesseConChiuseData] = await Promise.all([
          commesse ? api.getActiveCommesseForEmployee?.(employeeId || {}) : Promise.resolve([]),
          personale ? api.getOperaioPersonalMap?.() : Promise.resolve({}),
          pmGroups ? api.listPmGroups?.() : Promise.resolve([]),
          // Nuovi campi: servizi e commesse dal registry centralizzato
          listServizi(),
          listCommesse({ includeClosed: false }), // Solo commesse attive
          listCommesse({ includeClosed: true }),  // Tutte le commesse (per admin)
        ]);
        if (!mounted) return;
        setState(s => ({ 
          ...s, 
          commesse: commesseData, 
          personale: personaleData, 
          pmGroups: pmGroupsData,
          // Nuovi campi aggiunti senza rompere l'API esistente
          servizi: serviziData,
          commesseAttive: commesseAttiveData,
          commesseConChiuse: commesseConChiuseData,
          loading: false 
        }));
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
