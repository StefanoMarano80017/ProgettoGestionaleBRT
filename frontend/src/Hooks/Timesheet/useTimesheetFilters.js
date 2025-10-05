import { useState, useCallback } from 'react';

export function useTimesheetFilters({ tsMap, year, month }) {
  const [filterCompany, setFilterCompany] = useState('ALL');
  const [searchEmployee, setSearchEmployee] = useState('');
  const [searchCommessa, setSearchCommessa] = useState('');

  const empMatchesFilters = useCallback((e) => {
    if (filterCompany !== 'ALL' && e.azienda !== filterCompany) return false;
    if (searchEmployee.trim()) {
      const needle = searchEmployee.trim().toLowerCase();
      if (!(`${e.name}`.toLowerCase().includes(needle))) return false;
    }
    if (searchCommessa.trim()) {
      const needle = searchCommessa.trim().toLowerCase();
      const ts = tsMap[e.id] || {};
      let found = false;
      Object.entries(ts).some(([key, records]) => {
        if (key.endsWith('_segnalazione')) return false;
        const [yy, mm] = key.split('-').map(Number);
        if (yy !== year || mm !== month + 1) return false;
        return (records || []).some(r => String(r.commessa).toLowerCase().includes(needle));
      }) && (found = true);
      if (!found) return false;
    }
    return true;
  }, [filterCompany, searchEmployee, searchCommessa, tsMap, year, month]);

  const applyFilters = useCallback((employees) => employees.filter(empMatchesFilters).map(e => ({ id: e.id, dipendente: e.name, azienda: e.azienda || '' })), [empMatchesFilters]);

  return {
    filterCompany, setFilterCompany,
    searchEmployee, setSearchEmployee,
    searchCommessa, setSearchCommessa,
    applyFilters,
    empMatchesFilters
  };
}
export default useTimesheetFilters;
