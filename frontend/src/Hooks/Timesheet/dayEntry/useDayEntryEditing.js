import { useState, useMemo } from 'react';

/**
 * Gestisce dialog add/edit di una voce giornaliera.
 */
export function useDayEntryEditing({
  records,
  commesse = [],
  totalHours,
  maxHoursPerDay = 8,
  selectedDay,
  onAddRecord,
}) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState('add'); // 'add' | 'edit'
  const [idx, setIdx] = useState(null);
  const [form, setForm] = useState({
    commessa: commesse[0] || '',
    ore: 1,
    descrizione: '',
  });
  const [error, setError] = useState('');

  const canAddMore = totalHours < maxHoursPerDay;

  const maxOre = useMemo(() => {
    if (mode === 'add') return Math.max(0, maxHoursPerDay - totalHours) || 0;
    if (mode === 'edit' && idx != null) {
      const current = records[idx];
      const others = totalHours - Number(current?.ore || 0);
      return Math.max(0, maxHoursPerDay - others);
    }
    return maxHoursPerDay;
  }, [mode, idx, records, totalHours, maxHoursPerDay]);

  const openAdd = () => {
    setMode('add');
    setIdx(null);
    setForm({
      commessa: commesse[0] || '',
      ore: Math.min(1, Math.max(1, maxHoursPerDay - totalHours)) || 1,
      descrizione: '',
    });
    setError('');
    setOpen(true);
  };

  const openEdit = (i) => {
    const r = records[i];
    setMode('edit');
    setIdx(i);
    setForm({
      commessa: r.commessa,
      ore: Number(r.ore || 1),
      descrizione: r.descrizione || '',
    });
    setError('');
    setOpen(true);
  };

  const close = () => setOpen(false);

  const save = () => {
    const oreNum = Number(form.ore || 0);
    if (!form.commessa) return setError('Seleziona una commessa');
    if (oreNum <= 0) return setError('Le ore devono essere maggiori di 0');
    if (oreNum > maxOre) {
      return setError(
        mode === 'add'
          ? `Puoi aggiungere al massimo ${maxOre}h`
          : `Puoi impostare al massimo ${maxOre}h per questa riga`
      );
    }
    if (mode === 'add') {
      const newRecord = {
        dipendente: records[0]?.dipendente || 'Mario Rossi',
        commessa: form.commessa,
        ore: oreNum,
        descrizione: form.descrizione,
      };
      onAddRecord(selectedDay, newRecord, false);
    } else if (mode === 'edit' && idx != null) {
      const next = [...records];
      next[idx] = {
        ...next[idx],
        commessa: form.commessa,
        ore: oreNum,
        descrizione: form.descrizione,
      };
      onAddRecord(selectedDay, next, true);
    }
    setOpen(false);
  };

  return {
    dialogOpen: open,
    mode,
    idx,
    form,
    error,
    canAddMore,
    maxOre,
    setForm,
    openAdd,
    openEdit,
    close,
    save,
  };
}
