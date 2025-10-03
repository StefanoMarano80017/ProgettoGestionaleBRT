import { useMemo } from 'react';

// Costruisce la mappa timesheet per singolo operaio a partire dai gruppi e dalle voci personali
export function useOperaiTimesheet({ groups, allOperai, azienda, opPersonal }) {
  const operaiRows = useMemo(() => (allOperai || [])
    .filter(o => true) // filtraggio azienda a monte se necessario
    .map(o => ({ id: o.id, dipendente: o.name, azienda: o.azienda })), [allOperai]);

  const operaiTsMap = useMemo(() => {
    const map = {};
    const nameById = new Map((allOperai || []).map(o => [o.id, o.name]));
    for (const g of groups || []) {
      if (azienda && g.azienda !== azienda) continue;
      const ts = g.timesheet || {};
      for (const [dateKey, entries] of Object.entries(ts)) {
        for (const e of entries) {
          const assegnazione = e.assegnazione || {};
            for (const [opId, ore] of Object.entries(assegnazione)) {
              const oreNum = Number(ore) || 0;
              if (oreNum <= 0) continue;
              if (!map[opId]) map[opId] = {};
              if (!map[opId][dateKey]) map[opId][dateKey] = [];
              map[opId][dateKey].push({
                dipendente: nameById.get(opId) || opId,
                commessa: e.commessa,
                ore: oreNum,
                descrizione: `Da gruppo ${g.name}`,
              });
            }
        }
      }
    }
    Object.entries(opPersonal || {}).forEach(([opId, days]) => {
      Object.entries(days || {}).forEach(([dateKey, arr]) => {
        if (!map[opId]) map[opId] = {};
        if (!map[opId][dateKey]) map[opId][dateKey] = [];
        (arr || []).forEach(e => {
          map[opId][dateKey].push({
            dipendente: nameById.get(opId) || opId,
            commessa: e.commessa,
            ore: Number(e.ore) || 0,
            descrizione: 'Personale'
          });
        });
      });
    });
    return map;
  }, [groups, allOperai, azienda, opPersonal]);

  return { operaiRows, operaiTsMap };
}
export default useOperaiTimesheet;
