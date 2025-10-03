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
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
  Paper,
  Divider,
  InputAdornment,
  Container, // <-- aggiunto
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import SendIcon from "@mui/icons-material/Send";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import SearchIcon from "@mui/icons-material/Search";
import { getEmployees, getAllEmployeeTimesheets, sendSegnalazione } from "../../mocks/ProjectMock";
import { getEmployeeMonthSummary, getGlobalMonthByCommessa } from "../../mocks/TimesheetAggregatesMock";
import EmployeeMonthGrid from "../../Components/Calendar/EmployeeMonthGrid";

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
  const [sigMsg, setSigMsg] = React.useState("");
  const [sigOk, setSigOk] = React.useState("");

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

  return (
    <Container maxWidth="xl" sx={{ py: 2 }}>
      {/* Barra filtri estesa (Azienda, Dipendente, Commessa) */}
      <Paper sx={{ mb: 2, p: 2, boxShadow: 8, borderRadius: 2, bgcolor: "customBackground.main" }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          alignItems="center"
          sx={{ flexWrap: "wrap" }}
        >
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Azienda</InputLabel>
            <Select
              label="Azienda"
              value={filterCompany}
              onChange={(e) => setFilterCompany(e.target.value)}
            >
              <MenuItem value="ALL">Tutte</MenuItem>
              {companies.map((c) => (
                <MenuItem key={c} value={c}>
                  {c}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            size="small"
            label="Cerca dipendente"
            value={searchEmployee}
            onChange={(e) => setSearchEmployee(e.target.value)}
            sx={{ minWidth: 220 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            size="small"
            label="Cerca commessa (mese)"
            value={searchCommessa}
            onChange={(e) => setSearchCommessa(e.target.value)}
            sx={{ minWidth: 240 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        </Stack>

        {/* Filtro mese/anno + info */}
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="center" justifyContent="space-between" sx={{ mt: 2 }}>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ flexWrap: "wrap" }}>
            <FormControl size="small">
              <InputLabel>Mese</InputLabel>
              <Select label="Mese" value={month} onChange={(e) => setMonth(Number(e.target.value))} sx={{ minWidth: 160 }}>
                {MONTHS.map((m, idx) => (
                  <MenuItem key={m} value={idx}>{m}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small">
              <InputLabel>Anno</InputLabel>
              <Select label="Anno" value={year} onChange={(e) => setYear(Number(e.target.value))} sx={{ minWidth: 120 }}>
                {Array.from({ length: 4 }, (_, i) => today.getFullYear() - 1 + i).map((y) => (
                  <MenuItem key={y} value={y}>{y}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            <InfoOutlinedIcon color="action" />
            <Typography variant="body2">
              Calendario timesheet: righe per dipendente, colonne per giorno.
            </Typography>
          </Stack>
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
          height={520}
          dayWidth={52}
          dayHeight={28}
          dipWidth={240}
          azWidth={130}
        />
      </Paper>

      {/* Sezione dettagli sotto il calendario */}
      <Paper sx={{ mt: 2, p: 2, boxShadow: 8, borderRadius: 2, bgcolor: "customBackground.main" }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems="center"
          justifyContent="space-between"
        >
          <Typography variant="subtitle1">
            {selEmp && selDate
              ? `Dettagli ${selEmp.dipendente} — ${selDate}`
              : "Seleziona una cella (giorno) per visualizzare i dettagli"}
          </Typography>
          <Stack direction="row" spacing={1}>
            {/* Rimane un tasto di refresh manuale, ma i dettagli si aggiornano già al click */}
            <Button
              variant="outlined"
              size="small"
              startIcon={<AccessTimeIcon />}
              disabled={!selEmp || !selDate}
              onClick={async () => {
                if (!selEmp || !selDate) return;
                const ts = tsMap[selEmp.id] || {};
                setDayRecords(ts[selDate] || []);
                setDaySegnalazione(ts[`${selDate}_segnalazione`] || null);
                const summary = await getEmployeeMonthSummary(selEmp.id, year, month);
                setMonthSummary(summary);
                setDetailsReady(true);
              }}
            >
              Aggiorna dettagli
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<SendIcon />}
              disabled={!selEmp || !selDate}
              onClick={() => {
                setSigMsg("");
                setSigOk("");
                setSigOpen(true);
              }}
            >
              Invia segnalazione
            </Button>
          </Stack>
        </Stack>

        {detailsReady && (
          <Box sx={{ mt: 2 }}>
            {daySegnalazione && (
              <Alert severity={daySegnalazione.livello || "warning"} sx={{ mb: 2 }}>
                Segnalazione esistente: {daySegnalazione.descrizione}
              </Alert>
            )}

            <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="stretch">
              {/* Dettagli del giorno */}
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" gutterBottom>Commesse del giorno</Typography>
                {!dayRecords.length ? (
                  <Typography variant="body2">Nessun inserimento per il giorno selezionato.</Typography>
                ) : (
                  <Stack spacing={1}>
                    {dayRecords.map((r, idx) => (
                      <Paper key={idx} variant="outlined" sx={{ p: 1, borderRadius: 1 }}>
                        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Chip
                              size="small"
                              label={r.commessa}
                              color={
                                r.commessa === "FERIE" ? "success" :
                                r.commessa === "MALATTIA" ? "secondary" :
                                r.commessa === "PERMESSO" ? "info" : "default"
                              }
                              variant={["FERIE","MALATTIA","PERMESSO"].includes(r.commessa) ? "filled" : "outlined"}
                              sx={{ borderRadius: 1 }}
                            />
                            <Typography variant="body2">{r.descrizione || "—"}</Typography>
                          </Stack>
                          <Chip size="small" variant="outlined" label={`${r.ore}h`} />
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                )}
              </Box>

              <Divider flexItem orientation="vertical" />

              {/* Aggregati mensili per DIPENDENTE + GLOBALI per COMMESSA */}
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle2" gutterBottom>Aggregati mensili (dipendente)</Typography>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <Chip size="small" color="primary" variant="outlined" label={`Totale mese: ${monthSummary.total}h`} />
                </Stack>
                {!monthSummary.commesse.length ? (
                  <Typography variant="body2">Nessuna commessa lavorativa nel mese.</Typography>
                ) : (
                  <Stack spacing={1} sx={{ mb: 2 }}>
                    {monthSummary.commesse.map((c) => (
                      <Stack key={`${c.commessa}-emp`} direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                        <Chip size="small" variant="outlined" sx={{ borderRadius: 1 }} label={c.commessa} />
                        <Chip size="small" variant="outlined" label={`${c.ore}h`} />
                      </Stack>
                    ))}
                  </Stack>
                )}

                {/* NUOVO: Aggregati mensili globali per commessa (tutti i dipendenti filtrati) */}
                <Typography variant="subtitle2" gutterBottom>Aggregati mensili per commessa (tutti i dipendenti filtrati)</Typography>
                {aggLoading ? (
                  <Typography variant="body2">Caricamento aggregati...</Typography>
                ) : !globalMonthAgg.length ? (
                  <Typography variant="body2">Nessuna commessa lavorativa nel mese.</Typography>
                ) : (
                  <Stack spacing={1}>
                    {globalMonthAgg.map((c) => (
                      <Stack key={`${c.commessa}-all`} direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                        <Chip size="small" variant="outlined" sx={{ borderRadius: 1 }} label={c.commessa} />
                        <Chip size="small" variant="outlined" label={`${c.ore}h`} />
                      </Stack>
                    ))}
                  </Stack>
                )}
              </Box>
            </Stack>
          </Box>
        )}
      </Paper>

      {/* Dialog segnalazione */}
      <Dialog open={sigOpen} onClose={() => setSigOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selEmp && selDate ? `Invia segnalazione a ${selEmp.dipendente} — ${selDate}` : "Invia segnalazione"}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <TextField label="Data (YYYY-MM-DD)" value={selDate || ""} size="small" InputProps={{ readOnly: true }} />
            <TextField
              label="Messaggio"
              value={sigMsg}
              onChange={(e) => setSigMsg(e.target.value)}
              multiline
              minRows={3}
              placeholder="Descrivi l'irregolarità negli inserimenti..."
            />
            {sigOk && <Alert severity="success">{sigOk}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSigOpen(false)}>Annulla</Button>
          <Button
            variant="contained"
            startIcon={<SendIcon />}
            disabled={!selEmp || !selDate || !sigMsg.trim()}
            onClick={async () => {
              await sendSegnalazione(selEmp.id, selDate, sigMsg.trim());
              setSigOk("Segnalazione inviata.");
              setTimeout(() => setSigOpen(false), 800);
            }}
          >
            Invia
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
