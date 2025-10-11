import React, { useMemo, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Paper,
  Avatar,
  Box,
  Typography,
  Stack,
  Chip,
  Grid,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
  CircularProgress,
  Tabs,
  Tab,
  FormControl,
  FormLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import { PieChart } from '@mui/x-charts/PieChart';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import InsightsIcon from '@mui/icons-material/Insights';
import EventNoteIcon from '@mui/icons-material/EventNote';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import EntryListItem from '@shared/components/Entries/EntryListItem';
import { getCommessaColor } from '@shared/utils/commessaColors';
import useReferenceData from '@domains/timesheet/hooks/useReferenceData';
import {
  parseDateKey,
  getRangeForPeriod,
  formatRangeLabel,
  enumerateDateKeys,
  isWithinRange,
  isWorkDay
} from './utils/periodUtils';
import { useTheme, alpha } from '@mui/material/styles';

const PERIOD_OPTIONS = [
  { value: 'week', label: 'Settimana' },
  { value: 'month', label: 'Mese' },
  { value: 'year', label: 'Anno' }
];

const ABSENCE_TYPES = [
  { code: 'FERIE', label: 'Ferie' },
  { code: 'MALATTIA', label: 'Malattia' },
  { code: 'PERMESSO', label: 'Permesso' },
  { code: 'ROL', label: 'ROL' }
];

const ABSENCE_CHIP_COLOR = {
  FERIE: 'error',
  MALATTIA: 'success',
  PERMESSO: 'info',
  ROL: 'info'
};

const NON_WORK_CODES = new Set(ABSENCE_TYPES.map((item) => item.code));
const DEFAULT_PERIOD = 'week';
const UNKNOWN_COMMESSA_CODE = 'SENZA_COMMESSA';
const HOURS_PER_FULL_DAY = 7.5;

function ensurePeriod(value) {
  if (!value) return DEFAULT_PERIOD;
  return PERIOD_OPTIONS.some((option) => option.value === value) ? value : DEFAULT_PERIOD;
}

function formatHours(value) {
  const num = Number(value || 0);
  if (!Number.isFinite(num) || num === 0) return '0h';
  const rounded = Math.round(num * 10) / 10;
  return `${Number.isInteger(rounded) ? rounded : rounded.toFixed(1)}h`;
}

function formatDateLabel(dateKey) {
  if (!dateKey) return '—';
  const date = typeof dateKey === 'string' ? parseDateKey(dateKey) : dateKey;
  if (!date || Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('it-IT', {
    weekday: 'short',
    day: '2-digit',
    month: 'long'
  });
}

function normalizeCommessa(code) {
  if (!code) return UNKNOWN_COMMESSA_CODE;
  const normalized = String(code).trim().toUpperCase();
  return normalized || UNKNOWN_COMMESSA_CODE;
}

function sumWorkHours(entries = []) {
  return entries.reduce((sum, record) => {
    const commessa = normalizeCommessa(record?.commessa);
    if (NON_WORK_CODES.has(commessa)) return sum;
    return sum + (Number(record?.ore) || 0);
  }, 0);
}

export default function AdminEmployeeInspector({
  employee,
  month,
  year,
  mergedData,
  baseData,
  selectedDay,
  onSelectDay,
  selectedPeriod,
  onPeriodChange
}) {
  const theme = useTheme();
  const avatarSeed = useMemo(() => {
    if (!employee) return 'dipendente';
    const base = `${employee.nome || ''} ${employee.cognome || ''}`.trim();
    return base || employee.username || employee.id || 'dipendente';
  }, [employee]);
  const heroAvatarColor = useMemo(() => getCommessaColor(avatarSeed), [avatarSeed]);
  const heroGradient = useMemo(() => {
    const start = theme.palette.customBlue3?.main || theme.palette.primary.dark;
    const mid = theme.palette.customBlue2?.main || theme.palette.primary.main;
    const endBase = theme.palette.customBlue1?.main || theme.palette.primary.light;
    const end = alpha(heroAvatarColor || endBase, 0.9);
    return `linear-gradient(130deg, ${alpha(start, 0.98)} 0%, ${alpha(mid, 0.92)} 42%, ${end} 100%)`;
  }, [
    theme.palette.customBlue3?.main,
    theme.palette.customBlue2?.main,
    theme.palette.customBlue1?.main,
    theme.palette.primary.dark,
    theme.palette.primary.main,
    theme.palette.primary.light,
    heroAvatarColor
  ]);
  const effectiveMerged = useMemo(() => mergedData || {}, [mergedData]);
  const effectiveBase = useMemo(() => baseData || {}, [baseData]);

  const derivedSelectedPeriod = selectedPeriod ? ensurePeriod(selectedPeriod) : null;
  const [internalPeriod, setInternalPeriod] = useState(derivedSelectedPeriod || DEFAULT_PERIOD);
  const effectivePeriod = derivedSelectedPeriod || internalPeriod;

  useEffect(() => {
    if (derivedSelectedPeriod && derivedSelectedPeriod !== internalPeriod) {
      setInternalPeriod(derivedSelectedPeriod);
    }
  }, [derivedSelectedPeriod, internalPeriod]);

  const handlePeriodChange = (_event, value) => {
    if (!value) return;
    if (!selectedPeriod) {
      setInternalPeriod(value);
    }
    if (typeof onPeriodChange === 'function') {
      onPeriodChange(value);
    }
  };

  const handleDaySelect = (event) => {
    const value = event.target.value;
    if (!employee) return;
    if (!value) {
      onSelectDay?.(employee.id, null);
      return;
    }
    onSelectDay?.(employee.id, value);
  };

  const monthLabel = useMemo(() => {
    const date = new Date(year, month, 1);
    return date.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
  }, [month, year]);

  const referenceDate = useMemo(() => {
    if (selectedDay) {
      const parsed = parseDateKey(selectedDay);
      if (parsed) return parsed;
    }
    return new Date(year, month, 1);
  }, [selectedDay, month, year]);

  const periodRange = useMemo(
    () => getRangeForPeriod(effectivePeriod, referenceDate),
    [effectivePeriod, referenceDate]
  );

  const periodLabel = useMemo(() => {
    if (!periodRange) return '';
    const rangeLabel = formatRangeLabel(periodRange, effectivePeriod);
    const option = PERIOD_OPTIONS.find((opt) => opt.value === effectivePeriod);
    return option ? `${option.label}: ${rangeLabel}` : rangeLabel;
  }, [periodRange, effectivePeriod]);

  const { commesseConChiuse = [], loading: referenceLoading } = useReferenceData({
    commesse: true,
    personale: false,
    pmGroups: false,
    employeeId: employee?.id
  });

  const commesseLookup = useMemo(() => {
    const map = {};
    (commesseConChiuse || []).forEach((commessa) => {
      if (!commessa?.id) return;
      const key = commessa.id.toUpperCase();
      map[key] = commessa;
      (commessa.sottocommesse || []).forEach((sotto) => {
        if (!sotto?.id) return;
        map[sotto.id.toUpperCase()] = { ...sotto, stato: commessa.stato, parent: commessa };
      });
    });
    return map;
  }, [commesseConChiuse]);

  const commesseDetails = useMemo(() => {
    const active = [];
    const archived = [];
    (commesseConChiuse || []).forEach((commessa) => {
      if (!commessa) return;
      const item = {
        id: commessa.id,
        nome: commessa.nome,
        stato: commessa.stato,
        periodo: commessa.dataInizio && commessa.dataFine
          ? `${new Date(commessa.dataInizio).toLocaleDateString('it-IT')} → ${new Date(commessa.dataFine).toLocaleDateString('it-IT')}`
          : 'Periodo non disponibile',
        responsabile: commessa.sottocommesse?.[0]?.responsabile || commessa.responsabile || '—',
        cliente: commessa.cliente || '—',
        sottocommesse: commessa.sottocommesse || []
      };
      if (commessa.stato === 'CHIUSA') archived.push(item);
      else active.push(item);
    });
    return { active, archived };
  }, [commesseConChiuse]);

  const entriesByDay = useMemo(
    () =>
      Object.entries(effectiveMerged).filter(([key]) => !key.endsWith('_segnalazione')),
    [effectiveMerged]
  );

  const rangeEntries = useMemo(() => {
    if (!periodRange) return [];
    return entriesByDay
      .map(([dateKey, records]) => {
        const date = parseDateKey(dateKey);
        if (!date || !isWithinRange(date, periodRange)) return null;
        return { dateKey, date, records };
      })
      .filter(Boolean)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [entriesByDay, periodRange]);

  const dayOptions = useMemo(
    () =>
      rangeEntries.map(({ dateKey, date }) => ({
        value: dateKey,
        label: formatDateLabel(date)
      })),
    [rangeEntries]
  );

  const selectedDayOption = useMemo(
    () => (selectedDay ? dayOptions.find((option) => option.value === selectedDay) : null),
    [dayOptions, selectedDay]
  );

  const analytics = useMemo(() => {
    if (!periodRange) {
      return {
        totalWorkHours: 0,
        totalEntries: 0,
        recordedDays: 0,
        activeCommessaCount: 0,
        archivedCommessaCount: 0,
        totalAbsenceHours: 0,
        pieData: [],
        commessaRows: [],
        absenceRows: ABSENCE_TYPES.map(({ code, label }) => ({ code, label, hours: 0, days: 0 }))
      };
    }

    const absenceSummary = ABSENCE_TYPES.reduce((acc, { code }) => {
      acc[code] = { hours: 0, days: new Set() };
      return acc;
    }, {});

    const commessaHours = {};
    const recordedDays = new Set();
    const activeSet = new Set();
    const archivedSet = new Set();
    let totalWorkHours = 0;
    let totalEntries = 0;

    rangeEntries.forEach(({ dateKey, records }) => {
      recordedDays.add(dateKey);
      records.forEach((record) => {
        const ore = Number(record?.ore) || 0;
        if (!ore) return;
        totalEntries += 1;

        const normalized = normalizeCommessa(record?.commessa);
        if (NON_WORK_CODES.has(normalized)) {
          const absence = absenceSummary[normalized];
          if (absence) {
            absence.hours += ore;
            absence.days.add(dateKey);
          }
          return;
        }

        totalWorkHours += ore;
        const key = normalized || UNKNOWN_COMMESSA_CODE;
        commessaHours[key] = (commessaHours[key] || 0) + ore;
        const meta = commesseLookup[key];
        if (meta?.stato === 'CHIUSA') {
          archivedSet.add(key);
        } else if (meta) {
          activeSet.add(key);
        } else {
          activeSet.add(key);
        }
      });
    });

    const pieData = Object.entries(commessaHours)
      .sort((a, b) => b[1] - a[1])
      .map(([code, hours]) => {
        const meta = commesseLookup[code];
        const label = meta?.nome || (code === UNKNOWN_COMMESSA_CODE ? 'Senza codice' : code);
        const value = Math.round(hours * 10) / 10;
        return {
          id: code,
          label,
          value,
          color: getCommessaColor(label || code)
        };
      });

    const commessaRows = pieData.map(({ id, label, value }) => ({
      code: id,
      label,
      hours: value
    }));

    const absenceRows = ABSENCE_TYPES.map(({ code, label }) => {
      const summary = absenceSummary[code];
      return {
        code,
        label,
        hours: summary ? Math.round(summary.hours * 10) / 10 : 0,
        days: summary ? summary.days.size : 0
      };
    });

    const totalAbsenceHours = absenceRows.reduce((sum, row) => sum + row.hours, 0);

    return {
      totalWorkHours: Math.round(totalWorkHours * 10) / 10,
      totalEntries,
      recordedDays: recordedDays.size,
      activeCommessaCount: activeSet.size,
      archivedCommessaCount: archivedSet.size,
      totalAbsenceHours: Math.round(totalAbsenceHours * 10) / 10,
      pieData,
      commessaRows,
      absenceRows
    };
  }, [rangeEntries, commesseLookup, periodRange]);

  const hasCommessaData = analytics.commessaRows.length > 0;
  const hasAbsenceData = analytics.absenceRows.some((row) => row.hours > 0);
  const hasActiveCommesse = commesseDetails.active.length > 0;
  const hasArchivedCommesse = commesseDetails.archived.length > 0;
  const [commessaTab, setCommessaTab] = useState(hasActiveCommesse ? 'active' : 'archived');

  useEffect(() => {
    if (commessaTab === 'active' && !hasActiveCommesse && hasArchivedCommesse) {
      setCommessaTab('archived');
    } else if (commessaTab === 'archived' && !hasArchivedCommesse && hasActiveCommesse) {
      setCommessaTab('active');
    }
  }, [commessaTab, hasActiveCommesse, hasArchivedCommesse]);

  const selectedDayRecords = selectedDay ? effectiveMerged[selectedDay] || [] : [];
  const selectedDaySegnalazione = selectedDay
    ? effectiveBase[`${selectedDay}_segnalazione`] || null
    : null;

  const previousMonthStatus = useMemo(() => {
    if (!referenceDate) return null;
    const previous = new Date(referenceDate);
    previous.setDate(1);
    previous.setMonth(previous.getMonth() - 1);
    const prevRange = getRangeForPeriod('month', previous);
    if (!prevRange) return null;

    const workingKeys = enumerateDateKeys(prevRange).filter((key) => {
      const date = parseDateKey(key);
      return date && isWorkDay(date);
    });

    if (!workingKeys.length) {
      return {
        label: prevRange.start.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' }),
        isComplete: true,
        ratio: 1,
        missingCount: 0,
        missingSamples: []
      };
    }

    const missing = [];
    workingKeys.forEach((key) => {
      const hours = sumWorkHours(effectiveMerged[key] || []);
      if (hours < HOURS_PER_FULL_DAY) {
        missing.push(key);
      }
    });

    const ratio = (workingKeys.length - missing.length) / workingKeys.length;

    return {
      label: prevRange.start.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' }),
      isComplete: missing.length === 0,
      ratio,
      missingCount: missing.length,
      missingSamples: missing.slice(0, 3).map((key) => formatDateLabel(key))
    };
  }, [referenceDate, effectiveMerged]);

  const summaryCards = useMemo(
    () => [
      {
        id: 'hours',
        title: 'Ore lavorate',
        value: formatHours(analytics.totalWorkHours),
        description: 'Ore complessive registrate nel periodo'
      },
      {
        id: 'days',
        title: 'Giorni registrati',
        value: analytics.recordedDays,
        description: 'Giorni con almeno una voce'
      },
      {
        id: 'active',
        title: 'Commesse attive',
        value: analytics.activeCommessaCount,
        description: 'Con ore nel periodo'
      },
      {
        id: 'archived',
        title: 'Commesse archiviate',
        value: analytics.archivedCommessaCount,
        description: 'Commesse chiuse ancora consultate'
      }
    ],
    [analytics]
  );

  if (!employee) {
    return (
      <Paper
        elevation={0}
        sx={{
          mt: 4,
          p: 4,
          borderRadius: 3,
          border: '1px dashed',
          borderColor: 'divider',
          textAlign: 'center',
          bgcolor: 'background.paper'
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
          Seleziona un dipendente dalla tabella
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Usa il calendario principale per esplorare giorni e periodi, qui troverai gli approfondimenti
          analitici della persona selezionata.
        </Typography>
      </Paper>
    );
  }

  const cardBaseSx = {
    p: { xs: 1.75, md: 2.25 },
    borderRadius: 3,
    border: '1px solid',
    borderColor: 'divider',
    bgcolor: 'background.paper',
    boxShadow: '0 18px 36px rgba(15, 23, 42, 0.08)',
    display: 'flex',
    flexDirection: 'column',
    gap: 1.75
  };

  return (
    <Box sx={{ mt: 4 }}>
      <Box
        sx={{
          display: 'grid',
          gap: { xs: 2, md: 2.5, xl: 3 },
          gridAutoFlow: 'row dense',
          gridTemplateColumns: {
            xs: '1fr',
            md: 'repeat(12, minmax(0, 1fr))',
            xl: 'repeat(12, minmax(0, 1fr))'
          }
        }}
      >
        <Paper
          elevation={0}
          sx={{
            ...cardBaseSx,
            gridColumn: { xs: '1 / -1', md: '1 / span 7', xl: '1 / span 7' },
            color: 'common.white',
            borderColor: alpha(theme.palette.common.white, 0.18),
            backgroundImage: heroGradient,
            boxShadow: '0 28px 48px rgba(10, 18, 38, 0.32)'
          }}
        >
          <Stack spacing={2.25}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={{ xs: 1.75, sm: 2.5 }}
              alignItems={{ xs: 'flex-start', sm: 'center' }}
            >
              <Avatar
                sx={{
                  width: 72,
                  height: 72,
                  fontSize: '1.6rem',
                  fontWeight: 700,
                  bgcolor: heroAvatarColor,
                  color: theme.palette.getContrastText(heroAvatarColor),
                  border: '3px solid rgba(255,255,255,0.35)',
                  boxShadow: '0 12px 24px rgba(0,0,0,0.2)'
                }}
              >
                {(employee.nome?.[0] || '').toUpperCase()}
                {(employee.cognome?.[0] || '').toUpperCase()}
              </Avatar>
              <Stack spacing={0.6}>
                <Typography variant="overline" sx={{ letterSpacing: 1.8, color: alpha('#FFFFFF', 0.68) }}>
                  Dipendente selezionato
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
                  {employee.nome} {employee.cognome}
                </Typography>
              </Stack>
            </Stack>
            <Stack direction="row" spacing={0.75} flexWrap="wrap">
              <Chip
                label={`Azienda: ${employee.azienda || '—'}`}
                size="small"
                variant="outlined"
                sx={{
                  color: 'inherit',
                  borderColor: alpha('#FFFFFF', 0.35),
                  '& .MuiChip-label': { px: 1.25 }
                }}
              />
              <Chip
                label={`Username: ${employee.username || employee.id}`}
                size="small"
                variant="outlined"
                sx={{
                  color: 'inherit',
                  borderColor: alpha('#FFFFFF', 0.35),
                  '& .MuiChip-label': { px: 1.25 }
                }}
              />
              {employee.roles?.map((role) => (
                <Chip
                  key={role}
                  label={role}
                  size="small"
                  variant="outlined"
                  sx={{
                    color: 'inherit',
                    borderColor: alpha('#FFFFFF', 0.35),
                    '& .MuiChip-label': { px: 1.25 }
                  }}
                />
              ))}
            </Stack>
            <Typography variant="body2" sx={{ color: alpha('#FFFFFF', 0.82), mt: 0.25 }}>
              Panoramica del mese di {monthLabel}. Usa i controlli rapidi per cambiare periodo o mettere a
              fuoco una singola giornata e confronta subito con il calendario principale.
            </Typography>
          </Stack>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            ...cardBaseSx,
            gridColumn: { xs: '1 / -1', md: '8 / span 5', xl: '8 / span 5' }
          }}
        >
          <Stack spacing={2.5}>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={2}
              justifyContent="space-between"
              alignItems={{ xs: 'flex-start', md: 'center' }}
            >
              <Stack direction="row" spacing={1.25} alignItems="center">
                <InsightsIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Analisi periodo selezionato
                </Typography>
                {referenceLoading && <CircularProgress size={18} thickness={4} />}
              </Stack>
              {periodLabel && (
                <Chip size="small" color="primary" variant="outlined" label={periodLabel} />
              )}
            </Stack>

            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={2}
              justifyContent="space-between"
              alignItems={{ xs: 'flex-start', md: 'center' }}
            >
              <ToggleButtonGroup
                exclusive
                size="small"
                value={effectivePeriod}
                onChange={handlePeriodChange}
              >
                {PERIOD_OPTIONS.map((option) => (
                  <ToggleButton key={option.value} value={option.value}>
                    {option.label}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
              <FormControl size="small" sx={{ minWidth: 220 }}>
                <FormLabel sx={{ fontWeight: 600, mb: 0.5, color: 'text.primary' }} htmlFor="day-selector">
                  Giornata
                </FormLabel>
                <Select
                  id="day-selector"
                  value={selectedDayOption ? selectedDayOption.value : ''}
                  onChange={handleDaySelect}
                  displayEmpty
                  disabled={!dayOptions.length}
                  renderValue={(value) => {
                    if (!value) {
                      return (
                        <Typography variant="body2" color="text.secondary">
                          Nessuna giornata selezionata
                        </Typography>
                      );
                    }
                    const option = dayOptions.find((item) => item.value === value);
                    return option?.label || value;
                  }}
                >
                  <MenuItem value="">
                    Nessuna giornata selezionata
                  </MenuItem>
                  {dayOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>

            <Box
              sx={{
                display: 'grid',
                gap: 1.2,
                gridTemplateColumns: { xs: 'repeat(auto-fit, minmax(140px, 1fr))', sm: 'repeat(4, minmax(0, 1fr))' }
              }}
            >
              {summaryCards.map((card) => (
                <Box
                  key={card.id}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: alpha(theme.palette.primary.main, 0.12),
                    bgcolor: 'customBackground.main',
                    minHeight: 92,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      letterSpacing: 1.2,
                      textTransform: 'uppercase',
                      color: 'text.secondary',
                      fontWeight: 600
                    }}
                  >
                    {card.title}
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, lineHeight: 1 }}>
                    {card.value}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {card.description}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Stack>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            ...cardBaseSx,
            gridColumn: { xs: '1 / -1', md: '1 / span 7', xl: '1 / span 7' }
          }}
        >
          <Stack spacing={2.25} sx={{ flexGrow: 1 }}>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.5}
              justifyContent="space-between"
              alignItems={{ xs: 'flex-start', sm: 'center' }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <EventNoteIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Ore per commessa
                </Typography>
              </Stack>
              {analytics.totalWorkHours > 0 && (
                <Chip
                  size="small"
                  color="primary"
                  variant="outlined"
                  label={`Totale ${formatHours(analytics.totalWorkHours)}`}
                />
              )}
            </Stack>

            {hasCommessaData ? (
              <>
                <Box
                  sx={{
                    minHeight: 220,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <PieChart
                    series={[
                      {
                        data: analytics.pieData,
                        highlightScope: { fade: 'global', highlight: 'item' },
                        faded: {
                          innerRadius: 60,
                          additionalRadius: -15,
                          color: '#9aa0a6'
                        },
                        innerRadius: 60,
                        outerRadius: 110,
                        paddingAngle: 2,
                        cornerRadius: 4,
                        arcLabel: (item) => formatHours(item.value),
                        arcLabelMinAngle: 45
                      }
                    ]}
                    width={320}
                    height={240}
                    margin={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    slotProps={{
                      tooltip: {
                        content: ({ item }) => (
                          <Stack spacing={0.5} sx={{ p: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              {item?.label || 'Commessa'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatHours(Number(item?.value || 0))} registrate
                            </Typography>
                          </Stack>
                        )
                      }
                    }}
                    sx={{ '& .MuiChartsLegend-root': { pt: 0 } }}
                  />
                </Box>
                <Divider sx={{ my: 1 }} />
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Commessa</TableCell>
                        <TableCell align="right">Ore</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {analytics.commessaRows.map((row) => (
                        <TableRow key={row.code}>
                          <TableCell>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Box
                                sx={{
                                  width: 12,
                                  height: 12,
                                  borderRadius: '50%',
                                  bgcolor: getCommessaColor(row.label || row.code)
                                }}
                              />
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {row.label}
                              </Typography>
                              {row.code !== row.label && (
                                <Typography variant="caption" color="text.secondary">
                                  {row.code}
                                </Typography>
                              )}
                            </Stack>
                          </TableCell>
                          <TableCell align="right">{formatHours(row.hours)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            ) : (
              <Alert severity="info">
                Nessuna ora lavorata registrata nel periodo selezionato per le commesse.
              </Alert>
            )}
          </Stack>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            ...cardBaseSx,
            gridColumn: { xs: '1 / -1', md: '8 / span 5', xl: '8 / span 5' },
            p: { xs: 1.75, md: 2 },
            gap: 1.5,
            alignSelf: 'stretch'
          }}
        >
          <Stack spacing={1.25}>
            <Stack direction="row" spacing={1} alignItems="center">
              <InfoOutlinedIcon color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Assenze registrate
              </Typography>
            </Stack>
            {hasAbsenceData ? (
              <Stack spacing={1.25}>
                {analytics.absenceRows.map((row) => (
                  <Stack
                    key={row.code}
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    spacing={1.5}
                  >
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip
                        size="small"
                        color={ABSENCE_CHIP_COLOR[row.code] || 'default'}
                        variant="outlined"
                        label={row.label}
                      />
                      <Typography variant="body2" color="text.secondary">
                        {row.days === 1
                          ? `${row.days} giorno`
                          : row.days > 1
                            ? `${row.days} giorni`
                            : 'Nessun giorno'}
                      </Typography>
                    </Stack>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {formatHours(row.hours)}
                    </Typography>
                  </Stack>
                ))}
                {analytics.totalAbsenceHours > 0 && (
                  <Divider />
                )}
                {analytics.totalAbsenceHours > 0 && (
                  <Typography variant="body2" color="text.secondary">
                    Totale assenze: <strong>{formatHours(analytics.totalAbsenceHours)}</strong>
                  </Typography>
                )}
              </Stack>
            ) : (
              <Alert severity="success" sx={{ m: 0 }}>
                Nessuna assenza registrata nel periodo selezionato.
              </Alert>
            )}
          </Stack>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            ...cardBaseSx,
            gridColumn: { xs: '1 / -1', md: '8 / span 5', xl: '8 / span 5' },
            p: { xs: 1.75, md: 2 },
            gap: 1.5,
            alignSelf: 'stretch'
          }}
        >
          <Stack spacing={1.25}>
            <Stack direction="row" spacing={1} alignItems="center">
              {previousMonthStatus?.isComplete ? (
                <CheckCircleOutlineIcon color="success" />
              ) : (
                <WarningAmberIcon color="warning" />
              )}
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Chiusura mese precedente
              </Typography>
            </Stack>
            {previousMonthStatus ? (
              <Stack spacing={1.25}>
                <Typography variant="body2" color="text.secondary">
                  {previousMonthStatus.label}: {Math.round(previousMonthStatus.ratio * 100)}% delle giornate
                  lavorative con ore registrate.
                </Typography>
                {previousMonthStatus.missingCount > 0 ? (
                  <Stack spacing={1}>
                    <Typography variant="body2" color="warning.main" sx={{ fontWeight: 600 }}>
                      Giorni mancanti: {previousMonthStatus.missingCount}
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      {previousMonthStatus.missingSamples.map((label) => (
                        <Chip key={label} size="small" color="warning" variant="outlined" label={label} />
                      ))}
                    </Stack>
                  </Stack>
                ) : (
                  <Typography variant="body2" color="success.main">
                    Tutte le giornate lavorative risultano complete.
                  </Typography>
                )}
              </Stack>
            ) : (
              <Alert severity="info" sx={{ m: 0 }}>
                Nessun dato disponibile per valutare il mese precedente.
              </Alert>
            )}
          </Stack>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            ...cardBaseSx,
            gridColumn: { xs: '1 / -1', md: '1 / span 7', xl: '1 / span 7' }
          }}
        >
          <Stack spacing={2}>
            <Stack direction="row" spacing={1} alignItems="center">
              <InsightsIcon color="primary" />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Dettaglio commesse
              </Typography>
            </Stack>
            <Tabs
              value={commessaTab}
              onChange={(_event, value) => setCommessaTab(value)}
              textColor="primary"
              indicatorColor="primary"
              sx={{ minHeight: 42 }}
            >
              <Tab value="active" label={`Attive (${commesseDetails.active.length})`} />
              <Tab value="archived" label={`Archiviate (${commesseDetails.archived.length})`} />
            </Tabs>
            {(() => {
              const isActive = commessaTab === 'active';
              const entries = isActive ? commesseDetails.active : commesseDetails.archived;
              const hasEntries = isActive ? hasActiveCommesse : hasArchivedCommesse;
              const emptyMessage = isActive
                ? 'Nessuna commessa attiva in catalogo.'
                : 'Nessuna commessa archiviata disponibile.';
              return hasEntries ? (
                <List dense disablePadding sx={{ display: 'grid', gap: 0.5 }}>
                  {entries.map((commessa) => (
                    <ListItem key={`${commessa.id}-${commessa.nome}`} disableGutters sx={{ py: 0.6 }}>
                      <ListItemText
                        primary={
                          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                            <Chip
                              size="small"
                              color={isActive ? 'success' : 'default'}
                              variant={isActive ? 'filled' : 'outlined'}
                              label={commessa.id}
                            />
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {commessa.nome}
                            </Typography>
                          </Stack>
                        }
                        secondary={
                          <Typography variant="caption" color="text.secondary">
                            {commessa.periodo}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  {emptyMessage}
                </Typography>
              );
            })()}
          </Stack>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            ...cardBaseSx,
            gridColumn: { xs: '1 / -1', md: '1 / span 12' }
          }}
        >
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            alignItems={{ xs: 'flex-start', md: 'center' }}
            justifyContent="space-between"
          >
            <Stack spacing={0.5}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Dettaglio giornaliero
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Una vista rapida delle voci registrate nella giornata selezionata.
              </Typography>
            </Stack>
            {selectedDay && <Chip size="small" color="primary" label={formatDateLabel(selectedDay)} />}
          </Stack>

          {!selectedDay ? (
            <Alert severity="info" sx={{ mt: 2 }}>
              Seleziona un giorno dal calendario principale per vedere le voci registrate.
            </Alert>
          ) : selectedDayRecords.length === 0 ? (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Nessuna voce registrata per il giorno selezionato.
            </Alert>
          ) : (
            <Stack spacing={1.5} sx={{ mt: 2 }}>
              {selectedDayRecords.map((record, index) => (
                <Paper
                  key={`${selectedDay}-${index}`}
                  elevation={0}
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'customBackground.main'
                  }}
                >
                  <EntryListItem item={record} />
                </Paper>
              ))}
            </Stack>
          )}

          {selectedDaySegnalazione && (
            <Alert severity={selectedDaySegnalazione.livello || 'warning'} sx={{ mt: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                Segnalazione amministrativa
              </Typography>
              <Typography variant="body2">
                {selectedDaySegnalazione.descrizione || 'Segnalazione presente.'}
              </Typography>
            </Alert>
          )}
        </Paper>
      </Box>
    </Box>
  );
}

AdminEmployeeInspector.propTypes = {
  employee: PropTypes.shape({
    id: PropTypes.string.isRequired,
    nome: PropTypes.string,
    cognome: PropTypes.string,
    azienda: PropTypes.string,
    username: PropTypes.string,
    roles: PropTypes.arrayOf(PropTypes.string)
  }),
  month: PropTypes.number.isRequired,
  year: PropTypes.number.isRequired,
  mergedData: PropTypes.object,
  baseData: PropTypes.object,
  selectedDay: PropTypes.string,
  onSelectDay: PropTypes.func,
  selectedPeriod: PropTypes.oneOf(PERIOD_OPTIONS.map((option) => option.value)),
  onPeriodChange: PropTypes.func
};
