import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTimesheetApi } from './useTimesheetApi';

// Gestione gruppi PM Campo + derivazioni calendar & pannelli
export function usePmGroups(azienda) {
  const { api } = useTimesheetApi();
  const [groups, setGroups] = useState([]);
  const [allOperai, setAllOperai] = useState([]);
  const [commesse, setCommesse] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const selectedGroup = useMemo(() => groups.find(g => g.id === selectedGroupId) || null, [groups, selectedGroupId]);

  const refreshGroups = useCallback(async () => {
    const gs = await api.listPmGroups(azienda);
    setGroups(gs || []);
  }, [api, azienda]);

  const refreshOperai = useCallback(async () => {
    const ops = await api.getOperaiByAzienda(azienda);
    setAllOperai(ops || []);
  }, [api, azienda]);

  const refreshCommesse = useCallback(async () => {
    // Si usa un id fittizio come nel codice originale (emp-001) per base
    const list = await api.getActiveCommesseForEmployee('emp-001');
    setCommesse(list || []);
  }, [api]);

  useEffect(() => { refreshOperai(); refreshGroups(); refreshCommesse(); }, [refreshOperai, refreshGroups, refreshCommesse]);

  const createGroup = useCallback(async ({ name, members }) => {
    await api.createPmGroup({ name, members, azienda });
    await refreshGroups();
  }, [api, azienda, refreshGroups]);

  const updateGroup = useCallback(async (groupId, patch) => {
    await api.updatePmGroup(groupId, patch);
    await refreshGroups();
  }, [api, refreshGroups]);

  const deleteGroup = useCallback(async (groupId) => {
    await api.deletePmGroup(groupId);
    if (selectedGroupId === groupId) setSelectedGroupId(null);
    await refreshGroups();
  }, [api, refreshGroups, selectedGroupId]);

  const assignHours = useCallback(async ({ groupId, dateKey, commessa, oreTot }) => {
    await api.assignHoursToGroup({ groupId, dateKey, commessa, oreTot });
    await refreshGroups();
  }, [api, refreshGroups]);

  // Calendar data derivato: somma ore totali per gruppo
  const calendarData = useMemo(() => {
    const map = {};
    for (const g of groups) {
      const ts = g.timesheet || {};
      for (const [date, entries] of Object.entries(ts)) {
        if (!map[date]) map[date] = [];
        const totForDate = entries.reduce((s, e) => s + (Number(e.oreTot) || 0), 0);
        if (totForDate > 0) {
          map[date].push({ commessa: `GRP:${g.name}`, ore: totForDate, descrizione: `Ore totali gruppo ${g.name}` });
        }
      }
    }
    return map;
  }, [groups]);

  const renderDayTooltip = useCallback((dateKey) => {
    const lines = [];
    for (const g of groups) {
      const entries = g.timesheet?.[dateKey] || [];
      if (!entries.length) continue;
      const tot = entries.reduce((s, e) => s + (Number(e.oreTot) || 0), 0);
      lines.push(`${g.name}: ${tot}h`);
    }
    if (!lines.length) return '';
    // Return a plain string (or array of strings) to avoid embedding JSX inside a .js file
    // Consumers can split by "\n" or render lines as needed.
    return lines.join('\n');
  }, [groups]);

  const buildReadonlyPanel = useCallback((selectedDay) => {
    const map = {}; const entries = [];
    for (const g of groups) {
      const dayEntries = g.timesheet?.[selectedDay] || [];
      for (const e of dayEntries) entries.push({ dipendente: g.name, commessa: e.commessa, ore: Number(e.oreTot)||0, descrizione: `Gruppo ${g.name}` });
    }
    if (entries.length) map[selectedDay] = entries;
    return map;
  }, [groups]);

  const buildSelectedGroupPanel = useCallback((selectedDay) => {
    const map = {}; const g = selectedGroup; const entries = [];
    if (g) {
      const dayEntries = g.timesheet?.[selectedDay] || [];
      for (const e of dayEntries) entries.push({ dipendente: g.name, commessa: e.commessa, ore: Number(e.oreTot)||0, descrizione: `Gruppo ${g.name}` });
    }
    if (entries.length) map[selectedDay] = entries;
    return map;
  }, [selectedGroup]);

  return {
    groups, allOperai, commesse, selectedGroupId, setSelectedGroupId, selectedGroup,
    createGroup, updateGroup, deleteGroup, assignHours,
    calendarData, renderDayTooltip, buildReadonlyPanel, buildSelectedGroupPanel,
    refreshGroups, refreshOperai, refreshCommesse
  };
}
export default usePmGroups;
