import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  MenuItem
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import InsightsIcon from '@mui/icons-material/Insights';
import EventNoteIcon from '@mui/icons-material/EventNote';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { PieChart } from '@mui/x-charts/PieChart';
import EntryListItem from '@shared/components/Entries/EntryListItem';
import { getCommessaColor } from '@shared/utils/commessaColors';
import { ABSENCE_CHIP_COLOR, PERIOD_OPTIONS } from './utils';

function AdminEmployeeInspectorView({
  employee,
  monthLabel,
  heroAvatarColor,
  periodLabel,
  periodOptions,
  effectivePeriod,
  onPeriodChange,
  dayOptions,
  selectedDayOption,
  onDaySelect,
  summaryCards,
  analytics,
  hasCommessaData,
  hasAbsenceData,
  commesseDetails,
  hasActiveCommesse,
  hasArchivedCommesse,
  commessaTab,
  onCommessaTabChange,
  referenceLoading,
  selectedDayRecords,
  selectedDaySegnalazione,
  previousMonthStatus,
  formatHours,
  formatDateLabel,
  selectedDay
}) {
  const theme = useTheme();
  const heroGradient = useMemo(() => {
    const start = theme.palette.customBlue3?.main || theme.palette.primary.dark;
    const mid = theme.palette.customBlue2?.main || theme.palette.primary.main;
    const endBase = theme.palette.customBlue1?.main || theme.palette.primary.light;
    const end = alpha(heroAvatarColor || endBase, 0.9);
    return `linear-gradient(130deg, ${alpha(start, 0.98)} 0%, ${alpha(mid, 0.92)} 42%, ${end} 100%)`;
  }, [heroAvatarColor, theme]);

  const chartContainerRef = useRef(null);
  const [chartContainerWidth, setChartContainerWidth] = useState(360);

  useEffect(() => {
    const node = chartContainerRef.current;
    if (!node || typeof ResizeObserver === 'undefined') {
      return undefined;
    }

    const observer = new ResizeObserver((entries) => {
      if (!entries.length) return;
      const { width } = entries[0].contentRect;
      setChartContainerWidth(width);
    });

    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  const donutWidth = useMemo(
    () => Math.max(260, Math.min(chartContainerWidth, 560)),
    [chartContainerWidth]
  );

  const donutHeight = useMemo(
    () => Math.max(240, Math.min(donutWidth * 0.75, 420)),
    [donutWidth]
  );

  const cardBaseSx = useMemo(
    () => ({
      p: { xs: 1.75, md: 2.25 },
      borderRadius: 3,
      border: '1px solid',
      borderColor: 'divider',
      bgcolor: 'background.paper',
      boxShadow: '0 18px 36px rgba(15, 23, 42, 0.08)',
      display: 'flex',
      flexDirection: 'column',
      gap: 1.75
    }),
    []
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
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}> Seleziona un dipendente dalla tabella </Typography>
        <Typography variant="body2" color="text.secondary"> Usa il calendario principale per esplorare giorni e periodi, qui troverai gli approfondimenti analitici della persona selezionata. </Typography>
      </Paper>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box
        sx={{
          display: 'grid',
          gap: { xs: 1.5, md: 2 },
          gridAutoFlow: 'row dense',
          gridTemplateColumns: {
            xs: '1fr',
            md: 'repeat(12, minmax(0, 1fr))',
            xl: 'repeat(12, minmax(0, 1fr))'
          },
          height: '100%',
          overflow: 'auto',
          '&::-webkit-scrollbar': {
            width: 8
          },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: 'divider',
            borderRadius: 4
          }
        }}
      >
        <Paper
          elevation={0}
          sx={{
            ...cardBaseSx,
            gridColumn: { xs: '1 / -1', md: '1 / -1' },
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
                <Typography variant="overline" sx={{ letterSpacing: 1.8, color: alpha('#FFFFFF', 0.68) }}> Dipendente selezionato </Typography>
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
            gridColumn: { xs: '1 / -1', md: '1 / -1' }
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
                <Typography variant="h6" sx={{ fontWeight: 600 }}> Analisi periodo selezionato </Typography>
                {referenceLoading && <CircularProgress size={18} thickness={4} />}
              </Stack>
              {periodLabel && <Chip size="small" color="primary" variant="outlined" label={periodLabel} />}
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
                onChange={onPeriodChange}
              >
                {(periodOptions || PERIOD_OPTIONS).map((option) => (
                  <ToggleButton key={option.value} value={option.value}>
                    {option.label}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
              <FormControl size="small" sx={{ minWidth: 220 }}>
                <FormLabel sx={{ fontWeight: 600, mb: 0.5, color: 'text.primary' }} htmlFor="day-selector"> Giornata </FormLabel>
                <Select
                  id="day-selector"
                  value={selectedDayOption ? selectedDayOption.value : ''}
                  onChange={onDaySelect}
                  displayEmpty
                  disabled={!dayOptions.length}
                  renderValue={(value) => {
                    if (!value) {
                      return (
                        <Typography variant="body2" color="text.secondary"> Nessuna giornata selezionata </Typography>
                      );
                    }
                    const option = dayOptions.find((item) => item.value === value);
                    return option?.label || value;
                  }}
                >
                  <MenuItem value="">Nessuna giornata selezionata</MenuItem>
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
            gridColumn: { xs: '1 / -1', md: '1 / -1' }
          }}
        >
          <Stack spacing={2}>
            <Typography variant="h6" sx={{ fontWeight: 600, letterSpacing: -0.4 }}> Panoramica attività </Typography>
            <Tabs
              value={commessaTab}
              onChange={(_event, value) => onCommessaTabChange(value)}
              textColor="primary"
              indicatorColor="primary"
              variant="fullWidth"
              sx={{
                borderBottom: 1,
                borderColor: 'divider',
                '& .MuiTab-root': {
                  fontWeight: 500,
                  minWidth: 0,
                  flex: 1
                }
              }}
            >
              <Tab label="Riepilogo" value="active" icon={<EventNoteIcon fontSize="small" />} iconPosition="start" />
              <Tab label="Commesse" value="archived" icon={<InsightsIcon fontSize="small" />} iconPosition="start" />
              <Tab label="Assenze" value="absences" icon={<InfoOutlinedIcon fontSize="small" />} iconPosition="start" />
              <Tab
                label="Stato"
                value="health"
                icon={
                  previousMonthStatus?.isComplete ? (
                    <CheckCircleOutlineIcon fontSize="small" />
                  ) : (
                    <WarningAmberIcon fontSize="small" />
                  )
                }
                iconPosition="start"
              />
            </Tabs>

            <Box sx={{ minHeight: 320 }}>
              {commessaTab === 'active' && (
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Stack spacing={2}>
                      <Stack
                        direction="row"
                        spacing={1.5}
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}> Ore per commessa </Typography>
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
                        <Box
                          ref={chartContainerRef}
                          sx={{
                            minHeight: 240,
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <PieChart
                            legend={{ hidden: true }}
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
                            width={donutWidth}
                            height={donutHeight}
                            margin={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            slotProps={{
                              legend: { hidden: true },
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
                            sx={{ '& .MuiChartsLegend-root': { display: 'none' } }}
                          />
                        </Box>
                      ) : (
                        <Alert severity="info">Nessuna ora lavorata registrata nel periodo selezionato.</Alert>
                      )}
                    </Stack>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Stack spacing={2}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}> Dettaglio ore </Typography>
                      {hasCommessaData ? (
                        <TableContainer sx={{ maxHeight: 280 }}>
                          <Table size="small" stickyHeader>
                            <TableHead>
                              <TableRow>
                                <TableCell>Commessa</TableCell>
                                <TableCell align="right">Ore</TableCell>
                                <TableCell align="right">%</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {analytics.commessaRows.map((row) => {
                                const percentage =
                                  analytics.totalWorkHours > 0
                                    ? Math.round((row.hours / analytics.totalWorkHours) * 100)
                                    : 0;
                                return (
                                  <TableRow key={row.code} hover>
                                    <TableCell>
                                      <Stack direction="row" spacing={1} alignItems="center">
                                        <Box
                                          sx={{
                                            width: 10,
                                            height: 10,
                                            borderRadius: '50%',
                                            bgcolor: getCommessaColor(row.label || row.code)
                                          }}
                                        />
                                        <Box>
                                          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
                                            {row.label}
                                          </Typography>
                                          {row.code !== row.label && (
                                            <Typography variant="caption" color="text.secondary">
                                              {row.code}
                                            </Typography>
                                          )}
                                        </Box>
                                      </Stack>
                                    </TableCell>
                                    <TableCell align="right">
                                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                        {formatHours(row.hours)}
                                      </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                      <Chip
                                        size="small"
                                        label={`${percentage}%`}
                                        sx={{
                                          height: 20,
                                          fontSize: '0.7rem',
                                          fontWeight: 600,
                                          bgcolor: alpha(theme.palette.primary.main, 0.08)
                                        }}
                                      />
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      ) : (
                        <Alert severity="info">Nessun dato disponibile.</Alert>
                      )}
                    </Stack>
                  </Grid>
                </Grid>
              )}

              {commessaTab === 'archived' && (
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Stack spacing={1.5}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        Commesse attive ({commesseDetails.active.length})
                      </Typography>
                      {hasActiveCommesse ? (
                        <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                          <Stack spacing={1}>
                            {commesseDetails.active.map((item) => (
                              <Paper
                                key={item.id}
                                variant="outlined"
                                sx={{
                                  p: 1.5,
                                  bgcolor: alpha(theme.palette.success.main, 0.04),
                                  borderColor: alpha(theme.palette.success.main, 0.2),
                                  '&:hover': { bgcolor: alpha(theme.palette.success.main, 0.08) }
                                }}
                              >
                                <Stack spacing={0.5}>
                                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                                      {item.nome}
                                    </Typography>
                                    <Chip
                                      size="small"
                                      label={item.stato}
                                      color="success"
                                      sx={{ height: 18, fontSize: '0.65rem' }}
                                    />
                                  </Stack>
                                  <Typography variant="caption" color="text.secondary">
                                    {item.id}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    📅 {item.periodo}
                                  </Typography>
                                  <Stack direction="row" spacing={1.5} flexWrap="wrap">
                                    <Typography variant="caption" color="text.secondary">
                                      <strong>Cliente:</strong> {item.cliente}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      <strong>Resp:</strong> {item.responsabile}
                                    </Typography>
                                  </Stack>
                                  {item.sottocommesse?.length > 0 && (
                                    <Chip
                                      size="small"
                                      label={`${item.sottocommesse.length} sottocommesse`}
                                      variant="outlined"
                                      sx={{ alignSelf: 'flex-start', height: 20, fontSize: '0.7rem' }}
                                    />
                                  )}
                                </Stack>
                              </Paper>
                            ))}
                          </Stack>
                        </Box>
                      ) : (
                        <Alert severity="info">Nessuna commessa attiva.</Alert>
                      )}
                    </Stack>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Stack spacing={1.5}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                        Commesse archiviate ({commesseDetails.archived.length})
                      </Typography>
                      {hasArchivedCommesse ? (
                        <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                          <Stack spacing={1}>
                            {commesseDetails.archived.map((item) => (
                              <Paper
                                key={item.id}
                                variant="outlined"
                                sx={{
                                  p: 1.5,
                                  bgcolor: alpha(theme.palette.background.default, 0.5),
                                  borderColor: alpha(theme.palette.divider, 0.1),
                                  '&:hover': { bgcolor: alpha(theme.palette.action.hover, 0.04) }
                                }}
                              >
                                <Stack spacing={0.5}>
                                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                                      {item.nome}
                                    </Typography>
                                    <Chip
                                      size="small"
                                      label={item.stato}
                                      sx={{ height: 18, fontSize: '0.65rem' }}
                                    />
                                  </Stack>
                                  <Typography variant="caption" color="text.secondary">
                                    {item.id}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    📅 {item.periodo}
                                  </Typography>
                                  <Stack direction="row" spacing={1.5} flexWrap="wrap">
                                    <Typography variant="caption" color="text.secondary">
                                      <strong>Cliente:</strong> {item.cliente}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      <strong>Resp:</strong> {item.responsabile}
                                    </Typography>
                                  </Stack>
                                  {item.sottocommesse?.length > 0 && (
                                    <Chip
                                      size="small"
                                      label={`${item.sottocommesse.length} sottocommesse`}
                                      variant="outlined"
                                      sx={{ alignSelf: 'flex-start', height: 20, fontSize: '0.7rem' }}
                                    />
                                  )}
                                </Stack>
                              </Paper>
                            ))}
                          </Stack>
                        </Box>
                      ) : (
                        <Alert severity="info">Nessuna commessa archiviata.</Alert>
                      )}
                    </Stack>
                  </Grid>
                </Grid>
              )}

              {commessaTab === 'absences' && (
                <Stack spacing={2}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}> Riepilogo assenze </Typography>
                    {analytics.totalAbsenceHours > 0 && (
                      <Chip
                        size="small"
                        color="warning"
                        variant="outlined"
                        label={`Totale ${formatHours(analytics.totalAbsenceHours)}`}
                      />
                    )}
                  </Stack>
                  {hasAbsenceData ? (
                    <Grid container spacing={2}>
                      {analytics.absenceRows.map((row) => (
                        <Grid item xs={12} sm={6} md={3} key={row.code}>
                          <Paper
                            variant="outlined"
                            sx={{
                              p: 2,
                              borderColor: alpha(
                                theme.palette[ABSENCE_CHIP_COLOR[row.code] || 'default'].main,
                                0.3
                              ),
                              bgcolor: alpha(
                                theme.palette[ABSENCE_CHIP_COLOR[row.code] || 'default'].main,
                                0.05
                              ),
                              transition: 'all 0.2s',
                              '&:hover': {
                                bgcolor: alpha(
                                  theme.palette[ABSENCE_CHIP_COLOR[row.code] || 'default'].main,
                                  0.1
                                ),
                                transform: 'translateY(-2px)',
                                boxShadow: 2
                              }
                            }}
                          >
                            <Stack spacing={1.25}>
                              <Chip
                                size="small"
                                color={ABSENCE_CHIP_COLOR[row.code] || 'default'}
                                label={row.label}
                                sx={{ alignSelf: 'flex-start', fontWeight: 600 }}
                              />
                              <Stack spacing={0.5}>
                                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                                  {formatHours(row.hours)}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {row.days === 0
                                    ? 'Nessun giorno'
                                    : row.days === 1
                                    ? '1 giorno'
                                    : `${row.days} giorni`}
                                </Typography>
                              </Stack>
                            </Stack>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  ) : (
                    <Alert severity="success" icon={<CheckCircleOutlineIcon />}>
                      <strong>Perfetto!</strong> Nessuna assenza registrata nel periodo selezionato.
                    </Alert>
                  )}
                </Stack>
              )}

              {commessaTab === 'health' && (
                <Stack spacing={2}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}> Completezza mese precedente </Typography>
                  {previousMonthStatus ? (
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Paper
                          variant="outlined"
                          sx={{
                            p: 2.5,
                            bgcolor: previousMonthStatus.isComplete
                              ? alpha(theme.palette.success.main, 0.05)
                              : alpha(theme.palette.warning.main, 0.05),
                            borderColor: previousMonthStatus.isComplete
                              ? alpha(theme.palette.success.main, 0.3)
                              : alpha(theme.palette.warning.main, 0.3)
                          }}
                        >
                          <Stack spacing={2}>
                            <Stack direction="row" spacing={1.5} alignItems="center">
                              {previousMonthStatus.isComplete ? (
                                <CheckCircleOutlineIcon color="success" sx={{ fontSize: 40 }} />
                              ) : (
                                <WarningAmberIcon color="warning" sx={{ fontSize: 40 }} />
                              )}
                              <Box>
                                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                  {previousMonthStatus.label}
                                </Typography>
                                <Typography variant="body2" color="text.secondary"> Completezza del mese </Typography>
                              </Box>
                            </Stack>
                            <Divider />
                            <Stack spacing={1.5}>
                              <Stack direction="row" justifyContent="space-between" alignItems="center">
                                <Typography variant="body2" color="text.secondary"> Percentuale completamento </Typography>
                                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                  {Math.round(previousMonthStatus.ratio * 100)}%
                                </Typography>
                              </Stack>
                              <Box
                                sx={{
                                  height: 8,
                                  bgcolor: alpha(theme.palette.divider, 0.1),
                                  borderRadius: 4,
                                  overflow: 'hidden'
                                }}
                              >
                                <Box
                                  sx={{
                                    width: `${Math.round(previousMonthStatus.ratio * 100)}%`,
                                    height: '100%',
                                    bgcolor: previousMonthStatus.isComplete
                                      ? theme.palette.success.main
                                      : theme.palette.warning.main,
                                    transition: 'width 0.3s ease'
                                  }}
                                />
                              </Box>
                            </Stack>
                          </Stack>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        {previousMonthStatus.missingCount > 0 ? (
                          <Alert severity="warning" icon={<WarningAmberIcon />}>
                            <Stack spacing={1}>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                Giorni mancanti: {previousMonthStatus.missingCount}
                              </Typography>
                              <Typography variant="caption" color="text.secondary"> Alcuni giorni lavorativi non hanno ore registrate sufficienti (min 7.5h). </Typography>
                              <Stack direction="row" spacing={0.75} flexWrap="wrap" mt={1}>
                                {previousMonthStatus.missingSamples.map((label) => (
                                  <Chip
                                    key={label}
                                    size="small"
                                    color="warning"
                                    variant="outlined"
                                    label={label}
                                    sx={{ fontSize: '0.75rem' }}
                                  />
                                ))}
                                {previousMonthStatus.missingCount > 3 && (
                                  <Chip
                                    size="small"
                                    label={`+${previousMonthStatus.missingCount - 3} altri`}
                                    variant="outlined"
                                    sx={{ fontSize: '0.75rem' }}
                                  />
                                )}
                              </Stack>
                            </Stack>
                          </Alert>
                        ) : (
                          <Alert severity="success" icon={<CheckCircleOutlineIcon />}>
                            <Stack spacing={0.5}>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}> Mese completato ✓ </Typography>
                              <Typography variant="caption" color="text.secondary"> Tutte le giornate lavorative hanno ore registrate sufficienti. Ottimo lavoro! </Typography>
                            </Stack>
                          </Alert>
                        )}
                      </Grid>
                    </Grid>
                  ) : (
                    <Alert severity="info"> Nessun dato disponibile per valutare la completezza del mese precedente. </Alert>
                  )}
                </Stack>
              )}
            </Box>
          </Stack>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            ...cardBaseSx,
            gridColumn: { xs: '1 / -1', md: '1 / -1' }
          }}
        >
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            alignItems={{ xs: 'flex-start', md: 'center' }}
            justifyContent="space-between"
          >
            <Stack spacing={0.5}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}> Dettaglio giornaliero </Typography>
              <Typography variant="body2" color="text.secondary"> Una vista rapida delle voci registrate nella giornata selezionata. </Typography>
            </Stack>
            {selectedDay && <Chip size="small" color="primary" label={formatDateLabel(selectedDay)} />}
          </Stack>

          {!selectedDay ? (
            <Alert severity="info" sx={{ mt: 2 }}> Seleziona un giorno dal calendario principale per vedere le voci registrate. </Alert>
          ) : selectedDayRecords.length === 0 ? (
            <Alert severity="warning" sx={{ mt: 2 }}> Nessuna voce registrata per il giorno selezionato. </Alert>
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
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}> Segnalazione amministrativa </Typography>
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

AdminEmployeeInspectorView.propTypes = {
  employee: PropTypes.shape({
    id: PropTypes.string.isRequired,
    nome: PropTypes.string,
    cognome: PropTypes.string,
    azienda: PropTypes.string,
    username: PropTypes.string,
    roles: PropTypes.arrayOf(PropTypes.string)
  }),
  monthLabel: PropTypes.string.isRequired,
  heroAvatarColor: PropTypes.string,
  periodLabel: PropTypes.string,
  periodOptions: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired
    })
  ),
  effectivePeriod: PropTypes.string.isRequired,
  onPeriodChange: PropTypes.func.isRequired,
  dayOptions: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired
    })
  ).isRequired,
  selectedDayOption: PropTypes.shape({
    value: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired
  }),
  onDaySelect: PropTypes.func.isRequired,
  summaryCards: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      description: PropTypes.string
    })
  ).isRequired,
  analytics: PropTypes.shape({
    totalWorkHours: PropTypes.number,
    totalEntries: PropTypes.number,
    recordedDays: PropTypes.number,
    activeCommessaCount: PropTypes.number,
    archivedCommessaCount: PropTypes.number,
    totalAbsenceHours: PropTypes.number,
    pieData: PropTypes.array,
    commessaRows: PropTypes.array,
    absenceRows: PropTypes.array
  }).isRequired,
  hasCommessaData: PropTypes.bool.isRequired,
  hasAbsenceData: PropTypes.bool.isRequired,
  commesseDetails: PropTypes.shape({
    active: PropTypes.array.isRequired,
    archived: PropTypes.array.isRequired
  }).isRequired,
  hasActiveCommesse: PropTypes.bool.isRequired,
  hasArchivedCommesse: PropTypes.bool.isRequired,
  commessaTab: PropTypes.oneOf(['active', 'archived', 'absences', 'health']).isRequired,
  onCommessaTabChange: PropTypes.func.isRequired,
  referenceLoading: PropTypes.bool.isRequired,
  selectedDayRecords: PropTypes.array.isRequired,
  selectedDaySegnalazione: PropTypes.object,
  previousMonthStatus: PropTypes.shape({
    label: PropTypes.string.isRequired,
    isComplete: PropTypes.bool.isRequired,
    ratio: PropTypes.number.isRequired,
    missingCount: PropTypes.number.isRequired,
    missingSamples: PropTypes.arrayOf(PropTypes.string).isRequired
  }),
  formatHours: PropTypes.func.isRequired,
  formatDateLabel: PropTypes.func.isRequired,
  selectedDay: PropTypes.string
};

AdminEmployeeInspectorView.defaultProps = {
  periodOptions: PERIOD_OPTIONS
};

export default AdminEmployeeInspectorView;
