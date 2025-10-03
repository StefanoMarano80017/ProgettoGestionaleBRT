// DashboardAmministrazioneTimesheet.jsx - Calendar pivot (Dipendenti x Giorni)
import React from "react";
import {
  Box,
  Stack,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Paper,
  Container,
} from "@mui/material";
// Logica estratta in hooks riusabili (Timesheet)
import { useMonthNavigation } from "../../Hooks/Timesheet/useMonthNavigation";
import { useEmployeeTimesheets } from "../../Hooks/Timesheet/useEmployeeTimesheets";
import { useTimesheetFilters } from "../../Hooks/Timesheet/useTimesheetFilters";
import { useSelection } from "../../Hooks/Timesheet/useSelection";
import { useDayAndMonthDetails } from "../../Hooks/Timesheet/useDayAndMonthDetails";
import { useGlobalMonthAggregation } from "../../Hooks/Timesheet/useGlobalMonthAggregation";
import { useEntryEditing } from "../../Hooks/Timesheet/useEntryEditing";
import { useSegnalazione } from "../../Hooks/Timesheet/useSegnalazione";
import { useTimesheetApi } from "../../Hooks/Timesheet/useTimesheetApi";
import EmployeeMonthGrid from "../../Components/Calendar/EmployeeMonthGrid";
import TileLegend from "../../Components/Calendar/TileLegend";
import FiltersBar from "../../components/Timesheet/FiltersBar";
import DetailsPanel from "../../components/Timesheet/DetailsPanel";
import SegnalazioneDialog from "../../components/Timesheet/SegnalazioneDialog";
import EditEntryDialog from "../../components/Timesheet/EditEntryDialog";
import ConfirmDialog from "../../components/ConfirmDialog";

const MONTHS = ["Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno","Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"];

export default function DashboardAmministrazioneTimesheet() {
  const { api } = useTimesheetApi();
  const today = new Date();
  const { year, month, setYear, setMonth } = useMonthNavigation();
  const { employees, tsMap, setTsMap, error, loading } = useEmployeeTimesheets();
  const filters = useTimesheetFilters({ tsMap, year, month });
  const { selEmp, selDate, setSelEmp, setSelDate } = useSelection();
  const details = useDayAndMonthDetails({ tsMap, year, month });
  const rows = React.useMemo(() => filters.applyFilters(employees), [filters, employees]);
  const agg = useGlobalMonthAggregation({ year, month, rows, searchCommessa: filters.searchCommessa });
  const entryEditing = useEntryEditing({ tsMap, setTsMap, selEmp, selDate, onAfterChange: () => details.refreshCurrent(selEmp, selDate) });
  const seg = useSegnalazione({ selEmp, selDate });
  // Deriva elenco commesse distinte presenti nel mese filtrato (escludendo voci personali)
  const distinctCommesse = React.useMemo(() => {
    if (!selEmp) return [];
    const empTs = tsMap[selEmp.id] || {};
    const set = new Set();
    Object.entries(empTs).forEach(([k, list]) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(k)) return; // skip segnalazioni keys
      (list || []).forEach(rec => {
        if (rec && rec.commessa && !['FERIE','MALATTIA','PERMESSO'].includes(rec.commessa)) set.add(rec.commessa);
      });
    });
    return Array.from(set).sort();
  }, [selEmp, tsMap]);

  const handleDayClick = React.useCallback(async (empRow, dateKey) => {
    setSelEmp(empRow);
    setSelDate(dateKey);
    await details.loadFor(empRow, dateKey);
  }, [setSelEmp, setSelDate, details]);

  const handleEmployeeClick = React.useCallback(async (empRow) => {
    // Se cambio dipendente, mantengo la stessa data se già selezionata (per confronto rapido)
    const prevDate = selDate;
    setSelEmp(empRow);
    if (prevDate) {
      // tenta di caricare direttamente il giorno stesso se esiste nei dati del nuovo dipendente
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
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
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
        globalMonthAgg={agg.globalMonthAgg}
        aggLoading={agg.aggLoading}
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
      />
      <SegnalazioneDialog
        open={seg.sigOpen}
        onClose={seg.closeSeg}
        selEmp={selEmp}
        selDate={selDate}
        onSend={seg.send}
        sendingOk={seg.sendingOk}
      />
      <EditEntryDialog
        open={entryEditing.editDialog.open}
        mode={entryEditing.editDialog.mode || 'edit'}
        item={entryEditing.editDialog.item}
        commesse={distinctCommesse}
        maxOre={8}
        onClose={entryEditing.closeEdit}
        onSave={entryEditing.saveEdited}
      />
      <ConfirmDialog
        open={entryEditing.deleteDialog.open}
        title="Elimina voce"
        message="Eliminare questa voce?"
        onClose={() => entryEditing.setConfirmOpen(false)}
        onConfirm={entryEditing.doDelete}
      />
    </Container>
  );
}
