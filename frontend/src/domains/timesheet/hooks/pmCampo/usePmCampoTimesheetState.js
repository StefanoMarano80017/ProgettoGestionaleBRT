import { useCallback, useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { useTimesheetContext, useTimesheetStaging, useDayEditor } from '@domains/timesheet/hooks';
import { useTimesheetApi } from '@domains/timesheet/hooks/useTimesheetApi';
import { ROLES, listAllUsers } from '@mocks/UsersMock';
import { EMPLOYEE_COMMESSE } from '@mocks/ProjectMock';
import { validatePmCampoDraft } from '@domains/timesheet/hooks/validation/pmCampoValidators';
import { useUser } from "@/context/UserContext";

const EMPTY_OBJECT = Object.freeze({});
const NON_WORK_CODES = new Set(['FERIE', 'MALATTIA', 'PERMESSO', 'ROL']);

function createUserMap(users) {
  return users.reduce((map, entry) => {
    if (entry?.id) {
      map.set(entry.id, entry);
    }
    return map;
  }, new Map());
}

function buildOperaiUsers(users, azienda) {
  return users
    .filter((user) => user.roles?.includes(ROLES.OPERAIO))
    .filter((user) => !azienda || user.azienda === azienda)
    .map((user) => ({
      id: user.id,
      nome: user.nome || user.name || '',
      cognome: user.cognome || '',
      azienda: user.azienda,
      roles: user.roles,
    }));
}

function normalizeEmployee(employee, userMap, fallbackRole = ROLES.OPERAIO) {
  const meta = userMap.get(employee.id) || employee;
  const nome = meta?.nome || meta?.name || employee.nome || employee.name || '';
  const cognome = meta?.cognome || employee.cognome || '';
  const rolesList = Array.isArray(meta?.roles) && meta.roles.length
    ? meta.roles
    : (Array.isArray(employee.roles) && employee.roles.length ? employee.roles : [fallbackRole]);
  const aziendaValue = employee.azienda || meta?.azienda || null;
  return {
    id: employee.id,
    nome,
    cognome,
    azienda: aziendaValue,
    roles: rolesList,
  };
}

function ensurePmIncluded(list, pmSelf) {
  if (!pmSelf) return list;
  const exists = list.some((entry) => entry.id === pmSelf.id);
  return exists ? list : [pmSelf, ...list];
}

function buildEmployees({ baseEmployees, operaiUsers, pmSelf, userMap }) {
  const normalizeList = (list) => list.map((employee) => normalizeEmployee(employee, userMap));

  if (!baseEmployees.length) {
    const fallback = ensurePmIncluded(operaiUsers, pmSelf);
    return normalizeList(fallback).sort((a, b) => `${a.cognome}${a.nome}`.localeCompare(`${b.cognome}${b.nome}`));
  }

  const operaiIds = new Set(operaiUsers.map((op) => op.id));
  const filtered = baseEmployees
    .filter((employee) => operaiIds.has(employee.id) || (pmSelf && employee.id === pmSelf.id))
    .map((employee) => normalizeEmployee(employee, userMap));

  const unique = [];
  const seen = new Set();
  ensurePmIncluded(filtered, pmSelf).forEach((employee) => {
    if (seen.has(employee.id)) return;
    seen.add(employee.id);
    unique.push(employee);
  });

  return unique.sort((a, b) => {
    if (pmSelf && a.id === pmSelf.id) return -1;
    if (pmSelf && b.id === pmSelf.id) return 1;
    return `${a.cognome}${a.nome}`.localeCompare(`${b.cognome}${b.nome}`);
  });
}

function buildCommessaOptionsForEmployee(employeeId, dataMap) {
  if (!employeeId) return [];
  const data = dataMap?.[employeeId] || {};
  const codes = new Set();

  Object.entries(data).forEach(([key, items]) => {
    if (key.endsWith('_segnalazione')) return;
    (items || []).forEach((item) => {
      const code = String(item?.commessa || '').toUpperCase();
      if (code && !NON_WORK_CODES.has(code)) {
        codes.add(code);
      }
    });
  });

  const predefined = EMPLOYEE_COMMESSE?.[employeeId];
  if (Array.isArray(predefined)) {
    predefined.forEach((code) => {
      const normalized = String(code || '').toUpperCase();
      if (normalized && !NON_WORK_CODES.has(normalized)) {
        codes.add(normalized);
      }
    });
  }

  return Array.from(codes).sort();
}

export function usePmCampoTimesheetState() {
  const { user, loading } = useUser();
  const roles = user.rolesString;
  const ctx = useTimesheetContext();
  const staging = useTimesheetStaging();
  const dayEditor = useDayEditor();
  const { api } = useTimesheetApi();

  const azienda = user?.azienda || null;
  const canManageGroups = roles?.includes(ROLES.PM_CAMPO);

  const allUsers = useMemo(() => listAllUsers() || [], []);
  const userMap = useMemo(() => createUserMap(allUsers), [allUsers]);
  const operaiUsers = useMemo(() => buildOperaiUsers(allUsers, azienda), [allUsers, azienda]);

  const pmSelf = useMemo(() => {
    if (!user || !canManageGroups) return null;
    const nome = user.nome || user.name || '';
    const cognome = user.cognome || '';
    return {
      id: user.id,
      nome,
      cognome,
      azienda: user.azienda || null,
      roles: Array.isArray(roles) && roles.length ? roles : [ROLES.PM_CAMPO],
    };
  }, [user, roles, canManageGroups]);

  const employees = useMemo(() => buildEmployees({
    baseEmployees: ctx?.employees || [],
    operaiUsers,
    pmSelf,
    userMap,
  }), [ctx?.employees, operaiUsers, pmSelf, userMap]);

  const [groups, setGroups] = useState([]);
  const [personalMap, setPersonalMap] = useState(EMPTY_OBJECT);
  const [loadingExtras, setLoadingExtras] = useState(true);
  const [extrasError, setExtrasError] = useState('');

  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);

  const stagingEntries = staging?.entries || EMPTY_OBJECT;
  const stagingMeta = useMemo(() => staging?.buildStagedMetaMap?.() || EMPTY_OBJECT, [staging]);

  const loadExtras = useCallback(async () => {
    setLoadingExtras(true);
    setExtrasError('');
    try {
      const [loadedGroups, personal] = await Promise.all([
        api.listPmGroups(azienda),
        api.getOperaioPersonalMap(),
      ]);
      setGroups(Array.isArray(loadedGroups) ? loadedGroups : []);
      setPersonalMap(personal || EMPTY_OBJECT);
    } catch (error) {
      setExtrasError(error?.message || 'Errore caricamento dati PM Campo');
    } finally {
      setLoadingExtras(false);
    }
  }, [api, azienda]);

  useEffect(() => {
    loadExtras();
  }, [loadExtras]);

  useEffect(() => {
    if (!selectedEmployeeId && employees.length > 0) {
      setSelectedEmployeeId(employees[0].id);
      return;
    }
    if (selectedEmployeeId && !employees.some((employee) => employee.id === selectedEmployeeId)) {
      setSelectedEmployeeId(employees[0]?.id || null);
    }
  }, [employees, selectedEmployeeId]);

  const month = ctx?.month || new Date().getMonth();
  const year = ctx?.year || new Date().getFullYear();

  const selectedEmployeeMeta = useMemo(() => {
    if (!selectedEmployeeId) return null;
    return employees.find((employee) => employee.id === selectedEmployeeId) || null;
  }, [employees, selectedEmployeeId]);

  const activeEmployeeMeta = useMemo(() => {
    if (dayEditor.employeeId) {
      return employees.find((employee) => employee.id === dayEditor.employeeId) || selectedEmployeeMeta;
    }
    return selectedEmployeeMeta;
  }, [dayEditor.employeeId, employees, selectedEmployeeMeta]);

  const dataMap = ctx?.dataMap || EMPTY_OBJECT;
  const timesheetLoading = Boolean(ctx?.loading);

  const selectedEmployeeData = useMemo(() => {
    if (!selectedEmployeeId) return EMPTY_OBJECT;
    return dataMap?.[selectedEmployeeId] || EMPTY_OBJECT;
  }, [dataMap, selectedEmployeeId]);

  const activeEmployeeData = useMemo(() => {
    if (dayEditor.employeeId) {
      return dataMap?.[dayEditor.employeeId] || EMPTY_OBJECT;
    }
    return selectedEmployeeData;
  }, [dataMap, dayEditor.employeeId, selectedEmployeeData]);

  const commesseForEmployee = useMemo(() => {
    const targetId = dayEditor.employeeId || selectedEmployeeId;
    if (!targetId) return [];
    const employeeData = dataMap?.[targetId] || EMPTY_OBJECT;
    const keys = Object.keys(employeeData);
    const set = new Set();
    keys.forEach((key) => {
      if (key.endsWith('_segnalazione')) return;
      (employeeData[key] || []).forEach((entry) => {
        if (entry?.commessa) {
          set.add(entry.commessa);
        }
      });
    });
    return Array.from(set);
  }, [dataMap, dayEditor.employeeId, selectedEmployeeId]);

  const commessaOptions = useMemo(
    () => buildCommessaOptionsForEmployee(selectedEmployeeId, dataMap),
    [selectedEmployeeId, dataMap]
  );

  const handleSelectEmployee = useCallback((employeeId) => {
    setSelectedEmployeeId(employeeId);
    setSelectedDay(null);
  }, []);

  const handleDaySelect = useCallback((employeeId, dateKey) => {
    setSelectedEmployeeId(employeeId);
    setSelectedDay(dateKey);
  }, []);

  const handleDayDoubleClick = useCallback((employeeId, dateKey) => {
    setSelectedEmployeeId(employeeId);
    setSelectedDay(dateKey);
    dayEditor.openEditor(employeeId, dateKey);
  }, [dayEditor]);

  const handleCloseEditor = useCallback(() => {
    dayEditor.closeEditor?.();
    dayEditor.close?.();
    dayEditor.resetEditor?.();
  }, [dayEditor]);

  const handleValidateDraft = useCallback((employeeId, dateKey, draft) => {
    if (!employeeId || !dateKey) return { ok: true };
    return validatePmCampoDraft({
      opId: employeeId,
      dateKey,
      draft,
      tsMap: dataMap,
      personalMap,
      stagedEntries: stagingEntries,
    });
  }, [dataMap, personalMap, stagingEntries]);

  const stageDraft = useCallback((employeeId, dateKey, draft) => {
    if (!employeeId || !dateKey) {
      return { ok: false, error: 'Dati incompleti per lo staging.' };
    }
    const validation = handleValidateDraft(employeeId, dateKey, draft);
    if (!validation.ok) {
      return validation;
    }
    try {
      staging.stageDraft?.(employeeId, dateKey, draft);
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error?.message || 'Errore durante lo staging.' };
    }
  }, [handleValidateDraft, staging]);

  const stageGroupDistribution = useCallback((group, dateKey) => {
    if (!group?.members?.length) {
      return { staged: 0, errors: ['La squadra non contiene membri.'] };
    }

    const entries = group.timesheet?.[dateKey] || [];
    const commesseSet = new Set(entries.map((entry) => String(entry.commessa || '').toUpperCase()));
    const result = { staged: 0, errors: [] };

    group.members.forEach((memberId) => {
      const baseMerged = staging.getMergedDay
        ? staging.getMergedDay(memberId, dateKey)
        : (dataMap?.[memberId]?.[dateKey] || []);
      const preserved = (baseMerged || []).filter((row) => !commesseSet.has(String(row?.commessa || '').toUpperCase()));
      const groupRows = entries.map((entry, idx) => {
        const ore = Number(entry?.assegnazione?.[memberId] || 0);
        if (!ore) return null;
        return {
          id: `grp-${group.id}-${memberId}-${idx}`,
          commessa: entry.commessa,
          ore,
          descrizione: entry.descrizione || `Assegnazione ${group.name}`,
        };
      }).filter(Boolean);

      const draft = [...preserved, ...groupRows];
      const stagingResult = stageDraft(memberId, dateKey, draft);
      if (!stagingResult.ok) {
        result.errors.push(`${memberId}: ${stagingResult.error}`);
        return;
      }
      result.staged += 1;
    });

    return result;
  }, [dataMap, stageDraft, staging]);

  const stageAbsence = useCallback(({ employeeId, dateKey, code, hours }) => {
    const draft = [{
      id: `absence-${code}-${Date.now()}`,
      commessa: code,
      ore: Number(hours),
      descrizione: '',
    }];
    return stageDraft(employeeId, dateKey, draft);
  }, [stageDraft]);

  const clearDay = useCallback(({ employeeId, dateKey }) => stageDraft(employeeId, dateKey, []), [stageDraft]);

  const assignGroupHours = useCallback(async ({ groupId, dateKey, commessa, oreTot }) => {
    try {
      const group = await api.assignHoursToGroup({
        groupId,
        dateKey,
        commessa,
        oreTot,
      });
      const stagingResult = stageGroupDistribution(group, dateKey) || { staged: 0, errors: [] };
      await loadExtras();
      return { ok: !stagingResult.errors.length, ...stagingResult };
    } catch (error) {
      return { ok: false, error: error?.message || 'Errore assegnazione ore.' };
    }
  }, [api, stageGroupDistribution, loadExtras]);

  const createGroup = useCallback(async (payload) => {
    await api.createPmGroup({ ...payload, azienda });
    await loadExtras();
  }, [api, azienda, loadExtras]);

  const updateGroup = useCallback(async (groupId, payload) => {
    await api.updatePmGroup(groupId, payload);
    await loadExtras();
  }, [api, loadExtras]);

  const deleteGroup = useCallback(async (groupId) => {
    await api.deletePmGroup(groupId);
    await loadExtras();
  }, [api, loadExtras]);

  const selectedDayKey = useMemo(() => {
    if (selectedDay) return selectedDay;
    const fallback = new Date(year, month, 1);
    return format(fallback, 'yyyy-MM-dd');
  }, [selectedDay, month, year]);

  return {
    month,
    year,
    dayEditor,
    dataMap,
    employees,
    operaiUsers,
    groups,
    personalMap,
    loadingExtras,
    extrasError,
    timesheetLoading,
    selectedEmployeeId,
    selectedEmployeeMeta,
    activeEmployeeMeta,
    selectedEmployeeData,
    activeEmployeeData,
    commesseForEmployee,
    commessaOptions,
    stagingEntries,
    stagingMeta,
    selectedDay,
    selectedDayKey,
    canManageGroups,
    handleSelectEmployee,
    handleDaySelect,
    handleDayDoubleClick,
    handleCloseEditor,
    stageAbsence,
    clearDay,
    assignGroupHours,
    createGroup,
    updateGroup,
    deleteGroup,
    handleValidateDraft,
  };
}
