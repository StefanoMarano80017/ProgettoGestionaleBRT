import { useState, useEffect, useMemo, useCallback } from 'react';
import { updateGroupDayEntries as mockUpdateGroupDayEntries } from '@mocks/ProjectMock';

// Gestisce le righe di edit per il giorno selezionato di un gruppo PM Campo
export function usePmCampoEditing({ selectedGroup, selectedDay, commesse, groups, opPersonal, refreshGroups, refreshPersonal }) {
  const [editEntries, setEditEntries] = useState([]); // [{commessa, oreTot}]
  const [saveMsg, setSaveMsg] = useState('');
  const [saveType, setSaveType] = useState('info');

  useEffect(() => {
    const g = selectedGroup;
    const dayEntries = g?.timesheet?.[selectedDay] || [];
    setEditEntries(dayEntries.map(e => ({ commessa: e.commessa, oreTot: Number(e.oreTot) || 0 })));
  }, [selectedGroup, selectedDay]);

  const totalEditHours = useMemo(() => editEntries.reduce((s, e) => s + (Number(e.oreTot) || 0), 0), [editEntries]);

  const addEditRow = useCallback(() => setEditEntries(arr => [...arr, { commessa: commesse?.[0] || '', oreTot: 1 }]), [commesse]);
  const removeEditRow = useCallback((idx) => setEditEntries(arr => arr.filter((_, i) => i !== idx)), []);
  const updateEditRow = useCallback((idx, patch) => setEditEntries(arr => arr.map((e, i) => i === idx ? { ...e, ...patch } : e)), []);

  const validatePerHeadLimit = useCallback((sanitized, g, dayKey) => {
    if (!g || !g.members?.length) return;
    const perHeadTotals = {};
    const tot = sanitized.reduce((s, e) => s + (Number(e.oreTot) || 0), 0);
    const perHead = Math.floor((Number(tot) || 0) / g.members.length);
    const remainder = (Number(tot) || 0) % g.members.length;
    g.members.forEach((opId, idx) => { perHeadTotals[opId] = perHead + (idx < remainder ? 1 : 0); });
    const sumByOp = {};
    groups.forEach(gg => {
      if (gg.id === g.id) return;
      const list = gg.timesheet?.[dayKey] || [];
      list.forEach(entry => {
        Object.entries(entry.assegnazione || {}).forEach(([opId, ore]) => {
          sumByOp[opId] = (sumByOp[opId] || 0) + (Number(ore) || 0);
        });
      });
    });
    g.members.forEach(opId => {
      const personal = opPersonal?.[opId]?.[dayKey] || [];
      personal.forEach(p => { sumByOp[opId] = (sumByOp[opId] || 0) + (Number(p.ore) || 0); });
    });
    Object.entries(perHeadTotals).forEach(([opId, ore]) => { sumByOp[opId] = (sumByOp[opId] || 0) + (Number(ore) || 0); });
    const viol = Object.entries(sumByOp).find(([_, h]) => Number(h) > 8);
    if (viol) throw new Error('Questa modifica supera le 8h per alcuni operai (considerando voci personali). Riduci il totale.');
  }, [groups, opPersonal]);

  const saveGroupDay = useCallback(async ({ selectedGroupId, selectedDay }) => {
    setSaveMsg(''); setSaveType('info');
    if (!selectedGroupId) { setSaveType('error'); setSaveMsg('Seleziona una squadra.'); return false; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(selectedDay)) { setSaveType('error'); setSaveMsg('Data non valida.'); return false; }
    const sanitized = editEntries.filter(e => e.commessa && Number(e.oreTot) > 0);
    try { validatePerHeadLimit(sanitized, selectedGroup, selectedDay); } catch (e) { setSaveType('error'); setSaveMsg(e.message || 'Supero ore 8h'); return false; }
    try {
      await mockUpdateGroupDayEntries({ groupId: selectedGroupId, dateKey: selectedDay, entries: sanitized });
      setSaveType('success'); setSaveMsg('Salvato. Distribuzione aggiornata tra i membri.');
      refreshGroups?.(); refreshPersonal?.();
      return true;
    } catch (e) {
      setSaveType('error'); setSaveMsg(e.message || 'Errore salvataggio');
      return false;
    }
  }, [editEntries, selectedGroup, validatePerHeadLimit, refreshGroups, refreshPersonal]);

  return {
    editEntries, addEditRow, removeEditRow, updateEditRow,
    totalEditHours, saveGroupDay, saveMsg, saveType
  };
}
export default usePmCampoEditing;
