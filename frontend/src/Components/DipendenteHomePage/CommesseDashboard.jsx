import React, { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Stack, Typography, Paper, Chip, Divider, ButtonGroup, Button } from '@mui/material';
import BeachAccessIcon from '@mui/icons-material/BeachAccess';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import { parseKeyToDate, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, inRange } from '../../Utils/dateRangeUtils';
import { BarChart } from '@mui/x-charts/BarChart';

const BAR_COLORS = ['#1976d2', '#9c27b0', '#2e7d32', '#0288d1', '#ed6c02', '#d32f2f', '#6d4c41', '#455a64', '#7b1fa2', '#00796b'];

export default function CommesseDashboard({ assignedCommesse = [], data = {}, period = 'month', refDate = new Date(), onPeriodChange, onCommessaSelect }) {
  const [selectedCommessa, setSelectedCommessa] = useState(null);

  const range = useMemo(() => {
    if (period === 'week') return { start: startOfWeek(refDate), end: endOfWeek(refDate) };
    if (period === 'year') return { start: startOfYear(refDate), end: endOfYear(refDate) };
    return { start: startOfMonth(refDate), end: endOfMonth(refDate) };
  }, [period, refDate]);

  const listStats = useMemo(() => {
    const map = new Map();
    (assignedCommesse || []).forEach((c) => map.set(c, { commessa: c, total: 0, days: 0, lastDate: null }));
    Object.entries(data || {}).forEach(([key, records]) => {
      if (key.endsWith('_segnalazione')) return;
      const dayDate = parseKeyToDate(key);
      if (!inRange(dayDate, range.start, range.end)) return;
      const perDay = new Set();
      (records || []).forEach((rec) => {
        const comm = rec && rec.commessa;
        if (!comm || !map.has(comm)) return;
        const stat = map.get(comm);
        stat.total += Number(rec.ore || 0);
        if (!perDay.has(comm)) { stat.days += 1; perDay.add(comm); }
        if (!stat.lastDate || dayDate > stat.lastDate) stat.lastDate = dayDate;
      });
    });
    return Array.from(map.values()).sort((a, b) => String(a.commessa).localeCompare(String(b.commessa)));
  }, [assignedCommesse, data, range]);

  const chartData = useMemo(() => {
    const sums = new Map((assignedCommesse || []).map((c) => [c, 0]));
    Object.entries(data || {}).forEach(([key, records]) => {
      if (key.endsWith('_segnalazione')) return;
      const d = parseKeyToDate(key);
      if (!inRange(d, range.start, range.end)) return;
      (records || []).forEach((rec) => {
        if (!rec || !rec.commessa) return;
        if (!sums.has(rec.commessa)) return;
        sums.set(rec.commessa, sums.get(rec.commessa) + Number(rec.ore || 0));
      });
    });
    const labels = Array.from(sums.keys());
    const values = labels.map((c) => sums.get(c));
    const series = labels.map((label, i) => ({ id: label, label, data: values.map((v, idx) => (idx === i ? v : null)), color: BAR_COLORS[i % BAR_COLORS.length] }));
    return { labels, values, series };
  }, [assignedCommesse, data, range]);

  const riepilogo = useMemo(() => {
    if (data && data.__monthlySummary) return {
      ferie: data.__monthlySummary.ferie || { days: 0, hours: 0 },
      malattia: data.__monthlySummary.malattia || { days: 0, hours: 0 },
      permesso: data.__monthlySummary.permesso || { days: 0, hours: 0 },
    };
    const acc = { ferie: { days: 0, hours: 0 }, malattia: { days: 0, hours: 0 }, permesso: { days: 0, hours: 0 } };
    Object.entries(data || {}).forEach(([key, records]) => {
      if (key.endsWith('_segnalazione')) return;
      const d = parseKeyToDate(key);
      if (!inRange(d, range.start, range.end)) return;
      const seen = { ferie: false, malattia: false, permesso: false };
      (records || []).forEach((r) => {
        const ore = Number(r.ore || 0);
        const c = String(r.commessa || '').toUpperCase();
        if (c === 'FERIE') { acc.ferie.hours += ore; if (!seen.ferie) { acc.ferie.days += 1; seen.ferie = true; } }
        else if (c === 'MALATTIA') { acc.malattia.hours += ore; if (!seen.malattia) { acc.malattia.days += 1; seen.malattia = true; } }
        else if (c === 'PERMESSO') { acc.permesso.hours += ore; if (!seen.permesso) { acc.permesso.days += 1; seen.permesso = true; } }
      });
    });
    return acc;
  }, [data, range]);

  const handleSelectCommessa = (comm) => {
    const next = selectedCommessa === comm ? null : comm;
    setSelectedCommessa(next);
    if (typeof onCommessaSelect === 'function') onCommessaSelect(next);
  };

  return (
    <Paper sx={{ p: 2, borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Stack spacing={1} sx={{ height: '100%' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box />
          <ButtonGroup size="small" variant="outlined">
            <Button onClick={() => onPeriodChange && onPeriodChange('week')} variant={period === 'week' ? 'contained' : 'outlined'}>Settimana</Button>
            <Button onClick={() => onPeriodChange && onPeriodChange('month')} variant={period === 'month' ? 'contained' : 'outlined'}>Mese</Button>
            <Button onClick={() => onPeriodChange && onPeriodChange('year')} variant={period === 'year' ? 'contained' : 'outlined'}>Anno</Button>
          </ButtonGroup>
        </Stack>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Box sx={{ flex: '1 1 280px', minWidth: 0, minHeight: 220, display: 'flex', alignItems: 'flex-start' }}>
            {chartData.labels && chartData.labels.length ? (
              <BarChart
                xAxis={[{ scaleType: 'band', data: chartData.labels }]}
                series={chartData.series}
                height={280}
                margin={{ top: 10, right: 48, bottom: 30, left: 48 }}
                tooltip={{ grouped: false }}
              />
            ) : (
              <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="body2">Nessun dato nel periodo selezionato.</Typography>
              </Box>
            )}
          </Box>

          <Box sx={{ width: { xs: '100%', sm: 180 }, bgcolor: 'background.paper', p: 2, borderRadius: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Riepilogo</Typography>
            <Stack spacing={1}>
              <Chip size="small" label={`Ferie: ${riepilogo.ferie.days || 0}g (${riepilogo.ferie.hours || 0}h)`} icon={<BeachAccessIcon fontSize="small" />} color="primary" sx={{ borderRadius: 1 }} />
              <Chip size="small" label={`Malattia: ${riepilogo.malattia.days || 0}g (${riepilogo.malattia.hours || 0}h)`} icon={<LocalHospitalIcon fontSize="small" />} color="success" sx={{ borderRadius: 1 }} />
              <Chip size="small" label={`Permesso: ${riepilogo.permesso.days || 0}g (${riepilogo.permesso.hours || 0}h)`} icon={<EventAvailableIcon fontSize="small" />} color="warning" sx={{ borderRadius: 1 }} />
            </Stack>
          </Box>
        </Stack>

        <Divider />

        <Box sx={{ overflowY: 'auto' }}>
          <Stack spacing={1}>
            {(listStats || []).map((s) => (
              <React.Fragment key={s.commessa}>
                <Paper elevation={0} onClick={() => handleSelectCommessa(s.commessa)} tabIndex={0} role="button" aria-pressed={selectedCommessa === s.commessa} sx={{ p: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{s.commessa}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>{`${s.days} giorni — ultimo: ${s.lastDate ? new Date(s.lastDate).toLocaleDateString() : '—'}`}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
                    <Chip size="small" variant="outlined" label={`${s.total}h`} />
                    {s.total > 0 ? (<Chip size="small" label="Attiva" color="success" />) : (<Chip size="small" label="Inattiva" />)}
                  </Box>
                </Paper>
                <Divider />
              </React.Fragment>
            ))}
            {(listStats || []).length === 0 && (
              <Box sx={{ py: 3, textAlign: 'center' }}>
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
  period: PropTypes.oneOf(['week', 'month', 'year']),
  refDate: PropTypes.instanceOf(Date),
  onPeriodChange: PropTypes.func,
  onCommessaSelect: PropTypes.func,
};