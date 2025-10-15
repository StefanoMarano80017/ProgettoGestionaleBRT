import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Box, Typography, Paper, Button, Alert } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import {
  TimesheetProvider,
  useTimesheetContext,
  useTimesheetStaging,
  useDayEditor,
  useStagedMetaMap,
  useStableMergedDataMap
} from '@domains/timesheet/hooks';
import TimesheetStagingBar from '@domains/timesheet/components/staging/TimesheetStagingBar';
import DayEntryDialog from '@domains/timesheet/components/calendar/DayEntryDialog';
import AdminTimesheetGrid from '@domains/timesheet/components/admin-grid/AdminTimesheetGrid';
import AdminFiltersBar from '@domains/timesheet/components/admin-grid/AdminFiltersBar';
import AdminEmployeeInspector from '@domains/timesheet/components/admin-grid/AdminEmployeeInspector';
import useAuth from '@/domains/auth/hooks/useAuth';
import { ROLES, listAllUsers } from '@mocks/UsersMock';
import { parseDateKey, getRangeForPeriod, enumerateDateKeys } from '@domains/timesheet/components/admin-grid/utils/periodUtils';

/**
 * InnerDashboardAmministrazione
 * Core admin timesheet logic - handles data loading and state management
 */
function InnerDashboardAmministrazione() {
  const ctx = useTimesheetContext();
  const staging = useTimesheetStaging();
  const dayEditor = useDayEditor();
  const stagedMeta = useStagedMetaMap(staging);
  const stagingEntries = staging?.entries || {};
  const setSelection = ctx?.setSelection;
  const currentSelection = ctx?.selection;
  
  // Month/year state
  const [currentDate, setCurrentDate] = useState(new Date());
  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();

  // Filters state
  const [filters, setFilters] = useState({
    search: '',
    roles: ['all'],
    azienda: 'all',
    commessa: '',
    status: 'all'
  });

  // Employee selection state
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [inspectorTab, setInspectorTab] = useState('daily');
  const [periodReferenceDate, setPeriodReferenceDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const referenceDate = useMemo(() => {
    if (periodReferenceDate) return periodReferenceDate;
    if (selectedDay) {
      const parsed = parseDateKey(selectedDay);
      if (parsed) return parsed;
    }
    return new Date(year, month, 1);
  }, [periodReferenceDate, selectedDay, month, year]);

  const periodRange = useMemo(
    () => getRangeForPeriod(selectedPeriod, referenceDate),
    [selectedPeriod, referenceDate]
  );

  const highlightedDates = useMemo(() => {
    if (inspectorTab !== 'period') return new Set();
    if (!periodRange) return new Set();
    const keys = enumerateDateKeys(periodRange);
    const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
    return new Set(keys.filter((key) => key.startsWith(monthKey)));
  }, [periodRange, month, year, inspectorTab]);

  useEffect(() => {
    if (!selectedDay) return;
    const parsed = parseDateKey(selectedDay);
    if (!parsed) return;
    setPeriodReferenceDate((prev) => {
      if (prev && prev.getTime && prev.getTime() === parsed.getTime()) {
        return prev;
      }
      return parsed;
    });
  }, [selectedDay]);

  // Get all employees
  const allEmployees = useMemo(() => {
    const users = listAllUsers();
    // Filter out admin roles - they don't have stored entries
    return users.filter(user => 
      user.roles.some(role => 
        [ROLES.DIPENDENTE, ROLES.OPERAIO, ROLES.PM_CAMPO, ROLES.COORDINATORE].includes(role)
      )
    );
  }, []);

  // Apply filters
  const filteredEmployees = useMemo(() => {
    return allEmployees.filter(emp => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const fullName = `${emp.nome} ${emp.cognome}`.toLowerCase();
        if (!fullName.includes(searchLower)) return false;
      }

      // Role filter
      if (filters.roles && !filters.roles.includes('all')) {
        const hasMatchingRole = emp.roles.some(role => filters.roles.includes(role));
        if (!hasMatchingRole) return false;
      }

      // Azienda filter
      if (filters.azienda && filters.azienda !== 'all') {
        if (emp.azienda !== filters.azienda) return false;
      }

      // Commessa filter (check if employee has any entries with matching commessa in current month)
      if (filters.commessa) {
        const empData = ctx?.dataMap?.[emp.id] || {};
        const hasCommessa = Object.keys(empData).some(key => {
          if (key.endsWith('_segnalazione')) return false;
          const entries = empData[key] || [];
          return entries.some(entry => 
            String(entry?.commessa || '').toLowerCase().includes(filters.commessa.toLowerCase())
          );
        });
        if (!hasCommessa) return false;
      }

      // Status filter
      if (filters.status && filters.status !== 'all') {
        const empData = ctx?.dataMap?.[emp.id] || {};
  const stagedMetaForEmp = stagedMeta?.[emp.id] || {};
        
        if (filters.status === 'staged') {
          // Has staged changes
          if (Object.keys(stagedMetaForEmp).length === 0) return false;
        }
        
        if (filters.status === 'non-work') {
          // Has non-work entries (FERIE, MALATTIA, PERMESSO, ROL)
          const NON_WORK_CODES = ['FERIE', 'MALATTIA', 'PERMESSO', 'ROL'];
          const hasNonWork = Object.keys(empData).some(key => {
            if (key.endsWith('_segnalazione')) return false;
            const entries = empData[key] || [];
            return entries.some(entry => 
              NON_WORK_CODES.includes(String(entry?.commessa || '').toUpperCase())
            );
          });
          if (!hasNonWork) return false;
        }
      }

      return true;
    });
  }, [allEmployees, filters, ctx?.dataMap, stagedMeta]);

  const currentSelectionEmployeeId = currentSelection?.employeeId ?? null;
  const currentSelectionDate = currentSelection?.date ?? null;

  useEffect(() => {
    const firstId = filteredEmployees[0]?.id || null;

    if (!firstId) {
      if (selectedEmployeeId !== null) setSelectedEmployeeId(null);
      if (selectedDay !== null) setSelectedDay(null);
      if (setSelection && (currentSelectionEmployeeId !== null || currentSelectionDate !== null)) {
        setSelection({ employeeId: null, date: null });
      }
      return;
    }

    const stillVisible = selectedEmployeeId && filteredEmployees.some(emp => emp.id === selectedEmployeeId);

    if (!selectedEmployeeId || !stillVisible) {
      if (selectedEmployeeId !== firstId) {
        setSelectedEmployeeId(firstId);
      }
      if (selectedDay !== null) setSelectedDay(null);
      if (setSelection && (currentSelectionEmployeeId !== firstId || currentSelectionDate !== null)) {
        setSelection({ employeeId: firstId, date: null });
      }
      return;
    }

    if (setSelection && currentSelectionEmployeeId !== selectedEmployeeId) {
      setSelection({ employeeId: selectedEmployeeId, date: currentSelectionDate });
    }
  }, [
    filteredEmployees,
    selectedEmployeeId,
    selectedDay,
    setSelection,
    currentSelectionEmployeeId,
    currentSelectionDate
  ]);

  // Month navigation handlers
  const handleMonthPrev = useCallback(() => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  }, []);

  const handleMonthNext = useCallback(() => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  }, []);

  const handleToday = useCallback(() => {
    setCurrentDate(new Date());
  }, []);

  // Date selection from calendar picker
  const handleDateSelect = useCallback((date) => {
    setCurrentDate(date);
  }, []);

  const handleEmployeeSelect = useCallback((employeeId) => {
    setSelectedEmployeeId(employeeId);
    setSelectedDay(null);
    if (setSelection) {
      setSelection((prev) => {
        if (prev?.employeeId === employeeId && (prev?.date ?? null) === null) {
          return prev;
        }
        return { employeeId, date: null };
      });
    }
  }, [setSelection]);

  const handleCalendarDaySelect = useCallback((employeeId, dateKey) => {
    if (!employeeId) return;
    setSelectedEmployeeId(employeeId);
    setSelectedDay(dateKey);
    if (setSelection) {
      setSelection((prev) => {
        if (prev?.employeeId === employeeId && prev?.date === dateKey) {
          return prev;
        }
        return { employeeId, date: dateKey };
      });
    }
  }, [setSelection]);

  const handlePeriodReferenceChange = useCallback((date) => {
    if (!date) return;
    const next = date instanceof Date ? new Date(date) : new Date(date);
    if (Number.isNaN(next.getTime())) return;
    next.setHours(0, 0, 0, 0);
    setPeriodReferenceDate((prev) => {
      if (prev && prev.getTime && prev.getTime() === next.getTime()) {
        return prev;
      }
      return next;
    });
  }, []);

  // Day double-click handler
  const handleDayDoubleClick = useCallback((employeeId, dateKey) => {
    handleCalendarDaySelect(employeeId, dateKey);
    dayEditor.openEditor(employeeId, dateKey);
  }, [dayEditor, handleCalendarDaySelect]);

  const editingEmployeeData = useMemo(() => {
    if (!dayEditor.employeeId) return {};
    return ctx?.dataMap?.[dayEditor.employeeId] || {};
  }, [ctx?.dataMap, dayEditor.employeeId]);

  const editingEmployeeName = useMemo(() => {
    if (!dayEditor.employeeId) return '';
    const employee = allEmployees.find(emp => emp.id === dayEditor.employeeId);
    return employee ? `${employee.nome} ${employee.cognome}` : dayEditor.employeeId;
  }, [allEmployees, dayEditor.employeeId]);

  const selectedEmployee = useMemo(() => {
    if (!selectedEmployeeId) return null;
    return filteredEmployees.find(emp => emp.id === selectedEmployeeId) || null;
  }, [filteredEmployees, selectedEmployeeId]);

  const { mergedData: mergedDataFromHook } = useStableMergedDataMap({
    dataMap: ctx?.dataMap || {},
    staging,
    employeeId: selectedEmployeeId,
    mode: 'single'
  });

  const selectedEmployeeMergedData = useMemo(() => {
    if (!selectedEmployeeId) return {};
    if (mergedDataFromHook) return mergedDataFromHook;
    return ctx?.dataMap?.[selectedEmployeeId] || {};
  }, [ctx?.dataMap, mergedDataFromHook, selectedEmployeeId]);

  const selectedEmployeeBaseData = useMemo(() => {
    if (!selectedEmployeeId) return {};
    return ctx?.dataMap?.[selectedEmployeeId] || {};
  }, [ctx?.dataMap, selectedEmployeeId]);

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: 3 }}>
      <Box sx={{ width: '100%', px: { xs: 2, md: 4 } }}>
        {/* Page Header - Compact */}
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
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#ffffff' }}>
            Timesheet — Amministrazione
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5, opacity: 0.95, color: '#ffffff' }}>
            Visualizza e gestisci i timesheet di tutti i dipendenti
          </Typography>
        </Paper>

        {/* Staging Bar - Compact, top priority */}
        <TimesheetStagingBar sticky={false} />

        {/* Bento Grid Layout */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              md: 'repeat(12, 1fr)'
            },
            gap: 2,
            mt: 2
          }}
        >
          {/* Filters Panel - Full width, compact */}
          <Box
            sx={{
              gridColumn: { xs: '1 / -1', md: '1 / -1' }
            }}
          >
            <AdminFiltersBar
              value={filters}
              onChange={setFilters}
              month={month}
              year={year}
              onMonthPrev={handleMonthPrev}
              onMonthNext={handleMonthNext}
              onToday={handleToday}
              onDateSelect={handleDateSelect}
            />
          </Box>

          {/* Main Grid - Left side, takes 8 columns */}
          <Box
            sx={{
              gridColumn: { xs: '1 / -1', md: '1 / 9' },
              minHeight: { md: '600px' }
            }}
          >
            <AdminTimesheetGrid
              year={year}
              month={month}
              employees={filteredEmployees}
              dataMap={ctx?.dataMap || {}}
              stagedMeta={stagedMeta}
              stagingEntries={stagingEntries}
              selectedEmployeeId={selectedEmployeeId}
              onSelectEmployee={handleEmployeeSelect}
              onDayDoubleClick={handleDayDoubleClick}
              onDaySelect={handleCalendarDaySelect}
              selectedDay={selectedDay}
              highlightedDates={highlightedDates}
            />
          </Box>

          {/* Inspector Panel - Right side, takes 4 columns */}
          <Box
            sx={{
              gridColumn: { xs: '1 / -1', md: '9 / -1' },
              minHeight: { md: '600px' }
            }}
          >
            <AdminEmployeeInspector
              employee={selectedEmployee}
              month={month}
              year={year}
              mergedData={selectedEmployeeMergedData}
              baseData={selectedEmployeeBaseData}
              selectedDay={selectedDay}
              selectedPeriod={selectedPeriod}
              onPeriodChange={setSelectedPeriod}
              periodReferenceDate={periodReferenceDate}
              onPeriodReferenceChange={handlePeriodReferenceChange}
              insightTab={inspectorTab}
              onInsightTabChange={setInspectorTab}
            />
          </Box>
        </Box>

        {/* Day Entry Dialog */}
        <DayEntryDialog
          open={dayEditor.isOpen}
          onClose={dayEditor.closeEditor}
          employeeId={dayEditor.employeeId}
          date={dayEditor.date}
          employeeName={editingEmployeeName}
          data={editingEmployeeData}
        />
      </Box>
    </Box>
  );
}

/**
 * DashboardAmministrazioneTimesheet
 * Container component with provider and auth guard
 */
export default function DashboardAmministrazioneTimesheet() {
  const { roles } = useAuth();
  const navigate = useNavigate();

  // Auth guard - only AMMINISTRATORE, DIRETTORE_TECNICO, DIRETTORE_GENERALE
  const isAuthorized = useMemo(() => {
    return roles.some(role => 
      [ROLES.AMMINISTRATORE, ROLES.DIRETTORE_TECNICO, ROLES.DIRETTORE_GENERALE].includes(role)
    );
  }, [roles]);

  if (!isAuthorized) {
    return (
      <Box sx={{ width: '100%', py: 8, px: { xs: 2, md: 4 }, display: 'flex', justifyContent: 'center' }}>
        <Paper sx={{ p: 4, textAlign: 'center', width: '100%', maxWidth: 640 }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Accesso Non Autorizzato
            </Typography>
            <Typography variant="body2">
              Non hai i permessi necessari per accedere alla dashboard amministrazione.
              Solo AMMINISTRATORE, DIRETTORE_TECNICO e DIRETTORE_GENERALE possono visualizzare questa pagina.
            </Typography>
          </Alert>
          <Button
            variant="contained"
            startIcon={<ArrowBack />}
            onClick={() => navigate('/home')}
          >
            Torna alla Home
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <TimesheetProvider scope="all">
      <InnerDashboardAmministrazione />
    </TimesheetProvider>
  );
}
