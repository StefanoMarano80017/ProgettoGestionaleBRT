// DashboardAmministrazioneTimesheet.jsx - Calendar pivot (Dipendenti x Giorni)
import React from "react";
import { Box, Stack, Select, MenuItem, FormControl, InputLabel, Typography, Alert, Paper, Container } from "@mui/material";
// Logica estratta in hooks riusabili (Timesheet)
import {
  TimesheetProvider,
  useTimesheetContext,
  useTimesheetAggregates,
  useDayAndMonthDetails,
  useSegnalazione,
  useSelection,
  useTimesheetFilters,
  // usePmGroups, // disabilitato per test solo dipendenti
  // useOpPersonal,
  // useOperaiTimesheet,
  useTimesheetStaging,
} from '@/Hooks/Timesheet';
import EmployeeMonthGrid from "@components/Calendar/EmployeeMonthGrid";
import useStagedMetaMap from '@hooks/Timesheet/staging/useStagedMetaMap';
import { checkMonthCompletenessForId } from '@/Hooks/Timesheet/utils/checkMonthCompleteness';
import useMultipleMonthCompleteness from '@/Hooks/Timesheet/useMultipleMonthCompleteness';
import TileLegend from "@components/Calendar/TileLegend";
import TimesheetStagingBar from '@components/Timesheet/TimesheetStagingBar';
import FiltersBar from "@components/Timesheet/FiltersBar";
// Replaced old DetailsPanel usage with new admin panel
import AdminDetailsPanel from "@components/Timesheet/AdminDetailsPanel";
import DayEntryDialog from '@components/Calendar/DayEntryDialog';
import { useReferenceData } from '@/Hooks/Timesheet';
import SegnalazioneDialog from "@components/Timesheet/SegnalazioneDialog";
import useDayEditor from '@hooks/Timesheet/useDayEditor';
import { semanticHash } from '@hooks/Timesheet/utils/semanticTimesheet';
// legend icons moved into StagedChangesPanel

const MONTHS = ["Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno","Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"];

// use shared computeDayUsed (imported above)

function InnerDashboard() {
  const { month, year, setMonthYear, employees, dataMap: tsMap, error: dataError } = useTimesheetContext();
  const staging = useTimesheetStaging();
  const today = new Date();
  const setYear = React.useCallback((y) => setMonthYear(month, y), [month, setMonthYear]);
  const setMonth = React.useCallback((m) => setMonthYear(m, year), [year, setMonthYear]);
  const { selEmp, selDate, setSelEmp, setSelDate } = useSelection();
  // Shared modal day editor hook
  const dayEditor = useDayEditor();

  // rows: filtered set of employees + individual 'operai' (single-worker) rows
  // load operai/groups/personal and derive per-operaio timesheet map
  // TEST MODE: solo dipendenti (operai esclusi temporaneamente)
  const mergedDataMap = tsMap; // nessuna fusione operai
  const filters = useTimesheetFilters({ tsMap: mergedDataMap, year, month });
  const rows = React.useMemo(() => {
    const base = employees || [];
    const filtered = filters.applyFilters(base);
    const prev = new Date(); prev.setMonth(prev.getMonth() - 1);
    return filtered.map(r => ({ ...r, incompletePrevMonth: checkMonthCompletenessForId({ tsMap: mergedDataMap, id: r.id, year: prev.getFullYear(), month: prev.getMonth() }).length > 0 }));
  }, [filters, employees, mergedDataMap]);

  // Prepare data for highlighting: compute missing dates for currently visible rows
  const prev = new Date(); prev.setMonth(prev.getMonth() - 1);
  const visibleIds = React.useMemo(() => rows.map(r => r.id), [rows]);
  const { map: missingMap, idsWithMissing } = useMultipleMonthCompleteness({ tsMap: mergedDataMap, ids: visibleIds, year: prev.getFullYear(), month: prev.getMonth() });
  // Prepare convenient maps/sets for passing to components
  const rowsWithMissingSet = React.useMemo(() => idsWithMissing, [idsWithMissing]);
  const highlightedDaysMap = React.useMemo(() => {
    const out = {};
    Object.entries(missingMap || {}).forEach(([id, v]) => { out[id] = v.missingSet; });
    return out;
  }, [missingMap]);

  // stagedDaysMap: for UI feedback, map employeeId -> Set(dateStr) of staged edits
  // Build staged meta (employeeId -> { dateKey: op }) for glow only – base values remain untouched until commit
  const stagedMetaAll = useStagedMetaMap(staging);
  const stagedDaysMap = stagedMetaAll; // same shape consumed by grid

  // details should use merged data map so operaio single-employee entries are visible
  const details = useDayAndMonthDetails({ tsMap: mergedDataMap, year, month });

  // Gestione selezione dipendenti per statistiche (dichiarata dopo che rows esiste)
  // statsSelected: null => no explicit selection (interpret as all),
  // Set() (empty) => explicitly deselected (show none), non-empty Set => selected employees
  const [statsSelected, setStatsSelected] = React.useState(() => null);
  React.useEffect(() => {
    setStatsSelected(prev => {
      if (prev === null) return null; // no explicit selection, keep as-is (means all)
      // prev is a Set -> intersect with new rows to keep order
      const next = new Set();
      rows.forEach(r => { if (prev.has(r.id)) next.add(r.id); });
      // if nothing changed (same members) return prev to avoid state churn
      if (next.size === prev.size) {
        let same = true;
        for (const v of next) { if (!prev.has(v)) { same = false; break; } }
        if (same) return prev;
      }
      return next;
    });
  }, [rows]);
  const toggleStatsEmployee = React.useCallback((empRow) => {
    setStatsSelected(prev => {
      if (prev === null) {
        // move from implicit-all to explicit selection of this one
        return new Set([empRow.id]);
      }
      const next = new Set(prev);
      if (next.has(empRow.id)) next.delete(empRow.id); else next.add(empRow.id);
      return next;
    });
  }, []);
  const selectAllStats = React.useCallback(() => {
    setStatsSelected(new Set(rows.map(r => r.id)));
  }, [rows]);
  const deselectAllStats = React.useCallback(() => {
    setStatsSelected(new Set());
  }, []);



  // filteredDataMap: keeps only the rows currently visible (stable by id) e filtrati per stats
  const filteredDataMap = React.useMemo(() => {
    let active;
    if (statsSelected === null) {
      // implicit all
      active = rows;
    } else if (statsSelected.size === 0) {
      // explicitly none
      active = [];
    } else {
      active = rows.filter(r => statsSelected.has(r.id));
    }
    const entries = active.map(r => [r.id, mergedDataMap[r.id]]);
    return Object.fromEntries(entries);
  }, [rows, mergedDataMap, statsSelected]);

  const aggregates = useTimesheetAggregates({ dataMap: filteredDataMap, year, month, options: { includeGlobalCommessa: true } });
  const seg = useSegnalazione({ selEmp, selDate });

  // distinctCommesse derived from filtered data for the selected employee
  // Reference data: commesse list for selected employee (simplified reuse of existing hook if available)
  const { commesse: refCommesse } = useReferenceData ? useReferenceData({ commesse: true, personale: false, pmGroups: false, employeeId: selEmp?.id }) : { commesse: [] };
  const distinctCommesse = React.useMemo(() => {
    if (refCommesse && refCommesse.length) return refCommesse.map(c => c.id || c).sort();
    if (!selEmp) return [];
    const empTs = mergedDataMap[selEmp.id] || {};
    const set = new Set();
    Object.entries(empTs).forEach(([k, list]) => {
      if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(k)) return;
      (list || []).forEach((rec) => {
        if (rec && rec.commessa && !['FERIE','MALATTIA','PERMESSO'].includes(rec.commessa)) set.add(rec.commessa);
      });
    });
    return Array.from(set).sort();
  }, [selEmp, mergedDataMap, refCommesse]);

  // Synchronization effect to avoid reverse staging after commit (retain guard)
  const lastSyncRef = React.useRef(null);
  React.useEffect(() => {
    if (!selEmp || !selDate) return;
    const current = tsMap?.[selEmp.id]?.[selDate] || [];
    const local = details.dayRecords || [];
    const hashLocal = semanticHash(local);
    const hashCurrent = semanticHash(current);
      if (hashLocal === hashCurrent) return; // perfectly in sync
      // If there is NO staged entry for this day and they differ, we assume the base (current) was just committed
      // and avoid creating a reverse staging entry that would undo the commit. Instead, adopt the new base.
      const stagedEntry = staging.getStagedEntry ? staging.getStagedEntry(selEmp.id, selDate) : null;
      if (!stagedEntry) {
        // Heuristic: adopt base instead of staging a draft that reverts it.
        details.setDayRecords(current);
        lastSyncRef.current = hashCurrent; // mark sync baseline
        return;
      }
      if (lastSyncRef.current === hashLocal) return; // already staged this version
      lastSyncRef.current = hashLocal;
      staging.stageDraft(selEmp.id, selDate, local, { origin: 'admin-sync' });
  }, [selEmp, selDate, details.dayRecords, tsMap, staging]);

  const handleDayClick = React.useCallback(async (empRow, dateKey) => {
    setSelEmp(empRow);
    setSelDate(dateKey);
    await details.loadFor(empRow, dateKey);
  }, [setSelEmp, setSelDate, details]);

  const handleDayDoubleClick = React.useCallback(async (empRow, dateKey) => {
    await handleDayClick(empRow, dateKey);
    dayEditor.openEditor(empRow.id, dateKey);
  }, [handleDayClick, dayEditor]);

  const handleEmployeeClick = React.useCallback(async (empRow) => {
    const prevDate = selDate;
    setSelEmp(empRow);
    if (prevDate) {
      await details.loadFor(empRow, prevDate);
    } else {
      details.setDayRecords([]);
      details.setDaySegnalazione(null);
      await details.loadMonthSummary(empRow);
    }
  }, [selDate, setSelEmp, details]);

  return (
    <Container maxWidth="xl" sx={{ py: 2 }}>
      {/* Staged changes panel spostato in cima */}
      {dataError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {dataError.toString?.() || dataError}
        </Alert>
      )}
      <TimesheetStagingBar />

      {/* Filters + month/year + legend */}
      <Paper sx={{ mb: 2, p: 2, boxShadow: 8, borderRadius: 2, bgcolor: "customBackground.main" }}>
        <FiltersBar
          filterCompany={filters.filterCompany}
          setFilterCompany={filters.setFilterCompany}
          companies={/* derive from hooks */ employees ? Array.from(new Set((employees||[]).map(e=>e.azienda).filter(Boolean))).sort() : []}
          searchEmployee={filters.searchEmployee}
          setSearchEmployee={filters.setSearchEmployee}
          searchCommessa={filters.searchCommessa}
          setSearchCommessa={filters.setSearchCommessa}
        />

        <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="center" justifyContent="space-between" sx={{ mt: 2, mx: 1 }}>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ flexWrap: "wrap" }}>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Mese</InputLabel>
              <Select
                label="Mese"
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                sx={{
                  '& .MuiSelect-select': { bgcolor: (theme) => theme.palette.mode === 'dark' ? theme.palette.background.default : theme.palette.customGray.main, borderRadius: 1, pl: 1 },
                }}
              >
                {MONTHS.map((m, idx) => (
                  <MenuItem key={m} value={idx}>{m}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Anno</InputLabel>
              <Select
                label="Anno"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                sx={{
                  '& .MuiSelect-select': { bgcolor: (theme) => theme.palette.mode === 'dark' ? theme.palette.background.default : theme.palette.customGray.main, borderRadius: 1, pl: 1 },
                }}
              >
                {Array.from({ length: 4 }, (_, i) => today.getFullYear() - 1 + i).map((y) => (
                  <MenuItem key={y} value={y}>{y}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TileLegend />
          </Box>
        </Stack>
      </Paper>

      {/* Calendar DataGrid */}
      {rows.filter(r => r.incompletePrevMonth).length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>Ci sono {rows.filter(r => r.incompletePrevMonth).length} utenti con il mese precedente incompleto.</Alert>
      )}
      <Paper sx={{ p: 1, boxShadow: 8, borderRadius: 2, bgcolor: "customBackground.main" }}>
        <EmployeeMonthGrid
          year={year}
          month={month}
          rows={rows}
          tsMap={mergedDataMap}
          virtualize={rows.length > 25}
        // rowHighlights: highlight names for users missing previous-month days
        rowHighlights={rowsWithMissingSet}
        highlightedDaysMap={highlightedDaysMap}
        stagedDaysMap={stagedDaysMap}
          statsSelection={statsSelected}
          onToggleStats={toggleStatsEmployee}
          onDayClick={handleDayClick}
          onDayDoubleClick={handleDayDoubleClick}
          onEmployeeClick={handleEmployeeClick}
          selectedEmpId={selEmp?.id}
          selectedDate={selDate}
          height={520}
          dayWidth={52}
          dayHeight={28}
          dipWidth={240}
          azWidth={130}
        />
      </Paper>
      <AdminDetailsPanel
        selEmp={selEmp}
        selDate={selDate}
        year={year}
        month={month}
        employees={rows}
        tsMap={mergedDataMap}
        details={details}
        distinctCommesse={distinctCommesse}
        globalMonthAgg={aggregates.globalByCommessa}
        onSelectAllStats={selectAllStats}
        onDeselectAllStats={deselectAllStats}
        statsSelected={statsSelected}
      />
      <SegnalazioneDialog
        open={seg.sigOpen}
        onClose={seg.closeSeg}
        selEmp={selEmp}
        selDate={selDate}
        onSend={seg.send}
        sendingOk={seg.sendingOk}
      />
      <DayEntryDialog
        open={dayEditor.isOpen}
        onClose={dayEditor.closeEditor}
        date={dayEditor.date}
        employeeId={dayEditor.employeeId}
        employeeName={selEmp?.name || selEmp?.dipendente || selEmp?.id}
        data={dayEditor.employeeId && mergedDataMap?.[dayEditor.employeeId] ? { [dayEditor.employeeId]: mergedDataMap[dayEditor.employeeId] } : {}}
        commesse={distinctCommesse}
      />
    </Container>
  );
}

export default function DashboardAmministrazioneTimesheet() {
  return (
    <TimesheetProvider scope="all">
      <InnerDashboard />
    </TimesheetProvider>
  );
}
