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
  Chip,
  Button,
  TextField,
  Alert,
  Paper,
  Divider,
  InputAdornment,
  Container,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import SendIcon from "@mui/icons-material/Send";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import SearchIcon from "@mui/icons-material/Search";
import { getEmployees, getAllEmployeeTimesheets, sendSegnalazione } from "../../mocks/ProjectMock";
import { getEmployeeMonthSummary, getGlobalMonthByCommessa } from "../../mocks/TimesheetAggregatesMock";
import EmployeeMonthGrid from "../../Components/Calendar/EmployeeMonthGrid";
import TileLegend from "../../Components/Calendar/TileLegend";
import FiltersBar from "../../components/Timesheet/FiltersBar";
import DetailsPanel from "../../components/Timesheet/DetailsPanel";
import SegnalazioneDialog from "../../components/Timesheet/SegnalazioneDialog";
import EditEntryDialog from "../../components/Timesheet/EditEntryDialog";
import ConfirmDialog from "../../components/ConfirmDialog";

const MONTHS = ["Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno","Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"];
const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
const yyyymmdd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const isWorkCode = (c) => c && ["FERIE", "MALATTIA", "PERMESSO"].includes(String(c).toUpperCase()) === false;

export default function DashboardAmministrazioneTimesheet() {
  const today = new Date();
  const [year, setYear] = React.useState(today.getFullYear());
  const [month, setMonth] = React.useState(today.getMonth());

  // Dati
  const [employees, setEmployees] = React.useState([]);
  const [tsMap, setTsMap] = React.useState({});
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  // Filtri
  const [filterCompany, setFilterCompany] = React.useState("ALL");
  const [searchEmployee, setSearchEmployee] = React.useState("");
  const [searchCommessa, setSearchCommessa] = React.useState("");

  // Selezione cella (dipendente + giorno)
  const [selEmp, setSelEmp] = React.useState(null);
  const [selDate, setSelDate] = React.useState(null);

  // Dettagli sotto al calendario
  const [detailsReady, setDetailsReady] = React.useState(false);
  const [dayRecords, setDayRecords] = React.useState([]);
  const [daySegnalazione, setDaySegnalazione] = React.useState(null);
  const [monthSummary, setMonthSummary] = React.useState({ total: 0, commesse: [] });

  // Dialog segnalazione
  const [sigOpen, setSigOpen] = React.useState(false);
  const [sigOk, setSigOk] = React.useState("");
  // Edit entry dialog for admins
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [editDialogItem, setEditDialogItem] = React.useState(null);
  // Confirm delete
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [deleteCandidate, setDeleteCandidate] = React.useState(null);

  React.useEffect(() => {
    let mounted = true;
    setLoading(true);
    Promise.all([getEmployees(), getAllEmployeeTimesheets()])
      .then(([emps, ts]) => {
        if (!mounted) return;
        setEmployees(emps || []);
        setTsMap(ts || {});
      })
      .catch((e) => {
        if (!mounted) return;
        setError(e?.message || "Errore caricamento dati");
      })
      .finally(() => mounted && setLoading(false));
    return () => (mounted = false);
  }, []);

  const companies = React.useMemo(
    () => Array.from(new Set((employees || []).map((e) => e.azienda).filter(Boolean))).sort(),
    [employees]
  );

  // Match helper per filtri
  const empMatchesFilters = React.useCallback(
    (e) => {
      // Azienda
      if (filterCompany !== "ALL" && e.azienda !== filterCompany) return false;

      // Nome/cognome
      if (searchEmployee.trim()) {
        const needle = searchEmployee.trim().toLowerCase();
        const hay = `${e.name}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }

      // Commessa nel mese selezionato
      if (searchCommessa.trim()) {
        const needle = searchCommessa.trim().toLowerCase();
        const ts = tsMap[e.id] || {};
        let found = false;
        Object.entries(ts).some(([key, records]) => {
          if (key.endsWith("_segnalazione")) return false;
          const [yy, mm] = key.split("-").map(Number);
          if (yy !== year || mm !== month + 1) return false;
          return (records || []).some((r) => String(r.commessa).toLowerCase().includes(needle));
        }) && (found = true);
        if (!found) return false;
      }

      return true;
    },
    [filterCompany, searchEmployee, searchCommessa, tsMap, year, month]
  );

  // Righe: una per dipendente (filtrate)
  const rows = React.useMemo(
    () => employees.filter(empMatchesFilters).map((e) => ({
      id: e.id,
      dipendente: e.name,
      azienda: e.azienda || "",
    })),
    [employees, empMatchesFilters]
  );

  // Aggiornamento aggregati globali (rispettano i filtri correnti)
  const [globalMonthAgg, setGlobalMonthAgg] = React.useState([]);
  const [aggLoading, setAggLoading] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    setAggLoading(true);
    getGlobalMonthByCommessa({
      year,
      month,
      employeeIds: rows.map((r) => r.id),
      filterCommessa: searchCommessa,
    })
      .then((rows) => mounted && setGlobalMonthAgg(rows))
      .finally(() => mounted && setAggLoading(false));
    return () => {
      mounted = false;
    };
  }, [year, month, rows, searchCommessa]);

  // Click su un giorno: carica anche il riepilogo mensile del dipendente dal mock
  const handleCellClick = React.useCallback(
    async (params) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(params.field)) return;
      const dateKey = params.field;
      const empRow = params.row;
      setSelEmp(empRow);
      setSelDate(dateKey);

      // Calcola immediatamente i dettagli
      const ts = tsMap[empRow.id] || {};
      const recs = ts[dateKey] || [];
      const seg = ts[`${dateKey}_segnalazione`] || null;
      setDayRecords(recs);
      setDaySegnalazione(seg);
      // riepilogo mensile da mock
      const summary = await getEmployeeMonthSummary(empRow.id, year, month);
      setMonthSummary(summary);
      setDetailsReady(true);
      setSigOk("");
    },
    [tsMap, year, month]
  );

  // Aggiorna sezione dettagli
  const refreshDetails = React.useCallback(() => {
    if (!selEmp || !selDate) return;
    const ts = tsMap[selEmp.id] || {};
    const recs = ts[selDate] || [];
    const seg = ts[`${selDate}_segnalazione`] || null;
    setDayRecords(recs);
    setDaySegnalazione(seg);
    // riepilogo mensile da mock
    getEmployeeMonthSummary(selEmp.id, year, month).then(setMonthSummary);
    setDetailsReady(true);
  }, [selEmp, selDate, tsMap, year, month]);

  // Open admin edit dialog for an entry
  const handleEditEntry = React.useCallback((entry) => {
    if (!selEmp || !selDate || !entry) return;
    setEditDialogItem(entry);
    setEditDialogOpen(true);
  }, [selEmp, selDate]);

  // Save handler from dialog: update tsMap
  const handleSaveEditedEntry = React.useCallback((updated) => {
    if (!selEmp || !selDate || !updated) return;
    const empTs = tsMap[selEmp.id] || {};
    const list = (empTs[selDate] || []).slice();
    const idx = list.findIndex((r) => r === editDialogItem || (r.commessa === editDialogItem?.commessa && r.ore === editDialogItem?.ore && r.descrizione === editDialogItem?.descrizione));
    if (idx === -1) return;
    list[idx] = { ...list[idx], ore: updated.ore, descrizione: updated.descrizione, commessa: updated.commessa };
    const next = { ...tsMap };
    next[selEmp.id] = { ...(next[selEmp.id] || {}) };
    next[selEmp.id][selDate] = list;
    setTsMap(next);
    setEditDialogOpen(false);
    setEditDialogItem(null);
    refreshDetails();
  }, [selEmp, selDate, tsMap, editDialogItem, refreshDetails]);

  // Delete an entry from the selected cell
  const handleDeleteEntry = React.useCallback(
    async (entry) => {
      if (!selEmp || !selDate || !entry) return;
      setDeleteCandidate(entry);
      setConfirmOpen(true);
    },
    [selEmp, selDate, tsMap, refreshDetails]
  );

  return (
    <Container maxWidth="xl" sx={{ py: 2 }}>
      {/* Filters + month/year + legend */}
      <Paper sx={{ mb: 2, p: 2, boxShadow: 8, borderRadius: 2, bgcolor: "customBackground.main" }}>
        <FiltersBar
          filterCompany={filterCompany}
          setFilterCompany={setFilterCompany}
          companies={companies}
          searchEmployee={searchEmployee}
          setSearchEmployee={setSearchEmployee}
          searchCommessa={searchCommessa}
          setSearchCommessa={setSearchCommessa}
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
          onDayClick={async (empRow, dateKey) => {
            setSelEmp(empRow);
            setSelDate(dateKey);
            const ts = tsMap[empRow.id] || {};
            setDayRecords(ts[dateKey] || []);
            setDaySegnalazione(ts[`${dateKey}_segnalazione`] || null);
            setDetailsReady(true);
            setSigOk("");
            // riepilogo mensile da mock
            const summary = await getEmployeeMonthSummary(empRow.id, year, month);
            setMonthSummary(summary);
          }}
          onEmployeeClick={async (empRow) => {
            if (!empRow) return;
            setSelEmp(empRow);
            setSelDate(null);
            // clear day-specific data
            setDayRecords([]);
            setDaySegnalazione(null);
            setDetailsReady(true);
            setSigOk("");
            const summary = await getEmployeeMonthSummary(empRow.id, year, month);
            setMonthSummary(summary);
          }}
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
        detailsReady={detailsReady}
        dayRecords={dayRecords}
        daySegnalazione={daySegnalazione}
        monthSummary={monthSummary}
        globalMonthAgg={globalMonthAgg}
        aggLoading={aggLoading}
        onRefresh={async () => {
          if (!selEmp || !selDate) return;
          const ts = tsMap[selEmp.id] || {};
          setDayRecords(ts[selDate] || []);
          setDaySegnalazione(ts[`${selDate}_segnalazione`] || null);
          const summary = await getEmployeeMonthSummary(selEmp.id, year, month);
          setMonthSummary(summary);
          setDetailsReady(true);
        }}
        onOpenSegnalazione={() => {
          setSigOk("");
          setSigOpen(true);
        }}
        onEditEntry={handleEditEntry}
        onDeleteEntry={handleDeleteEntry}
      />

      <SegnalazioneDialog
        open={sigOpen}
        onClose={() => setSigOpen(false)}
        selEmp={selEmp}
        selDate={selDate}
        onSend={async (message) => {
          if (!selEmp || !selDate) return;
          await sendSegnalazione(selEmp.id, selDate, message);
          setSigOk("Segnalazione inviata.");
          // keep the dialog open briefly to show success
          setTimeout(() => setSigOpen(false), 800);
        }}
        sendingOk={sigOk}
      />
      <EditEntryDialog
        open={editDialogOpen}
        mode="edit"
        item={editDialogItem}
        commesse={[]}
        maxOre={8}
        onClose={() => { setEditDialogOpen(false); setEditDialogItem(null); }}
        onSave={handleSaveEditedEntry}
      />
      <ConfirmDialog
        open={confirmOpen}
        title="Elimina voce"
        message="Eliminare questa voce?"
        onClose={() => { setConfirmOpen(false); setDeleteCandidate(null); }}
        onConfirm={() => {
          if (!selEmp || !selDate || !deleteCandidate) return;
          const empTs = tsMap[selEmp.id] || {};
          const list = (empTs[selDate] || []).slice();
          const idx = list.findIndex((r) => r === deleteCandidate || (r.commessa === deleteCandidate.commessa && r.ore === deleteCandidate.ore && r.descrizione === deleteCandidate.descrizione));
          if (idx === -1) return;
          list.splice(idx, 1);
          const next = { ...tsMap };
          next[selEmp.id] = { ...(next[selEmp.id] || {}) };
          if (list.length === 0) delete next[selEmp.id][selDate];
          else next[selEmp.id][selDate] = list;
          setTsMap(next);
          setConfirmOpen(false);
          setDeleteCandidate(null);
          refreshDetails();
        }}
      />
    </Container>
  );
}
