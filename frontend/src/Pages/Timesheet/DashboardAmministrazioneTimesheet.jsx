// DashboardAmministrazioneTimesheet.jsx - Calendar pivot (Dipendenti x Giorni)
import React from "react";
import {
  Box,
  Stack,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Paper,
  Container,
} from "@mui/material";
// Logica estratta in hooks riusabili (Timesheet)
import {
  useTimesheetApi,
  TimesheetProvider,
  useTimesheetContext,
  useTimesheetAggregates,
  useTimesheetEntryEditor,
  useReferenceData,
  useCalendarMonthYear,
  useDayAndMonthDetails,
  useSegnalazione,
  useSelection,
  useTimesheetFilters,
} from '@/Hooks/Timesheet';
import EmployeeMonthGrid from "@components/Calendar/EmployeeMonthGrid";
import TileLegend from "@components/Calendar/TileLegend";
import FiltersBar from "@components/Timesheet/FiltersBar";
import DetailsPanel from "@components/Timesheet/DetailsPanel";
import SegnalazioneDialog from "@components/Timesheet/SegnalazioneDialog";
import EditEntryDialog from "@components/Timesheet/EditEntryDialog";
import ConfirmDialog from "@components/ConfirmDialog";

const MONTHS = ["Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno","Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"];

// Helper: sum of hours for the day excluding the currently edited entry
function computeDayUsed(allEntries = [], currentEntry = null) {
  if (!Array.isArray(allEntries) || allEntries.length === 0) return 0;
  return allEntries.reduce((acc, r) => {
    if (!r) return acc;
    if (currentEntry) {
      if (r === currentEntry) return acc; // same reference
      if (r.id && currentEntry.id && r.id === currentEntry.id) return acc;
      if (!r.id && !currentEntry.id && r.commessa === currentEntry.commessa && r.ore === currentEntry.ore && r.descrizione === currentEntry.descrizione) return acc;
    }
    return acc + (Number(r.ore) || 0);
  }, 0);
}

function InnerDashboard() {
  const { month, year, setMonthYear, employees, dataMap: tsMap, loading: dataLoading, error: dataError } = useTimesheetContext();
  const today = new Date();
  const setYear = React.useCallback((y) => setMonthYear(month, y), [month, setMonthYear]);
  const setMonth = React.useCallback((m) => setMonthYear(m, year), [year, setMonthYear]);
  const filters = useTimesheetFilters({ tsMap, year, month });
  const { selEmp, selDate, setSelEmp, setSelDate } = useSelection();
  const details = useDayAndMonthDetails({ tsMap, year, month });

  // rows: filtered set of employees
  const rows = React.useMemo(() => filters.applyFilters(employees), [filters, employees]);

  // filteredDataMap: keeps only the rows currently visible (stable by id)
  const filteredDataMap = React.useMemo(() => {
    const entries = rows.map((r) => [r.id, tsMap[r.id]]);
    return Object.fromEntries(entries);
  }, [rows, tsMap]);

  const aggregates = useTimesheetAggregates({ dataMap: filteredDataMap, year, month, options: { includeGlobalCommessa: true } });
  const seg = useSegnalazione({ selEmp, selDate });

  // distinctCommesse derived from filtered data for the selected employee
  const distinctCommesse = React.useMemo(() => {
    if (!selEmp) return [];
    const empTs = tsMap[selEmp.id] || {};
    const set = new Set();
    Object.entries(empTs).forEach(([k, list]) => {
      if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(k)) return;
      (list || []).forEach((rec) => {
        if (rec && rec.commessa && !['FERIE','MALATTIA','PERMESSO'].includes(rec.commessa)) set.add(rec.commessa);
      });
    });
    return Array.from(set).sort();
  }, [selEmp, tsMap]);

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
      // save may be sync or return a promise; await to keep flow consistent
      await (editor.save ? editor.save() : Promise.resolve());
    } catch (err) {
      // keep UX consistent: close the dialog but rethrow/log if necessary in future
      // console.error('Failed to save editor changes', err);
    } finally {
      closeDialog();
    }
  }, [dialog, editor, closeDialog]);

  // remove an edited entry
  const removeCurrent = React.useCallback(async () => {
    if (dialog.mode === 'edit' && dialog.index >= 0) {
      editor.removeRow(dialog.index);
      await (editor.save ? editor.save() : Promise.resolve());
    }
    closeDialog();
  }, [dialog, editor, closeDialog]);

  // Delete flow: confirm dialog
  const [confirmDel, setConfirmDel] = React.useState({ open: false, entry: null });
  const confirmDelete = React.useCallback((entry) => setConfirmDel({ open: true, entry }), []);
  const performDelete = React.useCallback(async () => {
    if (!confirmDel.entry) { setConfirmDel({ open:false, entry:null }); return; }
    const idx = workEntries.indexOf(confirmDel.entry);
    if (idx >= 0) {
      editor.removeRow(idx);
      await (editor.save ? editor.save() : Promise.resolve());
    }
    setConfirmDel({ open:false, entry:null });
    if (dialog.open) closeDialog();
  }, [confirmDel, workEntries, editor, dialog.open, closeDialog]);

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
      <Paper sx={{ p: 1, boxShadow: 8, borderRadius: 2, bgcolor: "customBackground.main" }}>
        <EmployeeMonthGrid
          year={year}
          month={month}
          rows={rows}
          tsMap={tsMap}
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
      <DetailsPanel
        selEmp={selEmp}
        selDate={selDate}
        detailsReady={details.detailsReady}
        dayRecords={details.dayRecords}
        daySegnalazione={details.daySegnalazione}
        monthSummary={details.monthSummary}
  globalMonthAgg={aggregates.globalByCommessa}
  aggLoading={false}
        onRefresh={() => details.refreshCurrent(selEmp, selDate)}
        onOpenSegnalazione={seg.openSeg}
        // handle edit: if parent calls with {__adminAdd:true} then open add dialog
        onEditEntry={(arg) => {
          if (arg && arg.__adminAdd) {
            entryEditing.openAdd();
          } else {
            entryEditing.openEdit(arg);
          }
        }}
  onDeleteEntry={entryEditing.confirmDelete}
        commesse={distinctCommesse}
        externalEditing={true}
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
          dayUsed={computeDayUsed(details.dayRecords || [], entryEditing.editDialog.item)}
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
