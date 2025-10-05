import React, { useMemo, useState } from "react";
import {
  Box,
  Tabs,
  Tab,
  Stack,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Chip,
  Divider,
  IconButton,
  ButtonGroup,
  Button,
  Tooltip,
} from "@mui/material";
import EntryListItem from "@components/Entries/EntryListItem";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import TodayIcon from "@mui/icons-material/Today";
import { BarChart } from "@mui/x-charts/BarChart";

const BAR_COLORS = [
  "#1976d2", "#9c27b0", "#2e7d32", "#0288d1", "#ed6c02",
  "#d32f2f", "#6d4c41", "#455a64", "#7b1fa2", "#00796b",
];

function parseKeyToDate(key) {
  // key: YYYY-MM-DD
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function startOfWeek(date) {
  // Lunedì come inizio settimana
  const d = new Date(date);
  const day = d.getDay(); // 0=Dom ... 6=Sab
  const offset = (day + 6) % 7; // Lunedì=0
  d.setDate(d.getDate() - offset);
  d.setHours(0, 0, 0, 0);
  return d;
}
function endOfWeek(date) {
  const s = startOfWeek(date);
  const e = new Date(s);
  e.setDate(s.getDate() + 6);
  e.setHours(23, 59, 59, 999);
  return e;
}
function startOfMonth(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), 1);
  d.setHours(0, 0, 0, 0);
  return d;
}
function endOfMonth(date) {
  const d = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  d.setHours(23, 59, 59, 999);
  return d;
}
function startOfYear(date) {
  const d = new Date(date.getFullYear(), 0, 1);
  d.setHours(0, 0, 0, 0);
  return d;
}
function endOfYear(date) {
  const d = new Date(date.getFullYear(), 11, 31);
  d.setHours(23, 59, 59, 999);
  return d;
}

function inRange(d, start, end) {
  const t = d.getTime();
  return t >= start.getTime() && t <= end.getTime();
}

function formatIt(date) {
  return new Intl.DateTimeFormat("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
}

export default function CommesseDashboard({ assignedCommesse = [], data = {} }) {
  const [tab, setTab] = useState(0);
  const [period, setPeriod] = useState("month"); // week | month | year
  const [refDate, setRefDate] = useState(new Date());

  const range = useMemo(() => {
    if (period === "week") return { start: startOfWeek(refDate), end: endOfWeek(refDate) };
    if (period === "year") return { start: startOfYear(refDate), end: endOfYear(refDate) };
    return { start: startOfMonth(refDate), end: endOfMonth(refDate) };
  }, [period, refDate]);

  const listStats = useMemo(() => {
    // Calcola totali e ultime date per ciascuna commessa assegnata
    const map = new Map();
    assignedCommesse.forEach((c) => map.set(c, { commessa: c, total: 0, days: 0, lastDate: null }));
    Object.entries(data).forEach(([key, records]) => {
      if (key.endsWith("_segnalazione")) return;
      const dayDate = parseKeyToDate(key);
      const daySet = new Set();
      records.forEach((rec) => {
        if (!map.has(rec.commessa)) return;
        const stat = map.get(rec.commessa);
        stat.total += Number(rec.ore || 0);
        if (!daySet.has(rec.commessa)) {
          stat.days += 1;
          daySet.add(rec.commessa);
        }
        if (!stat.lastDate || dayDate > stat.lastDate) stat.lastDate = dayDate;
      });
    });
    return Array.from(map.values()).sort((a, b) => a.commessa.localeCompare(b.commessa));
  }, [assignedCommesse, data]);

  const chartData = useMemo(() => {
    const sums = new Map(assignedCommesse.map((c) => [c, 0]));
    Object.entries(data).forEach(([key, records]) => {
      if (key.endsWith("_segnalazione")) return;
      const d = parseKeyToDate(key);
      if (!inRange(d, range.start, range.end)) return;
      records.forEach((rec) => {
        if (!sums.has(rec.commessa)) return;
        sums.set(rec.commessa, sums.get(rec.commessa) + Number(rec.ore || 0));
      });
    });
    const labels = Array.from(sums.keys());
    const values = labels.map((c) => sums.get(c));

    // Una serie per ogni commessa, con valore solo nel proprio indice (per-bar color robusto)
    const series = labels.map((label, i) => ({
      id: label,
      label,
      data: values.map((v, idx) => (idx === i ? v : null)),
      color: BAR_COLORS[i % BAR_COLORS.length],
      valueFormatter: (v) => (v == null ? "" : `${v}h`),
    }));

    return { labels, values, series };
  }, [assignedCommesse, data, range]);

  const shiftRef = (dir) => {
    if (period === "week") {
      const d = new Date(refDate);
      d.setDate(d.getDate() + dir * 7);
      setRefDate(d);
    } else if (period === "year") {
      setRefDate(new Date(refDate.getFullYear() + dir, refDate.getMonth(), refDate.getDate()));
    } else {
      setRefDate(new Date(refDate.getFullYear(), refDate.getMonth() + dir, 1));
    }
  };

  const periodLabel = useMemo(() => {
    if (period === "week") {
      const s = range.start, e = range.end;
      return `${formatIt(s)} - ${formatIt(e)}`;
    }
    if (period === "year") return `${refDate.getFullYear()}`;
    return new Intl.DateTimeFormat("it-IT", { month: "long", year: "numeric" }).format(refDate);
  }, [period, refDate, range]);

  return (
    <Paper sx={{ p: 2, borderRadius: 2 }}>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth" sx={{ mb: 2 }}>
        <Tab label="Commesse Attive" />
        <Tab label="Istogramma" />
      </Tabs>

      {tab === 0 && (
        <Box>
          <Stack spacing={1}>
            {listStats.map((s) => (
              <React.Fragment key={s.commessa}>
                <Paper variant="outlined" sx={{ p: 1 }}>
                  <EntryListItem
                    item={{ commessa: s.commessa, descrizione: `${s.days} giorni`, ore: s.total, lastDate: s.lastDate }}
                  />
                </Paper>
                <Divider />
              </React.Fragment>
            ))}
            {listStats.length === 0 && (
              <Box sx={{ py: 3, textAlign: "center" }}>
                <Typography variant="body2">Nessuna commessa assegnata.</Typography>
              </Box>
            )}
          </Stack>
        </Box>
      )}

      {tab === 1 && (
        <Stack spacing={1.5}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <ButtonGroup size="small" variant="outlined">
              <Button onClick={() => setPeriod("week")} variant={period === "week" ? "contained" : "outlined"}>
                Settimana
              </Button>
              <Button onClick={() => setPeriod("month")} variant={period === "month" ? "contained" : "outlined"}>
                Mese
              </Button>
              <Button onClick={() => setPeriod("year")} variant={period === "year" ? "contained" : "outlined"}>
                Anno
              </Button>
            </ButtonGroup>
            <Stack direction="row" alignItems="center" spacing={1}>
              <IconButton size="small" onClick={() => shiftRef(-1)}>
                <ArrowBackIosNewIcon fontSize="inherit" />
              </IconButton>
              <Tooltip title="Oggi">
                <IconButton size="small" onClick={() => setRefDate(new Date())}>
                  <TodayIcon fontSize="inherit" />
                </IconButton>
              </Tooltip>
              <IconButton size="small" onClick={() => shiftRef(1)}>
                <ArrowForwardIosIcon fontSize="inherit" />
              </IconButton>
              <Typography variant="caption" sx={{ ml: 1 }}>{periodLabel}</Typography>
            </Stack>
          </Stack>

          <Box sx={{ height: 280 }}>
            {chartData.labels.length ? (
              <BarChart
                xAxis={[{ scaleType: "band", data: chartData.labels }]}
                series={chartData.series}
                height={280}
                margin={{ top: 10, right: 10, bottom: 30, left: 40 }}
              />
            ) : (
                <Box sx={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Typography variant="body2">Nessun dato nel periodo selezionato.</Typography>
              </Box>
            )}
          </Box>
        </Stack>
      )}
    </Paper>
  );
}