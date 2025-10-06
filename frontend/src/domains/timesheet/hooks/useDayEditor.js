import { useState, useCallback, useRef, useEffect } from 'react';

export default function useDayEditor() {
	const [editorState, setEditorState] = useState({ employeeId: null, date: null, open: false });
	const originFocusRef = useRef(null);
	const openEditor = useCallback((employeeId, date) => {
		try { originFocusRef.current = document.activeElement; } catch {}
		setEditorState({ employeeId, date, open: true });
	}, []);
	const closeEditor = useCallback(() => { setEditorState(s => ({ ...s, open: false })); }, []);
	const resetEditor = useCallback(() => { setEditorState({ employeeId: null, date: null, open: false }); }, []);
	useEffect(() => {
		if (!editorState.open && originFocusRef.current) {
			const el = originFocusRef.current;
			requestAnimationFrame(() => { try { el.focus?.(); } catch {} });
			originFocusRef.current = null;
		}
	}, [editorState.open]);
	return { editorState, openEditor, closeEditor, resetEditor, isOpen: editorState.open, employeeId: editorState.employeeId, date: editorState.date };
}

