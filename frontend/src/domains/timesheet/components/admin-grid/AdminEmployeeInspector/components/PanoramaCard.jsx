import React, { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Paper,
  Stack,
  Typography,
  Tabs,
  Tab,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Box,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import EventNoteIcon from '@mui/icons-material/EventNote';
import InsightsIcon from '@mui/icons-material/Insights';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ViewListIcon from '@mui/icons-material/ViewList';
import { PieChart } from '@mui/x-charts/PieChart';
import { getCommessaColor } from '@shared/utils/commessaColors';
import { ABSENCE_CHIP_COLOR, inspectorCardBaseSx } from '../utils';

function OverviewTab({ analytics, hasCommessaData, formatHours, mode }) {
  const theme = useTheme();
  const [chartContainerWidth, setChartContainerWidth] = useState(360);
  const chartContainerRef = useRef(null);

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
    () => Math.max(320, Math.min(chartContainerWidth - 80, 700)),
    [chartContainerWidth]
  );

  const donutHeight = useMemo(
    () => Math.max(280, Math.min(donutWidth * 0.8, 500)),
    [donutWidth]
  );

  if (!hasCommessaData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
        <Alert severity="info">
          {mode === 'daily'
            ? 'Nessuna ora lavorata registrata nella giornata selezionata.'
            : 'Nessuna ora lavorata registrata nel periodo selezionato.'}
        </Alert>
      </Box>
    );
  }

  return (
    <Stack spacing={3} sx={{ width: '100%' }}>
      <Stack spacing={2}>
        <Stack direction="row" spacing={1.5} justifyContent="space-between" alignItems="center">
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Ore per commessa
          </Typography>
          {analytics.totalWorkHours > 0 && (
            <Chip
              size="small"
              color="primary"
              variant="outlined"
              label={`Totale ${formatHours(analytics.totalWorkHours)}`}
            />
          )}
        </Stack>
        <Box
          ref={chartContainerRef}
          sx={{
            minHeight: 300,
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
                    innerRadius: 70,
                    additionalRadius: -15,
                    color: '#9aa0a6'
                  },
                  innerRadius: 70,
                  outerRadius: 130,
                  paddingAngle: 2,
                  cornerRadius: 4,
                  arcLabel: (item) => formatHours(item.value),
                  arcLabelMinAngle: 45
                }
              ]}
              width={donutWidth}
              height={donutHeight}
              margin={{ top: 20, bottom: 20, left: 20, right: 20 }}
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
      </Stack>

      <Stack spacing={2}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          Dettaglio ore
        </Typography>
        <TableContainer sx={{ maxHeight: 320 }}>
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
        </Stack>
    </Stack>
  );
}

OverviewTab.propTypes = {
  analytics: PropTypes.shape({
    totalWorkHours: PropTypes.number,
    commessaRows: PropTypes.array,
    pieData: PropTypes.array
  }).isRequired,
  hasCommessaData: PropTypes.bool.isRequired,
  formatHours: PropTypes.func.isRequired,
  mode: PropTypes.oneOf(['daily', 'period'])
};

OverviewTab.defaultProps = {
  mode: 'period'
};

function ProjectsTab({
  commesseDetails,
  hasActiveCommesse,
  hasArchivedCommesse
}) {
  const theme = useTheme();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTab, setDialogTab] = useState('active');

  const activeAccent = theme.palette.success.main;
  const archivedAccent = theme.palette.primary.main;

  const openDialog = (initialTab = 'active') => {
    const fallback = commesseDetails.active.length ? 'active' : 'archived';
    const nextTab = commesseDetails[initialTab]?.length ? initialTab : fallback;
    setDialogTab(nextTab);
    setDialogOpen(true);
  };

  const closeDialog = () => setDialogOpen(false);

  const renderSummaryCard = (item, variant) => {
    const isActive = variant === 'active';
    const accent = isActive ? activeAccent : archivedAccent;

    return (
      <Paper
        key={item.id}
        variant="outlined"
        sx={{
          px: 1,
          py: 0.75,
          borderLeft: `3px solid ${accent}`,
          borderColor: alpha(accent, isActive ? 0.3 : 0.2),
          bgcolor: alpha(accent, isActive ? 0.05 : 0.03),
          minHeight: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          transition: 'all 0.2s ease',
          '&:hover': {
            borderColor: accent,
            bgcolor: alpha(accent, 0.1),
            transform: 'translateX(4px)'
          }
        }}
      >
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            bgcolor: accent,
            flexShrink: 0,
            boxShadow: `0 0 0 2px ${alpha(accent, 0.2)}`
          }}
        />
        <Typography
          variant="body2"
          sx={{ fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
        >
          {item.id}
        </Typography>
        <Chip
          size="small"
          label={item.stato}
          color={isActive ? 'success' : 'default'}
          sx={{ height: 20, fontSize: '0.7rem', flexShrink: 0 }}
        />
      </Paper>
    );
  };

  const renderDialogList = (items, variant) => {
    const accent = variant === 'active' ? activeAccent : archivedAccent;

    if (!items.length) {
      return (
        <Alert severity="info" sx={{ mt: 2 }}>
          {variant === 'active'
            ? 'Nessuna commessa attiva nel periodo selezionato.'
            : 'Nessuna commessa archiviata disponibile.'}
        </Alert>
      );
    }

    return (
      <Stack spacing={1.25} sx={{ mt: 2 }}>
        {items.map((item) => (
          <Paper
            key={item.id}
            variant="outlined"
            sx={{
              p: 1.5,
              display: 'flex',
              flexDirection: 'column',
              gap: 0.75,
              borderLeft: `4px solid ${accent}`,
              bgcolor: alpha(accent, 0.08)
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {item.nome}
              </Typography>
              <Chip size="small" label={item.stato} color={variant === 'active' ? 'success' : 'default'} />
            </Stack>
            {item.parent && (
              <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                ↳ Parte di: {item.parent}
              </Typography>
            )}
            <Typography variant="caption" color="text.secondary">
              ID: {item.id}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              📅 {item.periodo}
            </Typography>
            <Stack direction="row" spacing={2} flexWrap="wrap">
              <Typography variant="caption" color="text.secondary">
                <strong>Cliente:</strong> {item.cliente}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                <strong>Responsabile:</strong> {item.responsabile}
              </Typography>
            </Stack>
          </Paper>
        ))}
      </Stack>
    );
  };

  const summarySections = [
    {
      key: 'active',
      title: `Commesse attive (${commesseDetails.active.length})`,
      items: commesseDetails.active
    }
  ];

  return (
    <>
      <Stack spacing={2}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          justifyContent="space-between"
          alignItems={{ xs: 'flex-start', sm: 'center' }}
        >
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Commesse e sottocommesse
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Panoramica rapida delle attività assegnate al dipendente.
            </Typography>
          </Box>
          <Button
            variant="contained"
            size="small"
            startIcon={<ViewListIcon />}
            onClick={() => openDialog()}
            disabled={!hasActiveCommesse && !hasArchivedCommesse}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              boxShadow: 2,
              background: (theme) => 
                `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              '&:hover': {
                boxShadow: 4,
                background: (theme) => 
                  `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`
              }
            }}
          >
            Elenco
          </Button>
        </Stack>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2
          }}
        >
          {summarySections.map(({ key, title, items }) => (
            <Paper
              key={key}
              variant="outlined"
              sx={{
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                gap: 1.5,
                minHeight: 280
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {title}
              </Typography>
              {items.length ? (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0.75,
                    maxHeight: 320,
                    overflow: 'auto',
                    pr: 0.5
                  }}
                >
                  {items.map((item) => renderSummaryCard(item, key))}
                </Box>
              ) : (
                <Alert severity="info" sx={{ flex: 1 }}>
                  {key === 'active'
                    ? 'Nessuna commessa attiva nel periodo selezionato.'
                    : 'Nessuna commessa archiviata disponibile.'}
                </Alert>
              )}
            </Paper>
          ))}
        </Box>
      </Stack>

      <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="md">
        <DialogTitle>Elenco dettagliato commesse</DialogTitle>
        <DialogContent dividers>
          <Tabs
            value={dialogTab}
            onChange={(_event, value) => setDialogTab(value)}
            variant="fullWidth"
            sx={{
              mb: 1,
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600
              }
            }}
          >
            <Tab value="active" label={`Attive (${commesseDetails.active.length})`} />
            <Tab value="archived" label={`Chiuse (${commesseDetails.archived.length})`} />
          </Tabs>
          {dialogTab === 'active'
            ? renderDialogList(commesseDetails.active, 'active')
            : renderDialogList(commesseDetails.archived, 'archived')}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Chiudi</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

ProjectsTab.propTypes = {
  commesseDetails: PropTypes.shape({
    active: PropTypes.array.isRequired,
    archived: PropTypes.array.isRequired
  }).isRequired,
  hasActiveCommesse: PropTypes.bool.isRequired,
  hasArchivedCommesse: PropTypes.bool.isRequired
};

function AbsencesTab({ analytics, hasAbsenceData, formatHours, mode }) {
  const theme = useTheme();

  if (!hasAbsenceData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
        <Alert severity="success" icon={<CheckCircleOutlineIcon />}>
          <strong>Perfetto!</strong>{' '}
          {mode === 'daily'
            ? 'Nessuna assenza registrata nella giornata selezionata.'
            : 'Nessuna assenza registrata nel periodo selezionato.'}
        </Alert>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'grid',
        gap: 2,
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, minmax(0, 1fr))'
        }
      }}
    >
      {analytics.absenceRows.map((row) => (
        <Paper
          key={row.code}
          variant="outlined"
          sx={{
            p: 2,
            borderColor: alpha(theme.palette[ABSENCE_CHIP_COLOR[row.code] || 'default'].main, 0.3),
            bgcolor: alpha(theme.palette[ABSENCE_CHIP_COLOR[row.code] || 'default'].main, 0.05),
            transition: 'all 0.2s',
            '&:hover': {
              bgcolor: alpha(theme.palette[ABSENCE_CHIP_COLOR[row.code] || 'default'].main, 0.1),
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
      ))}
    </Box>
  );
}

AbsencesTab.propTypes = {
  analytics: PropTypes.shape({
    absenceRows: PropTypes.array.isRequired
  }).isRequired,
  hasAbsenceData: PropTypes.bool.isRequired,
  formatHours: PropTypes.func.isRequired,
  mode: PropTypes.oneOf(['daily', 'period'])
};

AbsencesTab.defaultProps = {
  mode: 'period'
};

function HealthTab({ previousMonthStatus }) {
  const theme = useTheme();

  if (!previousMonthStatus) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
        <Alert severity="info">Nessun dato disponibile per valutare la completezza del mese precedente.</Alert>
      </Box>
    );
  }

  return (
    <Stack spacing={2}>
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
              <Typography variant="body2" color="text.secondary">
                Completezza del mese
              </Typography>
            </Box>
          </Stack>
          <Stack spacing={1.5}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" color="text.secondary">
                Percentuale completamento
              </Typography>
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
      
        {previousMonthStatus.missingCount > 0 ? (
          <Alert severity="warning" icon={<WarningAmberIcon />}>
            <Stack spacing={1}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Giorni mancanti: {previousMonthStatus.missingCount}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Alcuni giorni lavorativi non hanno ore registrate sufficienti (min 7.5h).
              </Typography>
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
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Mese completato ✓
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Tutte le giornate lavorative hanno ore registrate sufficienti. Ottimo lavoro!
              </Typography>
            </Stack>
          </Alert>
        )}
    </Stack>
  );
}

HealthTab.propTypes = {
  previousMonthStatus: PropTypes.shape({
    label: PropTypes.string.isRequired,
    isComplete: PropTypes.bool.isRequired,
    ratio: PropTypes.number.isRequired,
    missingCount: PropTypes.number.isRequired,
    missingSamples: PropTypes.arrayOf(PropTypes.string).isRequired
  })
};

HealthTab.defaultProps = {
  previousMonthStatus: null
};

function PanoramaCard({
  commessaTab,
  onCommessaTabChange,
  analytics,
  hasCommessaData,
  hasAbsenceData,
  commesseDetails,
  hasActiveCommesse,
  hasArchivedCommesse,
  previousMonthStatus,
  formatHours,
  insightTab
}) {
  return (
    <Paper elevation={0} sx={{ ...inspectorCardBaseSx }}>
      <Stack spacing={2}>
        <Typography variant="h6" sx={{ fontWeight: 600, letterSpacing: -0.4 }}>
          Panoramica attività
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {insightTab === 'daily'
            ? 'Indicatori riferiti alla giornata selezionata.'
            : 'Indicatori aggregati sul periodo attivo.'}
        </Typography>
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
            <OverviewTab
              analytics={analytics}
              hasCommessaData={hasCommessaData}
              formatHours={formatHours}
              mode={insightTab}
            />
          )}

          {commessaTab === 'archived' && (
            <ProjectsTab
              commesseDetails={commesseDetails}
              hasActiveCommesse={hasActiveCommesse}
              hasArchivedCommesse={hasArchivedCommesse}
            />
          )}

          {commessaTab === 'absences' && (
            <AbsencesTab
              analytics={analytics}
              hasAbsenceData={hasAbsenceData}
              formatHours={formatHours}
              mode={insightTab}
            />
          )}

          {commessaTab === 'health' && (
            <HealthTab previousMonthStatus={previousMonthStatus} />
          )}
        </Box>
      </Stack>
    </Paper>
  );
}

PanoramaCard.propTypes = {
  commessaTab: PropTypes.oneOf(['active', 'archived', 'absences', 'health']).isRequired,
  onCommessaTabChange: PropTypes.func.isRequired,
  analytics: PropTypes.shape({
    totalWorkHours: PropTypes.number,
    commessaRows: PropTypes.array,
    pieData: PropTypes.array,
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
  previousMonthStatus: PropTypes.shape({
    isComplete: PropTypes.bool,
    label: PropTypes.string,
    ratio: PropTypes.number,
    missingCount: PropTypes.number,
    missingSamples: PropTypes.arrayOf(PropTypes.string)
  }),
  formatHours: PropTypes.func.isRequired,
  insightTab: PropTypes.oneOf(['daily', 'period']).isRequired
};

PanoramaCard.defaultProps = {
  previousMonthStatus: null
};

export default PanoramaCard;
