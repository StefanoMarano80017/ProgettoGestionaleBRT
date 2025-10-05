import React from 'react';
import { Box, Paper, Tabs, Tab, Typography, Divider, ToggleButtonGroup, ToggleButton, IconButton, Stack, Alert } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import aggregatePeriod from '@hooks/Timesheet/aggregation/aggregatePeriod';
// New: prefer the single‑day focused DayEntryPanel for the "Voci" tab
import DayEntryPanel from '@components/Calendar/DayEntryPanel';
import { useTimesheetContext } from '@hooks/Timesheet';
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
  // Access global timesheet context to persist inline edits from DayEntryPanel
  const { stageUpdate } = useTimesheetContext();
  const [tab, setTab] = React.useState('entries');
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

  // --- Single day panel integration ---
  // We reuse DayEntryPanel for the daily view; build a data object shaped like the hook expects.
  const dailyData = React.useMemo(() => {
    if (!selEmp) return {};
    const empTsRaw = tsMap[selEmp.id] || {};
    // Override selected day with local edited state
    const empTs = selDate ? { ...empTsRaw, [selDate]: details.dayRecords || empTsRaw[selDate] || [] } : empTsRaw;
    const absenceKeys = ['FERIE','MALATTIA','PERMESSO'];
    const absenceSummary = { ferie:{ days:0,hours:0 }, malattia:{ days:0,hours:0 }, permesso:{ days:0,hours:0 } };
    const commessaMap = {}; // { commessa: hours }
    let totalMonthHours = 0;
    Object.entries(empTs).forEach(([k, list]) => {
      if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(k)) return;
      const [yy, mm] = k.split('-').map(Number);
      if (yy !== year || mm !== month + 1) return;
      const daySetAbs = new Set();
      (list||[]).forEach(r => {
        if (!r) return;
        const code = String(r.commessa||'').toUpperCase();
        const ore = Number(r.ore||0);
        totalMonthHours += ore;
        if (!absenceKeys.includes(code)) {
          if (!commessaMap[code]) commessaMap[code] = 0;
          commessaMap[code] += ore;
        } else {
          const key = code === 'FERIE' ? 'ferie' : code === 'MALATTIA' ? 'malattia' : 'permesso';
          absenceSummary[key].hours += ore;
          daySetAbs.add(key);
        }
      });
      daySetAbs.forEach(key => absenceSummary[key].days += 1);
    });
    const commesseSummary = Object.entries(commessaMap)
      .map(([commessa, ore]) => ({ commessa, ore }))
      .sort((a,b) => b.ore - a.ore);
    return { ...empTs, __monthlySummary: { ...absenceSummary, commesse: commesseSummary, totalHours: totalMonthHours } };
  }, [selEmp, selDate, tsMap, details.dayRecords, year, month]);

  const handleAddRecord = React.useCallback((day, records) => {
    if (!selEmp || !day) return;
    // 1. Update day records in details hook (local)
    if (day === selDate) {
      details.setDayRecords(records);
    }
    // 2. Stage update into provider so calendar reflects changes but can be saved in batch
    stageUpdate(selEmp.id, day, records);
    // 3. Recompute lightweight month summary (assenze + commesse)
    if (day.startsWith(`${year}-${String(month+1).padStart(2,'0')}`)) {
      const empTs = { ...(tsMap[selEmp.id] || {}), [day]: records };
      const absenceKeys = ['FERIE','MALATTIA','PERMESSO'];
      const absenceSummary = { ferie:{ days:0,hours:0 }, malattia:{ days:0,hours:0 }, permesso:{ days:0,hours:0 } };
      const commessaMap = {};
      let totalMonthHours = 0;
      Object.entries(empTs).forEach(([k,list]) => {
        if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(k)) return;
        const [yy, mm] = k.split('-').map(Number);
        if (yy !== year || mm !== month + 1) return;
        const daySetAbs = new Set();
        (list||[]).forEach(r => {
          if (!r) return;
          const code = String(r.commessa||'').toUpperCase();
          const ore = Number(r.ore||0);
            totalMonthHours += ore;
          if (!absenceKeys.includes(code)) {
            if (!commessaMap[code]) commessaMap[code] = 0;
            commessaMap[code] += ore;
          } else {
            const key = code === 'FERIE' ? 'ferie' : code === 'MALATTIA' ? 'malattia' : 'permesso';
            absenceSummary[key].hours += ore;
            daySetAbs.add(key);
          }
        });
        daySetAbs.forEach(key => absenceSummary[key].days += 1);
      });
      const commesseSummary = Object.entries(commessaMap).map(([commessa, ore]) => ({ commessa, ore })).sort((a,b)=> b.ore - a.ore);
      details.setMonthSummary && details.setMonthSummary({ ...(details.monthSummary||{}), __monthlySummary: { ...absenceSummary, commesse: commesseSummary, totalHours: totalMonthHours } });
    }
    // TODO: integrate remote save API if required
  }, [selEmp, selDate, details, year, month, tsMap, stageUpdate]);

  // staged save actions handled globally (StagedChangesPanel); local staged presence no longer needed

  return (
    <Paper sx={{ mt: 2, p: 2, boxShadow: 8, borderRadius: 2, bgcolor: 'customBackground.main' }}>
      <Tabs value={tab} onChange={handleTab} variant="scrollable" allowScrollButtonsMobile>
        <Tab label="Voci" value="entries" />
        <Tab label="Aggregati" value="aggregates" />
      </Tabs>
      <Divider sx={{ my: 2 }} />
      {tab === 'entries' && (
        selEmp && selDate ? (
          <DayEntryPanel
            selectedDay={selDate}
            data={dailyData}
            commesse={distinctCommesse}
            onAddRecord={handleAddRecord}
            maxHoursPerDay={8}
          />
        ) : (
          <Alert severity="info">Seleziona un dipendente e un giorno dal calendario per visualizzare le voci.</Alert>
        )
      )}

      {/* Staged-save is handled by the centralized StagedChangesPanel */}
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

