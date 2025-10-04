import { useState, useEffect, useMemo } from 'react';
import { validateDayHours } from './validation/validateDayHours.js';

// Incapsula la logica di OperaioEditor per semplificare il componente di presentazione
export default function useOperaioEditor({ opRow, dateKey, tsMap, commesse = [], onSaved }) {
  const [rows, setRows] = useState(() => (tsMap?.[opRow.id]?.[dateKey] || [])
    .filter(r => !['FERIE','MALATTIA','PERMESSO'].includes(String(r.commessa)))
    .map(r => ({ commessa: r.commessa, ore: Number(r.ore) || 0 }))
  );
  const [personal, setPersonal] = useState(() => (tsMap?.[opRow.id]?.[dateKey] || [])
    .filter(r => ['FERIE','MALATTIA','PERMESSO'].includes(String(r.commessa)))
    .map(r => ({ commessa: r.commessa, ore: Number(r.ore) || 0 }))
  );
  const [msg, setMsg] = useState('');
  const [type, setType] = useState('info');

  useEffect(() => {
    const recs = tsMap?.[opRow.id]?.[dateKey] || [];
    setRows(recs.filter(r => !['FERIE','MALATTIA','PERMESSO'].includes(String(r.commessa)))
      .map(r => ({ commessa: r.commessa, ore: Number(r.ore) || 0 }))
    );
    setPersonal(recs.filter(r => ['FERIE','MALATTIA','PERMESSO'].includes(String(r.commessa)))
      .map(r => ({ commessa: r.commessa, ore: Number(r.ore) || 0 }))
    );
  }, [opRow?.id, dateKey, tsMap]);

  const updateRow = (i, patch) => setRows(arr => arr.map((r, idx) => idx === i ? { ...r, ...patch } : r));
  const removeRow = (i) => setRows(arr => arr.filter((_, idx) => idx !== i));
  const addRow = () => setRows(arr => [...arr, { commessa: commesse[0] || '', ore: 1 }]);

  const updatePersonal = (i, patch) => setPersonal(arr => arr.map((r, idx) => idx === i ? { ...r, ...patch } : r));
  const removePersonal = (i) => setPersonal(arr => arr.filter((_, idx) => idx !== i));
  const addPersonal = () => setPersonal(arr => [...arr, { commessa: 'FERIE', ore: 8 }]);

  const { total, personalTotal, grandTotal, ok, error } = useMemo(() => validateDayHours({ rows, personal, limit: 8 }), [rows, personal]);

  const save = async () => {
    setMsg(''); setType('info');
    try {
  if (!ok) throw new Error(error || 'Validazione ore fallita');
      const payload = rows.filter(r => r.commessa && Number(r.ore) > 0).map(r => ({ commessa: r.commessa, ore: Number(r.ore) }));
      const personalPayload = personal.filter(r => ['FERIE','MALATTIA','PERMESSO'].includes(String(r.commessa)) && Number(r.ore) > 0)
        .map(r => ({ commessa: r.commessa, ore: Number(r.ore) }));
  // Dinamico per evitare peso iniziale: riusa il mock esistente
  const { updateOperaioDayAssignments, updateOperaioPersonalDay } = await import('../../mocks/ProjectMock');
      await updateOperaioPersonalDay({ opId: opRow.id, dateKey, entries: personalPayload });
      await updateOperaioDayAssignments({ opId: opRow.id, dateKey, entries: payload });
      setType('success'); setMsg('Salvato.');
      onSaved?.();
    } catch (e) {
      setType('error'); setMsg(e?.message || 'Errore salvataggio');
    }
  };

  return {
    rows, personal,
    addRow, removeRow, updateRow,
    addPersonal, removePersonal, updatePersonal,
    total, personalTotal, grandTotal,
    save,
    msg, type,
    setMsg, setType,
  };
}
