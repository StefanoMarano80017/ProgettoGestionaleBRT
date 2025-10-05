import React from 'react';
import { Box, Paper, Tabs, Tab, Typography, Divider, ToggleButtonGroup, ToggleButton, IconButton, Stack, Alert } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import aggregatePeriod from '@hooks/Timesheet/aggregation/aggregatePeriod';
// New: prefer the single‑day focused DayEntryPanel for the "Voci" tab
import AggregationTable from '@components/Timesheet/AggregationTable';

/**
 * AdminDetailsPanel
 * Two-tab panel:
 *  - Voci (reuse existing DetailsPanel for per-day entries & editing)
 *  - Aggregati (weekly / monthly / yearly aggregation over selected employees or single employee)
 */
export default function AdminDetailsPanel({
  selEmp,
  selDate,
  year,
  month,
  employees = [], // filtered rows currently displayed in grid
  tsMap = {},
  details, // object from useDayAndMonthDetails
  // entryEditing removed (legacy editing helpers no longer used)
  distinctCommesse = [],
  onSelectAllStats, // forwarded from Dashboard
  onDeselectAllStats,
  statsSelected,
}) {
  // DayEntryPanel internally manages draft + staging; this panel just passes employee/date and listens for draft changes.
  // Panel now only shows aggregated views & contextual day summary (editing moved to modal dialog via double-click)
  const [tab, setTab] = React.useState('aggregates');
  const handleTab = (_, v) => v && setTab(v);

  // Aggregation state
  const [period, setPeriod] = React.useState('month'); // week|month|year
  const [weekRef, setWeekRef] = React.useState(selDate ? new Date(selDate) : new Date());

  React.useEffect(() => {
    if (selDate) setWeekRef(new Date(selDate));
  }, [selDate]);

  const changeWeek = (delta) => {
    setWeekRef((d) => { const nd = new Date(d); nd.setDate(nd.getDate() + delta * 7); return nd; });
  };

  const employeeIds = React.useMemo(() => {
    // statsSelected tri-state: null => implicit all; empty Set => explicit none; non-empty Set => subset
    if (!selEmp) {
      if (statsSelected === null) return employees.map(e => e.id);
      if (statsSelected.size === 0) return [];
      return employees.filter(e => statsSelected.has(e.id)).map(e => e.id);
    }
    // if selEmp exists and we want only that employee in other flows, keep previous behavior: return all filtered employees by default
    if (statsSelected === null) return employees.map(e => e.id);
    if (statsSelected.size === 0) return [];
    return employees.filter(e => statsSelected.has(e.id)).map(e => e.id);
  }, [selEmp, employees, statsSelected]);

  const aggregation = React.useMemo(() => {
    return aggregatePeriod({
      tsMap,
      employeeIds,
      period,
      referenceDate: weekRef,
      year,
      month,
      includeAbsences: false,
    });
  }, [tsMap, employeeIds, period, weekRef, year, month]);

  const weekLabel = React.useMemo(() => {
    if (period !== 'week') return '';
    const { start, end } = aggregation.range;
    const fmt = (d) => `${d.getDate()}/${d.getMonth()+1}`;
    return `${fmt(start)} - ${fmt(end)}`;
  }, [aggregation, period]);

  // Inline daily editing removed; daily edits now happen in DayEntryDialog (double-click a cell).

  // staged save actions handled globally (StagedChangesPanel); local staged presence no longer needed

  return (
    <Paper sx={{ mt: 2, p: 2, boxShadow: 8, borderRadius: 2, bgcolor: 'customBackground.main' }}>
      <Tabs value={tab} onChange={handleTab} variant="scrollable" allowScrollButtonsMobile>
        <Tab label="Aggregati" value="aggregates" />
      </Tabs>
      <Divider sx={{ my: 2 }} />
      <Alert severity="info" sx={{ mb: 2 }}>
        Doppio click su una cella del calendario per aprire l'editor dettagliato della giornata.
      </Alert>
      {tab === 'aggregates' && (
        <Box>
          <Stack direction={{ xs:'column', md:'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs:'flex-start', md:'center' }} sx={{ mb:2 }}>
            <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
              <ToggleButtonGroup size="small" exclusive value={period} onChange={(_,v)=> v && setPeriod(v)}>
                <ToggleButton value="week">Settimana</ToggleButton>
                <ToggleButton value="month">Mese</ToggleButton>
                <ToggleButton value="year">Anno</ToggleButton>
              </ToggleButtonGroup>
              {period === 'week' && (
                <Stack direction="row" spacing={1} alignItems="center">
                  <IconButton size="small" onClick={()=>changeWeek(-1)}><ChevronLeftIcon fontSize="small" /></IconButton>
                  <Typography variant="body2" fontWeight={600}>{weekLabel}</Typography>
                  <IconButton size="small" onClick={()=>changeWeek(1)}><ChevronRightIcon fontSize="small" /></IconButton>
                </Stack>
              )}
            </Stack>
              {/* Aggregation always shows aggregated data for filtered employees (no single-employee toggle) */}
          </Stack>
            <Typography variant="subtitle2" gutterBottom>Aggregazione su dipendenti filtrati</Typography>
            <AggregationTable
              aggregation={aggregation}
              includeAbsences={false}
              onSelectAll={onSelectAllStats}
              onDeselectAll={onDeselectAllStats}
            />
        </Box>
      )}
    </Paper>
  );
}

