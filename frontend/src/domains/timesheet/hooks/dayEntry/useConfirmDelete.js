import { useState } from 'react';

export function useConfirmDelete(onDeleteIndex) {
  const [open, setOpen] = useState(false);
  const [targetIdx, setTargetIdx] = useState(null);
  const request = (i) => { setTargetIdx(i); setOpen(true); };
  const confirm = () => { if (targetIdx != null) onDeleteIndex(targetIdx); setOpen(false); setTargetIdx(null); };
  const cancel = () => { setOpen(false); setTargetIdx(null); };
  return { open, targetIdx, request, confirm, cancel };
}
export default useConfirmDelete;
