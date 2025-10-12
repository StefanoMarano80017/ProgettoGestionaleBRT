import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Container, Box, Paper, Typography, CircularProgress, Alert, Grid, Stack, Button } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import useAuth from '@/domains/auth/hooks/useAuth';
import { TimesheetProvider, useTimesheetContext, useTimesheetStaging, useDayEditor } from '@domains/timesheet/hooks';
import TimesheetStagingBar from '@domains/timesheet/components/staging/TimesheetStagingBar';
import AdminTimesheetGrid from '@domains/timesheet/components/admin-grid/AdminTimesheetGrid';
import DayEntryDialog from '@domains/timesheet/components/calendar/DayEntryDialog';
import { useTimesheetApi } from '@domains/timesheet/hooks/useTimesheetApi';
import { ROLES, listAllUsers } from '@mocks/UsersMock';
import GroupManagerPanel from '@domains/timesheet/components/pm-campo/GroupManagerPanel';
import BulkToolsPanel from '@domains/timesheet/components/pm-campo/BulkToolsPanel';
import { validatePmCampoDraft } from '@domains/timesheet/hooks/validation/pmCampoValidators';

const EMPTY_OBJECT = Object.freeze({});

function useOperaiMetadata(azienda, allUsers) {
  return useMemo(() => {
    const source = Array.isArray(allUsers) ? allUsers : listAllUsers();
    return source
      .filter((u) => u.roles?.includes(ROLES.OPERAIO))
      .filter((u) => !azienda || u.azienda === azienda)
      .map((user) => ({
        id: user.id,
        nome: user.nome || user.name || '',
        cognome: user.cognome || '',
        azienda: user.azienda,
        roles: user.roles,
      }));
  }, [azienda, allUsers]);
}

function PMCampoInner() {
  const navigate = useNavigate();
  const { user, roles = [] } = useAuth();
  const canNavigateBack = typeof navigate === 'function';
  const azienda = user?.azienda || null;
  const ctx = useTimesheetContext();
  const staging = useTimesheetStaging();
  const dayEditor = useDayEditor();
  const { api } = useTimesheetApi();

  const allUsers = useMemo(() => listAllUsers(), []);
  const userMap = useMemo(() => {
    const map = new Map();
    (allUsers || []).forEach((entry) => {
      if (entry?.id) map.set(entry.id, entry);
    });
    return map;
  }, [allUsers]);

  const operaiUsers = useOperaiMetadata(azienda, allUsers);
  const operaiIds = useMemo(() => new Set(operaiUsers.map((o) => o.id)), [operaiUsers]);
  const pmSelf = useMemo(() => {
    if (!user || !roles?.includes(ROLES.PM_CAMPO)) return null;
    const nome = user.nome || user.name || '';
    const cognome = user.cognome || '';
    return {
      id: user.id,
      nome,
      cognome,
      azienda: user.azienda || null,
      roles: Array.isArray(roles) && roles.length ? roles : [ROLES.PM_CAMPO],
    };
  }, [user, roles]);

  const [groups, setGroups] = useState([]);
  const [personalMap, setPersonalMap] = useState({});
  const [loadingExtras, setLoadingExtras] = useState(true);
  const [extrasError, setExtrasError] = useState('');

  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);

  const filteredEmployees = useMemo(() => {
    const base = ctx?.employees || [];
    const normalize = (emp) => {
      const meta = userMap.get(emp.id);
      const nome = meta?.nome || meta?.name || emp.nome || emp.name || '';
      const cognome = meta?.cognome || emp.cognome || '';
      const rolesList = Array.isArray(meta?.roles) && meta.roles.length
        ? meta.roles
        : (Array.isArray(emp.roles) && emp.roles.length ? emp.roles : [ROLES.OPERAIO]);
      const aziendaValue = emp.azienda || meta?.azienda || null;
      return {
        id: emp.id,
        nome,
        cognome,
        azienda: aziendaValue,
        roles: rolesList,
      };
    };

    const ensurePmSelf = (list) => {
      if (!pmSelf) return list;
      const exists = list.some((entry) => entry.id === pmSelf.id);
      if (exists) return list;
      return [
        { ...pmSelf },
        ...list,
      ];
    };

    if (!base.length) {
      const fallback = ensurePmSelf(operaiUsers);
      return fallback
        .map((emp) => normalize(emp))
        .sort((a, b) => `${a.cognome}${a.nome}`.localeCompare(`${b.cognome}${b.nome}`));
    }

    const filtered = base
      .filter((emp) => operaiIds.has(emp.id) || (pmSelf && emp.id === pmSelf.id))
      .map(normalize);

    const unique = [];
    const seen = new Set();
    [...ensurePmSelf(filtered)].forEach((entry) => {
      if (seen.has(entry.id)) return;
      seen.add(entry.id);
      unique.push(entry);
    });

    return unique.sort((a, b) => {
      if (pmSelf && a.id === pmSelf.id) return -1;
      if (pmSelf && b.id === pmSelf.id) return 1;
      return `${a.cognome}${a.nome}`.localeCompare(`${b.cognome}${b.nome}`);
    });
  }, [ctx?.employees, operaiIds, operaiUsers, pmSelf, userMap]);

  const loadExtras = useCallback(async () => {
    setLoadingExtras(true);
    setExtrasError('');
    try {
      const [loadedGroups, personal] = await Promise.all([
        api.listPmGroups(azienda),
        api.getOperaioPersonalMap(),
      ]);
      setGroups(Array.isArray(loadedGroups) ? loadedGroups : []);
      setPersonalMap(personal || {});
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
    if (!selectedEmployeeId && filteredEmployees.length > 0) {
      setSelectedEmployeeId(filteredEmployees[0].id);
    } else if (selectedEmployeeId && !filteredEmployees.some((emp) => emp.id === selectedEmployeeId)) {
      setSelectedEmployeeId(filteredEmployees[0]?.id || null);
    }
  }, [filteredEmployees, selectedEmployeeId]);

  const month = ctx?.month || new Date().getMonth();
  const year = ctx?.year || new Date().getFullYear();

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
    if (typeof dayEditor.closeEditor === 'function') {
      dayEditor.closeEditor();
    } else if (typeof dayEditor.close === 'function') {
      dayEditor.close();
    }
    dayEditor.resetEditor?.();
  }, [dayEditor]);

  const selectedEmployeeMeta = useMemo(() => {
    if (!selectedEmployeeId) return null;
    return filteredEmployees.find((emp) => emp.id === selectedEmployeeId) || null;
  }, [filteredEmployees, selectedEmployeeId]);

  const activeEmployeeMeta = useMemo(() => {
    if (dayEditor.employeeId) {
      return filteredEmployees.find((emp) => emp.id === dayEditor.employeeId) || selectedEmployeeMeta;
    }
    return selectedEmployeeMeta;
  }, [dayEditor.employeeId, filteredEmployees, selectedEmployeeMeta]);

  const selectedEmployeeData = useMemo(() => {
    if (!selectedEmployeeId) return {};
    return ctx?.dataMap?.[selectedEmployeeId] || {};
  }, [ctx?.dataMap, selectedEmployeeId]);

  const activeEmployeeData = useMemo(() => {
    if (dayEditor.employeeId) {
      return ctx?.dataMap?.[dayEditor.employeeId] || {};
    }
    return selectedEmployeeData;
  }, [ctx?.dataMap, dayEditor.employeeId, selectedEmployeeData]);

  const commesseForEmployee = useMemo(() => {
    const targetId = dayEditor.employeeId || selectedEmployeeId;
    if (!targetId) return [];
    const all = ctx?.dataMap?.[targetId] || {};
    const keys = Object.keys(all);
    const set = new Set();
    keys.forEach((key) => {
      if (key.endsWith('_segnalazione')) return;
      (all[key] || []).forEach((entry) => {
        if (entry?.commessa) set.add(entry.commessa);
      });
    });
    return Array.from(set);
  }, [ctx?.dataMap, dayEditor.employeeId, selectedEmployeeId]);

  const stagingMeta = useMemo(() => staging?.buildStagedMetaMap?.() || {}, [staging]);
  const stagingEntries = staging?.entries || EMPTY_OBJECT;

  const handleValidateDraft = useCallback((employeeId, dateKey, draft) => {
    if (!employeeId || !dateKey) return { ok: true };
    return validatePmCampoDraft({
      opId: employeeId,
      dateKey,
      draft,
      tsMap: ctx?.dataMap,
      personalMap,
      stagedEntries: stagingEntries,
    });
  }, [ctx?.dataMap, personalMap, stagingEntries]);

  const canManageGroups = roles?.includes(ROLES.PM_CAMPO);

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: 3 }}>
      <Container maxWidth="xl">
        <Paper
          elevation={0}
          sx={{
            mb: 2,
            p: 2.5,
            borderRadius: 2,
            background: (theme) =>
              `linear-gradient(135deg, ${theme.palette.customBlue3?.main || theme.palette.primary.main} 0%, ${theme.palette.customBlue2?.main || '#006494'} 50%, ${theme.palette.customBlue1?.main || '#00A6FB'} 100%)`,
            color: '#ffffff',
            position: 'relative',
            overflow: 'hidden',
            border: '1px solid',
            borderColor: 'customBlue3.main'
          }}
        >
          <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#ffffff' }}>
                Timesheet — PM Campo
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5, opacity: 0.95, color: '#ffffff' }}>
                Gestisci i timesheet giornalieri degli operai, squadre e riparti ore prima del salvataggio definitivo.
              </Typography>
            </Box>
            {canNavigateBack && (
              <Button variant="outlined" size="small" startIcon={<ArrowBack />} onClick={() => navigate(-1)} sx={{ borderColor: '#ffffff', color: '#ffffff' }}>
                Indietro
              </Button>
            )}
          </Stack>
        </Paper>

        <TimesheetStagingBar sticky={false} panelProps={{ validateDraft: handleValidateDraft }} />

        {(ctx?.loading || loadingExtras) && (
          <Paper sx={{ p: 4, borderRadius: 2, mb: 3, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress size={32} />
          </Paper>
        )}

        {extrasError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {extrasError}
          </Alert>
        )}

        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid size={{ xs: 12, md: 3, lg: 3 }}>
            <Stack spacing={1.5}>
              <BulkToolsPanel
                month={month}
                year={year}
                selectedEmployee={selectedEmployeeMeta}
                selectedDay={selectedDay}
                groups={groups}
                onDraftValidate={handleValidateDraft}
                onDraftStage={staging?.stageDraft}
                onRefresh={loadExtras}
                disabled={!canManageGroups}
              />
              <GroupManagerPanel
                groups={groups}
                operai={operaiUsers}
                personalMap={personalMap}
                disabled={!canManageGroups}
                onCreate={async (payload) => {
                  await api.createPmGroup({ ...payload, azienda });
                  await loadExtras();
                }}
                onUpdate={async (groupId, payload) => {
                  await api.updatePmGroup(groupId, payload);
                  await loadExtras();
                }}
                onDelete={async (groupId) => {
                  await api.deletePmGroup(groupId);
                  await loadExtras();
                }}
              />
            </Stack>
          </Grid>
          <Grid size={{ xs: 12, md: 9, lg: 9 }}>
            <Box
              sx={{
                height: '100%',
                minHeight: { xs: 480, md: 600 },
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <AdminTimesheetGrid
                year={year}
                month={month}
                employees={filteredEmployees}
                dataMap={ctx?.dataMap || {}}
                stagedMeta={stagingMeta}
                stagingEntries={stagingEntries}
                selectedEmployeeId={selectedEmployeeId}
                onSelectEmployee={handleSelectEmployee}
                onDayDoubleClick={handleDayDoubleClick}
                onDaySelect={handleDaySelect}
                selectedDay={selectedDay}
                highlightedDates={new Set(selectedDay ? [selectedDay] : [])}
              />
            </Box>
          </Grid>
        </Grid>

        <DayEntryDialog
          open={dayEditor.isOpen}
          onClose={handleCloseEditor}
          date={dayEditor.date}
          employeeId={dayEditor.employeeId}
          employeeName={activeEmployeeMeta ? `${activeEmployeeMeta.nome} ${activeEmployeeMeta.cognome}`.trim() : ''}
          data={activeEmployeeData}
          commesse={commesseForEmployee}
        />
      </Container>
    </Box>
  );
}

export default function PMCampoTimesheet() {
  return (
    <TimesheetProvider scope="all" autoLoad>
      <PMCampoInner />
    </TimesheetProvider>
  );
}
