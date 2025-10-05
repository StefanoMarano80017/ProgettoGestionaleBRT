// DashboardAmministrazioneTimesheet.jsx - Calendar pivot (Dipendenti x Giorni)
import React from "react";
import {
  Box,
  Stack,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Alert,
  Paper,
  Chip,
  Button,
  Container,
} from "@mui/material";
// Logica estratta in hooks riusabili (Timesheet)
import {
  TimesheetProvider,
  useTimesheetContext,
  useTimesheetAggregates,
  useTimesheetEntryEditor,
  useDayAndMonthDetails,
  useSegnalazione,
  useSelection,
  useTimesheetFilters,
  usePmGroups,
  useOpPersonal,
  useOperaiTimesheet,
} from '@/Hooks/Timesheet';
import EmployeeMonthGrid from "@components/Calendar/EmployeeMonthGrid";
import { checkMonthCompletenessForId } from '@/Hooks/Timesheet/utils/checkMonthCompleteness';
import useMultipleMonthCompleteness from '@/Hooks/Timesheet/useMultipleMonthCompleteness';
import TileLegend from "@components/Calendar/TileLegend";
import StagedChangesPanel from '@components/Timesheet/StagedChangesPanel';
import FiltersBar from "@components/Timesheet/FiltersBar";
// Replaced old DetailsPanel usage with new admin panel
import AdminDetailsPanel from "@components/Timesheet/AdminDetailsPanel";
import SegnalazioneDialog from "@components/Timesheet/SegnalazioneDialog";
import EditEntryDialog from "@components/Timesheet/EditEntryDialog";
import ConfirmDialog from "@components/ConfirmDialog";
import computeDayUsed from '@hooks/Timesheet/utils/computeDayUsed';
// legend icons moved into StagedChangesPanel

const MONTHS = ["Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno","Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"];

// use shared computeDayUsed (imported above)

function InnerDashboard() {
  const { month, year, setMonthYear, employees, dataMap: tsMap, stagedMap, stageUpdate, error: dataError } = useTimesheetContext();
  const today = new Date();
  const setYear = React.useCallback((y) => setMonthYear(month, y), [month, setMonthYear]);
  const setMonth = React.useCallback((m) => setMonthYear(m, year), [year, setMonthYear]);
  const { selEmp, selDate, setSelEmp, setSelDate } = useSelection();

  // rows: filtered set of employees + individual 'operai' (single-worker) rows
  // load operai/groups/personal and derive per-operaio timesheet map
  const { groups, allOperai } = usePmGroups();
  const { opPersonal } = useOpPersonal();
  const { operaiRows: operaiRowsRaw, operaiTsMap } = useOperaiTimesheet({ groups, allOperai, azienda: undefined, opPersonal });
  // Merge operai timesheet map into the main tsMap (prefer preserving existing emp data)
  const mergedDataMap = React.useMemo(() => {
    const merged = { ...tsMap };
    try {
      Object.entries(operaiTsMap || {}).forEach(([opId, days]) => {
        if (!merged[opId]) merged[opId] = {};
        Object.entries(days || {}).forEach(([dateKey, recs]) => {
          merged[opId][dateKey] = (merged[opId][dateKey] || []).concat((recs || []).map(r => ({ ...r })));
        });
      });
    } catch {
      // ignore merge errors
    }
    return merged;
  }, [tsMap, operaiTsMap]);

  // Filters should run against merged data (so operai commesse are included in search)
  const filters = useTimesheetFilters({ tsMap: mergedDataMap, year, month });

  // Normalize operai rows (they come as { id, dipendente, azienda }) to match employee shape { id, name, azienda }
  const operaiRows = React.useMemo(() => (operaiRowsRaw || []).map(r => ({ id: r.id, name: r.dipendente || r.name || r.id, azienda: r.azienda })), [operaiRowsRaw]);

  // Combine employees and operai rows and run the same filters so operai show up in the grid.
  const rows = React.useMemo(() => {
    const combined = (employees || []).concat(operaiRows || []);
    const filtered = filters.applyFilters(combined);
    // annotate rows with missing previous month flag
    const prev = new Date(); prev.setMonth(prev.getMonth() - 1);
    return filtered.map(r => ({ ...r, incompletePrevMonth: checkMonthCompletenessForId({ tsMap: mergedDataMap, id: r.id, year: prev.getFullYear(), month: prev.getMonth() }).length > 0 }));
  }, [filters, employees, operaiRows, mergedDataMap]);

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
  const stagedDaysMap = React.useMemo(() => {
    const out = {};
    Object.entries(stagedMap || {}).forEach(([empId, days]) => {
      const map = {};
      Object.entries(days || {}).forEach(([dk, recs]) => {
        if (recs === null) { map[dk] = 'delete'; return; }
        const stagedArr = Array.isArray(recs) ? recs : [];
        const origArr = (mergedDataMap && mergedDataMap[empId] && mergedDataMap[empId][dk]) || [];
        if ((!origArr || origArr.length === 0) && stagedArr.length > 0) { map[dk] = 'insert'; return; }
        if (stagedArr.length === 0 && origArr && origArr.length > 0) { map[dk] = 'delete'; return; }
        let isUpdate = false;
        if (stagedArr.length !== origArr.length) isUpdate = true;
        else {
          for (let i = 0; i < stagedArr.length; i++) {
            const a = stagedArr[i] || {};
            const b = origArr[i] || {};
            if ((String(a.commessa || '') !== String(b.commessa || '')) || (Number(a.ore || 0) !== Number(b.ore || 0))) { isUpdate = true; break; }
          }
        }
        map[dk] = isUpdate ? 'update' : 'none';
      });
      out[empId] = map;
    });
    return out;
  }, [stagedMap, mergedDataMap]);

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
  const distinctCommesse = React.useMemo(() => {
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
  }, [selEmp, mergedDataMap]);

  // split current day records into work vs personal
  const workEntries = React.useMemo(() => (details.dayRecords || []).filter((r) => !['FERIE','MALATTIA','PERMESSO'].includes(String(r.commessa))), [details.dayRecords]);
  const personalEntries = React.useMemo(() => (details.dayRecords || []).filter((r) => ['FERIE','MALATTIA','PERMESSO'].includes(String(r.commessa))), [details.dayRecords]);

  // Editor - useTimesheetEntryEditor provides add/update/remove and a save method
  const editor = useTimesheetEntryEditor({
    entries: workEntries,
    personalEntries,
    commesse: distinctCommesse,
    onSave: ({ workEntries: nextWork, personalEntries: nextPers }) => {
      const merged = [...nextWork, ...nextPers];
      details.setDayRecords(merged);
    },
  });

  // Dialog state
  const [dialog, setDialog] = React.useState({ open: false, mode: 'add', index: null, current: null });
  const openAdd = React.useCallback(() => setDialog({ open: true, mode: 'add', index: null, current: { commessa: distinctCommesse[0]||'', ore:1, descrizione:'' } }), [distinctCommesse]);
  const openEdit = React.useCallback((entry) => setDialog({ open: true, mode: 'edit', index: (workEntries||[]).indexOf(entry), current: { ...entry } }), [workEntries]);
  const closeDialog = React.useCallback(() => setDialog((d) => ({ ...d, open: false })), []);

  // Commit (add or update) and persist via editor.save()
  const commit = React.useCallback(async (entry) => {
    if (!entry) { closeDialog(); return; }
    try {
      if (dialog.mode === 'add') {
        editor.addRow({ commessa: entry.commessa, ore: entry.ore, descrizione: entry.descrizione });
      } else if (dialog.index >= 0) {
        editor.updateRow(dialog.index, { commessa: entry.commessa, ore: entry.ore, descrizione: entry.descrizione });
      }
      await (editor.save ? editor.save() : Promise.resolve());
      // Persist updated day records into global timesheet map so calendar cells rerender
      if (selEmp && selDate) {
        // Build merged records from editor state (authoritative post-save)
        const merged = [
          ...editor.rows.map(r => ({ commessa: r.commessa, ore: r.ore, descrizione: r.descrizione })),
          ...editor.personal.map(r => ({ commessa: r.commessa, ore: r.ore }))
        ];
        details.setDayRecords(merged); // keep local detail panel in sync
      // stage instead of immediate persist
      stageUpdate(selEmp.id, selDate, merged);
      }
    } catch {
      // swallow for now; could surface snackbar
    } finally {
      closeDialog();
    }
  }, [dialog, editor, closeDialog, selEmp, selDate, details, stageUpdate]);

  // remove an edited entry
  const removeCurrent = React.useCallback(async () => {
    if (dialog.mode === 'edit' && dialog.index >= 0) {
      editor.removeRow(dialog.index);
      await (editor.save ? editor.save() : Promise.resolve());
      if (selEmp && selDate) {
        const merged = [
          ...editor.rows.map(r => ({ commessa: r.commessa, ore: r.ore, descrizione: r.descrizione })),
          ...editor.personal.map(r => ({ commessa: r.commessa, ore: r.ore }))
        ];
        details.setDayRecords(merged);
  stageUpdate(selEmp.id, selDate, merged);
      }
    }
    closeDialog();
  }, [dialog, editor, closeDialog, selEmp, selDate, details, stageUpdate]);

  // Delete flow: confirm dialog
  const [confirmDel, setConfirmDel] = React.useState({ open: false, entry: null });
  const confirmDelete = React.useCallback((entry) => setConfirmDel({ open: true, entry }), []);
  const performDelete = React.useCallback(async () => {
    if (!confirmDel.entry) { setConfirmDel({ open:false, entry:null }); return; }
    const idx = workEntries.indexOf(confirmDel.entry);
    if (idx >= 0) {
      editor.removeRow(idx);
      await (editor.save ? editor.save() : Promise.resolve());
      if (selEmp && selDate) {
        const merged = [
          ...editor.rows.map(r => ({ commessa: r.commessa, ore: r.ore, descrizione: r.descrizione })),
          ...editor.personal.map(r => ({ commessa: r.commessa, ore: r.ore }))
        ];
        details.setDayRecords(merged);
  stageUpdate(selEmp.id, selDate, merged);
      }
    }
    setConfirmDel({ open:false, entry:null });
    if (dialog.open) closeDialog();
  }, [confirmDel, workEntries, editor, dialog.open, closeDialog, selEmp, selDate, details, stageUpdate]);

  // Synchronization effect (debounced & signature‑guarded) per evitare loop infiniti
  const lastSyncRef = React.useRef(null);
  React.useEffect(() => {
    if (!selEmp || !selDate) return;
    const current = tsMap?.[selEmp.id]?.[selDate] || [];
    const local = details.dayRecords || [];
    // Se puntano allo stesso array o stessa lunghezza+contenuto => niente update
    if (current === local) return;
    if (current.length === local.length) {
      let equal = true;
      for (let i=0;i<current.length;i++) {
        const a=current[i], b=local[i];
        if (a.commessa!==b.commessa || Number(a.ore)!==Number(b.ore)) { equal=false; break; }
      }
      if (equal) return;
    }
    const signature = local.map(r => `${r.commessa}:${r.ore}`).join('|');
    if (lastSyncRef.current === signature) return; // già sincronizzato
    lastSyncRef.current = signature;
    stageUpdate(selEmp.id, selDate, local);
  }, [selEmp, selDate, details.dayRecords, tsMap, stageUpdate]);

  const entryEditing = React.useMemo(() => ({
    openAdd,
    openEdit,
    confirmDelete,
    editDialog: { open: dialog.open, mode: dialog.mode, item: dialog.current },
    deleteDialog: { open: confirmDel.open },
    closeEdit: closeDialog,
    saveEdited: commit,
    doDelete: removeCurrent,
    setConfirmOpen: (v) => setConfirmDel((s) => ({ ...s, open: v })),
  }), [openAdd, openEdit, confirmDelete, dialog, confirmDel, closeDialog, commit, removeCurrent]);

  const handleDayClick = React.useCallback(async (empRow, dateKey) => {
    setSelEmp(empRow);
    setSelDate(dateKey);
    await details.loadFor(empRow, dateKey);
  }, [setSelEmp, setSelDate, details]);

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
      {dataError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {dataError.toString?.() || dataError}
        </Alert>
      )}
      {rows.filter(r => r.incompletePrevMonth).length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>Ci sono {rows.filter(r => r.incompletePrevMonth).length} utenti con il mese precedente incompleto.</Alert>
      )}
      {/* Relocated staged changes panel */}
      <Paper sx={{ mb: 2, p: 2, boxShadow: 8, borderRadius: 2, bgcolor: 'customBackground.main', display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <StagedChangesPanel />
        </Box>
      </Paper>
      <Paper sx={{ p: 1, boxShadow: 8, borderRadius: 2, bgcolor: "customBackground.main" }}>
        <EmployeeMonthGrid
          year={year}
          month={month}
          rows={rows}
          tsMap={mergedDataMap}
        // rowHighlights: highlight names for users missing previous-month days
        rowHighlights={rowsWithMissingSet}
        highlightedDaysMap={highlightedDaysMap}
        stagedDaysMap={stagedDaysMap}
          statsSelection={statsSelected}
          onToggleStats={toggleStatsEmployee}
          onDayClick={handleDayClick}
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
        entryEditing={entryEditing}
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
      {entryEditing.editDialog.open && (
        <EditEntryDialog
          open={entryEditing.editDialog.open}
          mode={entryEditing.editDialog.mode || 'edit'}
          item={entryEditing.editDialog.item}
          commesse={distinctCommesse}
          maxOre={8}
          dailyLimit={8}
          // prefer the editor helper when available — it sums work+personal and excludes current entry
          dayUsed={typeof editor?.getDayUsed === 'function' ? editor.getDayUsed(entryEditing.editDialog.item, entryEditing.editDialog.mode, entryEditing.editDialog.index) : computeDayUsed(details.dayRecords || [], entryEditing.editDialog.item)}
          onClose={entryEditing.closeEdit}
          onSave={entryEditing.saveEdited}
        />
      )}
      <ConfirmDialog
        open={confirmDel.open}
        title="Conferma eliminazione"
        message="Eliminare definitivamente la voce selezionata?"
        onClose={() => setConfirmDel({ open:false, entry:null })}
        onConfirm={performDelete}
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
