import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { validateDayHours } from '@hooks/Timesheet/validation/validateDayHours';

/** Core unified editor for a single employee/day timesheet entries.
 * Inputs:
 *  - entries: original array (mutable outside)
 *  - personalEntries: entries FERIE/MALATTIA/PERMESSO
 *  - onSave({ workEntries, personalEntries }) -> Promise/void
 *  - commesse: available commercial commesse
 */
export function useTimesheetEntryEditor({ entries = [], personalEntries = [], onSave, commesse = [] }) {
  const [rows, setRows] = useState(() => entries.map(r => ({ commessa: r.commessa, ore: Number(r.ore)||0, descrizione: r.descrizione||'' })));
  const [personal, setPersonal] = useState(() => personalEntries.map(r => ({ commessa: r.commessa, ore: Number(r.ore)||0 })));
  const prevSignature = useRef('');

  // Sincronizza lo stato interno se cambia davvero l'input (evitando loop inutili)
  useEffect(() => {
    const sig = JSON.stringify({ e: entries, p: personalEntries });
    if (sig !== prevSignature.current) {
      prevSignature.current = sig;
      setRows(entries.map(r => ({ commessa: r.commessa, ore: Number(r.ore)||0, descrizione: r.descrizione||'' })));
      setPersonal(personalEntries.map(r => ({ commessa: r.commessa, ore: Number(r.ore)||0 })));
    }
  }, [entries, personalEntries]);
  const [state, setState] = useState({ msg: '', type: 'info', saving: false });

  const updateRow = useCallback((i, patch) => setRows(arr => arr.map((r, idx) => idx===i?{...r,...patch}:r)), []);
  const removeRow = useCallback((i) => setRows(arr => arr.filter((_,idx)=>idx!==i)), []);
  // addRow: opzionalmente accetta un oggetto iniziale completo
  const addRow = useCallback((initial) => setRows(arr => [...arr, initial || { commessa: commesse[0]||'', ore: 1, descrizione: '' }]), [commesse]);

  const updatePersonal = useCallback((i, patch) => setPersonal(arr => arr.map((r,idx)=>idx===i?{...r,...patch}:r)), []);
  const removePersonal = useCallback((i) => setPersonal(arr => arr.filter((_,idx)=>idx!==i)), []);
  const addPersonal = useCallback(() => setPersonal(arr => [...arr, { commessa: 'FERIE', ore: 8 }]), []);

  const { total, personalTotal, grandTotal, ok, error } = useMemo(() => validateDayHours({ rows, personal, limit: 8 }), [rows, personal]);

  const save = useCallback(async () => {
    if (state.saving) return;
    setState(s => ({ ...s, msg: '', type: 'info', saving: true }));
    try {
      if (!ok) throw new Error(error || 'Validazione ore fallita');
      const workEntries = rows.filter(r => r.commessa && Number(r.ore) > 0).map(r => ({ commessa: r.commessa, ore: Number(r.ore), descrizione: r.descrizione }));
      const persEntries = personal.filter(r => ['FERIE','MALATTIA','PERMESSO'].includes(String(r.commessa)) && Number(r.ore) > 0)
        .map(r => ({ commessa: r.commessa, ore: Number(r.ore) }));
      await onSave?.({ workEntries, personalEntries: persEntries });
      setState({ msg: 'Salvato.', type: 'success', saving: false });
    } catch (e) {
      setState({ msg: e?.message || 'Errore salvataggio', type: 'error', saving: false });
    }
  }, [rows, personal, ok, error, onSave, state.saving]);

  return {
    rows, personal,
    addRow, removeRow, updateRow,
    addPersonal, removePersonal, updatePersonal,
    totals: { total, personalTotal, grandTotal },
    validation: { ok, error },
    save,
    state,
    setState,
  };
}
export default useTimesheetEntryEditor;
