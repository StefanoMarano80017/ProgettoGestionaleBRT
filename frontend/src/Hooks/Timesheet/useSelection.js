import { useState, useCallback } from 'react';

export function useSelection() {
  const [selEmp, setSelEmp] = useState(null); // { id, dipendente, azienda }
  const [selDate, setSelDate] = useState(null); // 'YYYY-MM-DD'

  const selectEmp = useCallback((emp) => { setSelEmp(emp); }, []);
  const selectDate = useCallback((dateKey) => { setSelDate(dateKey); }, []);
  const clearSelection = useCallback(() => { setSelEmp(null); setSelDate(null); }, []);

  return { selEmp, selDate, selectEmp, selectDate, clearSelection, setSelEmp, setSelDate };
}
export default useSelection;
