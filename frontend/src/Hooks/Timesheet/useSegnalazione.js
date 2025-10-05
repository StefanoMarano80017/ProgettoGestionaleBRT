import { useState, useCallback } from 'react';
import { useTimesheetApi } from './useTimesheetApi';

export function useSegnalazione({ selEmp, selDate } = {}) {
  const { api } = useTimesheetApi();
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendingOk, setSendingOk] = useState("");

  const openSeg = useCallback(() => { setSendingOk(""); setOpen(true); }, []);
  const closeSeg = useCallback(() => { setOpen(false); }, []);

  const send = useCallback(async (message) => {
    if (!selEmp || !selDate) return;
    setSending(true); setSendingOk("");
    try {
      await api.sendSegnalazione(selEmp.id, selDate, message);
      setSendingOk('Segnalazione inviata.');
      setTimeout(() => setOpen(false), 800);
    } finally { setSending(false); }
  }, [api, selEmp, selDate]);

  return { sigOpen: open, openSeg, closeSeg, send, sending, sendingOk };
}
export default useSegnalazione;
