import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * useDayEditor
 * Centralizes logic for opening/closing a day editor dialog (DayEntryDialog) with
 * an (employeeId, dateKey) pair. Both employee and admin pages now share this to
 * keep behavior uniform (single click = select, double click = open dialog).
 */
export default function useDayEditor() {
  const [editorState, setEditorState] = useState({ employeeId: null, date: null, open: false });
  const originFocusRef = useRef(null);

  const openEditor = useCallback((employeeId, date) => {
    // Capture the currently focused element to restore after close.
    try { originFocusRef.current = document.activeElement; } catch { /* ignore */ }
    setEditorState({ employeeId, date, open: true });
  }, []);

  const closeEditor = useCallback(() => {
    setEditorState(s => ({ ...s, open: false }));
  }, []);

  const resetEditor = useCallback(() => {
    setEditorState({ employeeId: null, date: null, open: false });
  }, []);

  // Restore focus on dialog close
  useEffect(() => {
    if (!editorState.open && originFocusRef.current) {
      // Defer to next frame to avoid racing unmount
      const el = originFocusRef.current;
      requestAnimationFrame(() => { try { el.focus?.(); } catch { /* ignore */ } });
      originFocusRef.current = null;
    }
  }, [editorState.open]);

  return {
    editorState,
    openEditor,
    closeEditor,
    resetEditor,
    isOpen: editorState.open,
    employeeId: editorState.employeeId,
    date: editorState.date,
  };
}
