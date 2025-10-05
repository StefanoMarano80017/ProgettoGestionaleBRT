import React, { useMemo, useState } from "react";
import PropTypes from 'prop-types';
import { Box, Stack, Typography, Paper, Chip, Divider, ButtonGroup, Button } from "@mui/material";
import BeachAccessIcon from '@mui/icons-material/BeachAccess';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import EntryListItem from "@components/Entries/EntryListItem";
// date helpers moved to utils
import { parseKeyToDate, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, inRange, formatIt } from '../../Utils/dateRangeUtils';
import { BarChart } from "@mui/x-charts/BarChart";

const BAR_COLORS = [
  "#1976d2", "#9c27b0", "#2e7d32", "#0288d1", "#ed6c02",
  "#d32f2f", "#6d4c41", "#455a64", "#7b1fa2", "#00796b",
];


export default function CommesseDashboard({ assignedCommesse = [], data = {}, period = 'month', refDate = new Date(), onPeriodChange, onCommessaSelect }) {
  const [selectedCommessa, setSelectedCommessa] = useState(null);
  const range = useMemo(() => {
    if (period === "week") return { start: startOfWeek(refDate), end: endOfWeek(refDate) };
    if (period === "year") return { start: startOfYear(refDate), end: endOfYear(refDate) };
    return { start: startOfMonth(refDate), end: endOfMonth(refDate) };
  }, [period, refDate]);

  const listStats = useMemo(() => {
    // Calcola totali e ultime date per ciascuna commessa assegnata, ma solo nel range
    const map = new Map();
    assignedCommesse.forEach((c) => map.set(c, { commessa: c, total: 0, days: 0, lastDate: null }));
    Object.entries(data).forEach(([key, records]) => {
      if (key.endsWith("_segnalazione")) return;
      const dayDate = parseKeyToDate(key);
      if (!inRange(dayDate, range.start, range.end)) return;
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
  }, [assignedCommesse, data, range]);

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

  // Riepilogo: compute ferie/malattia/permesso totals from data within range (hours + days)
  const riepilogo = useMemo(() => {
    if (data && data.__monthlySummary) {
      // prefer precomputed summary when available
      return {
        ferie: data.__monthlySummary.ferie || { days: 0, hours: 0 },
        malattia: data.__monthlySummary.malattia || { days: 0, hours: 0 },
        permesso: data.__monthlySummary.permesso || { days: 0, hours: 0 },
      };
    }
    const acc = { ferie: { days: 0, hours: 0 }, malattia: { days: 0, hours: 0 }, permesso: { days: 0, hours: 0 } };
    Object.entries(data).forEach(([key, records]) => {
      if (key.endsWith('_segnalazione')) return;
      const d = parseKeyToDate(key);
      if (!inRange(d, range.start, range.end)) return;
      const seen = { ferie: false, malattia: false, permesso: false };
      records.forEach((r) => {
        const ore = Number(r.ore || 0);
        const c = String(r.commessa || '').toUpperCase();
        if (c === 'FERIE') {
          acc.ferie.hours += ore; if (!seen.ferie) { acc.ferie.days += 1; seen.ferie = true; }
        } else if (c === 'MALATTIA') {
          acc.malattia.hours += ore; if (!seen.malattia) { acc.malattia.days += 1; seen.malattia = true; }
        } else if (c === 'PERMESSO') {
          acc.permesso.hours += ore; if (!seen.permesso) { acc.permesso.days += 1; seen.permesso = true; }
        }
      });
    });
    return acc;
  }, [data, range]);

  // Presentational component: navigation and period selection are handled by parent

  const periodLabel = useMemo(() => {
    if (period === "week") {
      const s = range.start, e = range.end;
      return `${formatIt(s)} - ${formatIt(e)}`;
    }
    if (period === "year") return `${refDate.getFullYear()}`;
    return new Intl.DateTimeFormat("it-IT", { month: "long", year: "numeric" }).format(refDate);
  }, [period, refDate, range]);

  return (
    <Paper sx={{ p: 2, borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column', transition: 'transform 180ms ease, box-shadow 180ms ease', '&:hover': { transform: 'translateY(-4px)', boxShadow: 8 } }}>
      <Stack spacing={1} sx={{ height: '100%' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box />
          {/* Period selector UI: visualized inside the histogram component but controlled by parent via onPeriodChange */}
          <ButtonGroup size="small" variant="outlined">
            <Button onClick={() => onPeriodChange && onPeriodChange('week')} variant={period === 'week' ? 'contained' : 'outlined'}>Settimana</Button>
            <Button onClick={() => onPeriodChange && onPeriodChange('month')} variant={period === 'month' ? 'contained' : 'outlined'}>Mese</Button>
            <Button onClick={() => onPeriodChange && onPeriodChange('year')} variant={period === 'year' ? 'contained' : 'outlined'}>Anno</Button>
          </ButtonGroup>
        </Stack>

        {/* Chart + Monthly summary */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Box sx={{ flex: '1 1 280px', minWidth: 0, minHeight: 220, display: 'flex', alignItems: 'flex-start' }}>
            {chartData.labels.length ? (
              <BarChart
                xAxis={[{ scaleType: "band", data: chartData.labels }]}
                series={chartData.series}
                height={280}
                margin={{ top: 10, right: 48, bottom: 30, left: 48 }}
                tooltip={{
                  grouped: false,
                  // custom render: determine the hovered band index and use chartData to show only series with value at that index
                  render: (params) => {
                    try {
                      // Try to get index directly from params (different chart versions may expose it)
                      let idx = params?.index ?? params?.payload?.index ?? params?.payload?.dataIndex ?? null;

                      // If not present, try payload.data arrays
                      if (idx == null) {
                        const maybeArr = params?.payload?.data ?? params?.points?.[0]?.payload?.data ?? null;
                        if (Array.isArray(maybeArr)) {
                          idx = maybeArr.findIndex(v => v != null);
                        }
                      }

                      // Fallback: try to parse x value and find matching label index
                      if (idx == null) {
                        const x = params?.x ?? params?.payload?.x ?? params?.payload?.label ?? null;
                        if (x != null && chartData?.labels) {
                          idx = chartData.labels.indexOf(x);
                        }
                      }

                      // If we still don't have idx, try the points array and find first non-null value position
                      if (idx == null && Array.isArray(params?.points)) {
                        for (const p of params.points) {
                          const pd = p?.payload?.data;
                          if (Array.isArray(pd)) {
                            const found = pd.findIndex(v => v != null);
                            if (found >= 0) { idx = found; break; }
                          }
                        }
                      }

                      // If we have a valid index, collect series values at that index
                      const items = [];
                      if (idx != null && chartData && Array.isArray(chartData.series)) {
                        chartData.series.forEach((s) => {
                          const v = Array.isArray(s.data) ? s.data[idx] : (s.data ?? null);
                          if (v != null && v !== undefined) {
                            items.push({ label: s.label || s.id || '', value: v, color: s.color });
                          }
                        });
                      }

                      // If we found items from chartData series for the index, render them.
                      // Otherwise return null — avoid fallbacks that may surface values from unrelated indices.
                      if (!items.length) return null;

                      return (
                        <Box sx={{ p: 1 }}>
                          {items.map((it, i) => (
                            <Box key={`${it.label}-${i}`} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box sx={{ width: 10, height: 10, borderRadius: '2px', bgcolor: it.color || 'grey.500' }} />
                              <Typography variant="body2" sx={{ flex: 1 }}>{it.label}</Typography>
                              <Chip size="small" label={`${it.value}h`} />
                            </Box>
                          ))}
                        </Box>
                      );
                    } catch (e) {
                      return null;
                    }
                  }
                }}
              />
            ) : (
              <Box sx={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Typography variant="body2">Nessun dato nel periodo selezionato.</Typography>
              </Box>
            )}
          </Box>

          {/* Riepilogo: show only Malattia, Ferie, Permesso chips (if present in data.__monthlySummary) */}
          <Box sx={{ width: { xs: '100%', sm: 180 }, bgcolor: 'background.paper', p: 2, borderRadius: 1, transition: 'box-shadow 150ms ease, transform 150ms ease' }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Riepilogo</Typography>
            <Stack spacing={1}>
              <Chip
                size="small"
                label={`Ferie: ${riepilogo.ferie.days || 0}g (${riepilogo.ferie.hours || 0}h)`}
                icon={<BeachAccessIcon fontSize="small" sx={{ color: (theme) => theme.palette.primary.contrastText }} />}
                color="primary"
                sx={{ borderRadius: 1, justifyContent: 'flex-start' }}
                aria-label={`Ferie ${riepilogo.ferie.days || 0} giorni ${riepilogo.ferie.hours || 0} ore`}
              />

              <Chip
                size="small"
                label={`Malattia: ${riepilogo.malattia.days || 0}g (${riepilogo.malattia.hours || 0}h)`}
                icon={<LocalHospitalIcon fontSize="small" sx={{ color: (theme) => theme.palette.success.contrastText }} />}
                color="success"
                sx={{ borderRadius: 1, justifyContent: 'flex-start' }}
                aria-label={`Malattia ${riepilogo.malattia.days || 0} giorni ${riepilogo.malattia.hours || 0} ore`}
              />

              <Chip
                size="small"
                label={`Permesso: ${riepilogo.permesso.days || 0}g (${riepilogo.permesso.hours || 0}h)`}
                icon={<EventAvailableIcon fontSize="small" sx={{ color: (theme) => theme.palette.warning.contrastText }} />}
                color="warning"
                sx={{ borderRadius: 1, justifyContent: 'flex-start' }}
                aria-label={`Permesso ${riepilogo.permesso.days || 0} giorni ${riepilogo.permesso.hours || 0} ore`}
              />
            </Stack>
          </Box>
        </Stack>

  <Divider />

  {/* Active commesse list under the chart + summary */}
  <Box sx={{ overflowY: 'auto' }}>
          <Stack spacing={1}>
            {listStats.map((s, idx) => {
              const isSelectedCommessa = selectedCommessa === s.commessa;
              const handleSelect = () => {
                const next = isSelectedCommessa ? null : s.commessa;
                setSelectedCommessa(next);
                // placeholder action: in futuro redirect/filtraggio
                if (typeof onCommessaSelect === 'function') onCommessaSelect(next);
                else console.log('selected commessa', next);
              };

              const handleKey = (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleSelect();
                }
              };

              return (
              <React.Fragment key={s.commessa}>
                <Paper
                  elevation={0}
                  onClick={handleSelect}
                  onKeyDown={handleKey}
                  tabIndex={0}
                  role="button"
                  aria-pressed={isSelectedCommessa}
                  sx={{
                    p: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    bgcolor: idx % 2 === 0 ? 'background.default' : 'transparent',
                    border: isSelectedCommessa ? (t) => `1px solid ${t.palette.primary.main}` : 'none',
                    boxShadow: isSelectedCommessa ? (t) => `0 0 0 4px ${t.palette.primary.main}22` : 'none',
                    transition: 'box-shadow 150ms ease, border 150ms ease, transform 150ms ease, background-color 150ms ease',
                    '&:hover, &:focus-visible': isSelectedCommessa ? (t) => ({ boxShadow: `0 0 0 6px ${t.palette.primary.main}22` }) : { boxShadow: 6, transform: 'translateY(-4px)', bgcolor: 'action.hover' },
                    cursor: 'pointer'
                  }}
                >
                  <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{s.commessa}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>{`${s.days} giorni — ultimo: ${s.lastDate ? new Date(s.lastDate).toLocaleDateString() : '—'}`}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
                    <Chip size="small" variant="outlined" label={`${s.total}h`} aria-label={`Ore totali ${s.total} ore`} />
                    {s.total > 0 ? (
                      <Chip size="small" label="Attiva" color="success" aria-label={`Commessa ${s.commessa} attiva`} />
                    ) : (
                      <Chip size="small" label="Inattiva" aria-label={`Commessa ${s.commessa} non attiva`} />
                    )}
                  </Box>
                </Paper>
                <Divider />
              </React.Fragment>
              );
            })}
            {listStats.length === 0 && (
              <Box sx={{ py: 3, textAlign: "center" }}>
                <Typography variant="body2">Nessuna commessa assegnata.</Typography>
              </Box>
            )}
          </Stack>
        </Box>
      </Stack>
    </Paper>
  );
}

CommesseDashboard.propTypes = {
  assignedCommesse: PropTypes.array,
  data: PropTypes.object,
  period: PropTypes.oneOf(['week','month','year']),
  refDate: PropTypes.instanceOf(Date),
  onPeriodChange: PropTypes.func,
  onCommessaSelect: PropTypes.func,
};