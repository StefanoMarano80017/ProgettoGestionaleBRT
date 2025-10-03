import { useState, useCallback } from 'react';

export function useEntryEditing({ tsMap, setTsMap, selEmp, selDate, onAfterChange }) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editDialogItem, setEditDialogItem] = useState(null);
  const [editMode, setEditMode] = useState('edit'); // 'edit' | 'add'
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState(null);

  const openEdit = useCallback((entry) => {
    if (!selEmp || !selDate || !entry) return;
    setEditDialogItem(entry);
    setEditMode('edit');
    setEditDialogOpen(true);
  }, [selEmp, selDate]);

  const openAdd = useCallback(() => {
    if (!selEmp || !selDate) return;
    setEditDialogItem(null);
    setEditMode('add');
    setEditDialogOpen(true);
  }, [selEmp, selDate]);

  const closeEdit = useCallback(() => { setEditDialogOpen(false); setEditDialogItem(null); setEditMode('edit'); }, []);

  const saveEdited = useCallback((updated) => {
    if (!selEmp || !selDate || !updated) return;
    const empTs = tsMap[selEmp.id] || {};

    // If we're in add mode, append the new record
    if (editMode === 'add') {
      const list = (empTs[selDate] || []).slice();
      const newRec = { commessa: updated.commessa, ore: updated.ore, descrizione: updated.descrizione };
      list.push(newRec);
      const next = { ...tsMap };
      next[selEmp.id] = { ...(next[selEmp.id] || {}) };
      next[selEmp.id][selDate] = list;
      setTsMap(next);
      closeEdit();
      onAfterChange && onAfterChange();
      return;
    }

    // edit existing
    const list = (empTs[selDate] || []).slice();
    const idx = list.findIndex(r => r === editDialogItem || (r.commessa === editDialogItem?.commessa && r.ore === editDialogItem?.ore && r.descrizione === editDialogItem?.descrizione));
    if (idx === -1) return;
    list[idx] = { ...list[idx], ore: updated.ore, descrizione: updated.descrizione, commessa: updated.commessa };
    const next = { ...tsMap };
    next[selEmp.id] = { ...(next[selEmp.id] || {}) };
    next[selEmp.id][selDate] = list;
    setTsMap(next);
    closeEdit();
    onAfterChange && onAfterChange();
  }, [selEmp, selDate, tsMap, editDialogItem, setTsMap, onAfterChange, closeEdit, editMode]);

  const confirmDelete = useCallback((entry) => {
    if (!selEmp || !selDate || !entry) return;
    setDeleteCandidate(entry);
    setConfirmOpen(true);
  }, [selEmp, selDate]);

  const doDelete = useCallback(() => {
    if (!selEmp || !selDate || !deleteCandidate) return;
    const empTs = tsMap[selEmp.id] || {};
    const list = (empTs[selDate] || []).slice();
    const idx = list.findIndex(r => r === deleteCandidate || (r.commessa === deleteCandidate.commessa && r.ore === deleteCandidate.ore && r.descrizione === deleteCandidate.descrizione));
    if (idx === -1) return;
    list.splice(idx, 1);
    const next = { ...tsMap };
    next[selEmp.id] = { ...(next[selEmp.id] || {}) };
    if (list.length === 0) delete next[selEmp.id][selDate]; else next[selEmp.id][selDate] = list;
    setTsMap(next);
    setConfirmOpen(false);
    setDeleteCandidate(null);
    onAfterChange && onAfterChange();
  }, [selEmp, selDate, deleteCandidate, tsMap, setTsMap, onAfterChange]);

  return {
    openEdit, openAdd, closeEdit, saveEdited,
    confirmDelete, doDelete,
    editDialog: { open: editDialogOpen, item: editDialogItem, mode: editMode },
    deleteDialog: { open: confirmOpen, candidate: deleteCandidate },
    setConfirmOpen
  };
}
export default useEntryEditing;
