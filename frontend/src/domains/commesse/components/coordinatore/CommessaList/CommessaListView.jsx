import React from 'react';
import PropTypes from 'prop-types';
import {
  Paper,
  Stack,
  Typography,
  Tabs,
  Tab,
  Box,
  IconButton,
  Chip,
  Grid,
  Divider,
  CircularProgress,
  Alert,
  Tooltip,
  Card,
  CardContent,
  alpha,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import EventIcon from '@mui/icons-material/Event';
import PersonIcon from '@mui/icons-material/Person';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import BusinessIcon from '@mui/icons-material/Business';
import CategoryIcon from '@mui/icons-material/Category';
import DescriptionIcon from '@mui/icons-material/Description';
import { getCommessaColor, getCommessaColorLight } from '@shared/utils/commessaColors.js';
import CommessaAssignmentsContainer from './CommessaAssignmentsContainer.jsx';
import { getCommessa } from '@mocks/CommesseMock.js';

const INFO_TAB_ID = 'commessa-info';

const formatDate = (value) => {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const normalizeState = (value) => {
  const normalized = String(value || '').toLowerCase();
  if (normalized === 'attiva') return 'Attiva';
  if (normalized === 'chiusa') return 'Chiusa';
  if (normalized === 'sospesa') return 'Sospesa';
  return value || '—';
};

function InfoTabContent() {
  return (
    <Paper
      elevation={0}
      sx={{
        border: '2px dashed',
        borderColor: 'divider',
        borderRadius: 3,
        p: { xs: 3, md: 4 },
        bgcolor: 'background.default',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <Stack spacing={2.5} sx={{ maxWidth: 720 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <InfoOutlinedIcon color="primary" />
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Pannello dettagli commessa
          </Typography>
        </Stack>
        <Typography variant="body1" color="text.secondary">
          Seleziona una commessa dall'esplora commesse per aprire i dettagli oppure clicca sui badge delle commesse
          associati alle risorse nel pannello &ldquo;Esplora risorse&rdquo;. Ogni commessa si apre in una nuova scheda qui a lato,
          così puoi passare rapidamente da un dettaglio all'altro.
        </Typography>
        <Stack spacing={1.5}>
          <Stack spacing={0.5}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Cosa trovi nel dettaglio:</Typography>
            <Typography variant="body2" color="text.secondary">
              • Panoramica completa con stato, cliente, date e tag.<br />
              • Accesso rapido alle assegnazioni e agli strumenti per aggiungere o rimuovere risorse.<br />
              • Statistiche e attività aggiornate per mantenere il controllo operativo.
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Suggerimento: puoi aprire più commesse in parallelo. Usa le &ldquo;×&rdquo; sulle tab per chiuderle quando non ti servono più.
          </Typography>
        </Stack>
        <Typography variant="caption" color="text.disabled">
          Se non vedi commesse, verifica i filtri impostati nell'esplora.
        </Typography>
      </Stack>
    </Paper>
  );
}

function CommessaDetailPanel({ commessaId, summary, onRefresh }) {
  const [detail, setDetail] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  const loadDetail = React.useCallback(() => {
    if (!commessaId) return;
    setLoading(true);
    setError(null);
    getCommessa(commessaId)
      .then((data) => {
        setDetail(data);
      })
      .catch((err) => {
        setError(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [commessaId]);

  React.useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  const meta = detail || summary || {};
  const stateLabel = normalizeState(meta.stato);
  const tags = Array.isArray(meta.tags) ? meta.tags : summary?.tags || [];
  const colorSeed = meta.codice || summary?.codice || meta.nome || summary?.nome || commessaId;
  const commessaColor = getCommessaColor(colorSeed);

  return (
    <Stack spacing={3} sx={{ flex: 1, minHeight: 0, p: 3 }}>
      {loading ? (
        <Stack alignItems="center" justifyContent="center" sx={{ py: 8 }}>
          <CircularProgress size={32} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Caricamento dettagli...
          </Typography>
        </Stack>
      ) : error ? (
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          {error.message || 'Impossibile caricare i dettagli della commessa'}
        </Alert>
      ) : (
        <>
          {/* Header Section */}
          <Stack spacing={2}>
            {/* Title and Status */}
            <Box>
              <Stack direction="row" spacing={1.5} alignItems="flex-start" flexWrap="wrap" useFlexGap>
                <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary', flex: 1, minWidth: 200 }}>
                  {meta.nome || meta.displayLabel || meta.codice}
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                  <Chip
                    label={meta.codice}
                    size="medium"
                    sx={{
                      fontWeight: 700,
                      bgcolor: getCommessaColorLight(meta.codice || meta.nome, 0.15),
                      color: getCommessaColor(meta.codice || meta.nome),
                      border: '2px solid',
                      borderColor: getCommessaColor(meta.codice || meta.nome),
                      fontSize: '0.875rem',
                      px: 1,
                    }}
                  />
                  <Chip
                    label={stateLabel}
                    size="medium"
                    color={stateLabel === 'Attiva' ? 'success' : 'default'}
                    sx={{ fontWeight: 700, fontSize: '0.875rem', px: 1 }}
                  />
                </Stack>
              </Stack>
              {tags.length > 0 && (
                <Stack direction="row" spacing={0.75} sx={{ mt: 1.5 }} flexWrap="wrap" useFlexGap>
                  {tags.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      size="small"
                      variant="outlined"
                      sx={{ fontWeight: 500, borderRadius: 1.5 }}
                    />
                  ))}
                </Stack>
              )}
            </Box>

            <Divider />

            {/* Info Grid - Cleaner 2-row layout */}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Stack spacing={0.75}>
                  <Stack direction="row" spacing={0.75} alignItems="center">
                    <BusinessIcon fontSize="small" sx={{ color: 'primary.main' }} />
                    <Typography
                      variant="caption"
                      sx={{
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                        fontWeight: 700,
                        color: 'text.secondary',
                      }}
                    >
                      Cliente
                    </Typography>
                  </Stack>
                  <Typography variant="body1" sx={{ fontWeight: 600, pl: 3 }}>
                    {meta.cliente || '—'}
                  </Typography>
                </Stack>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Stack spacing={0.75}>
                  <Stack direction="row" spacing={0.75} alignItems="center">
                    <CategoryIcon fontSize="small" sx={{ color: 'primary.main' }} />
                    <Typography
                      variant="caption"
                      sx={{
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                        fontWeight: 700,
                        color: 'text.secondary',
                      }}
                    >
                      Tipologia
                    </Typography>
                  </Stack>
                  <Typography variant="body1" sx={{ fontWeight: 600, pl: 3 }}>
                    {Array.isArray(meta.tipo) && meta.tipo.length ? meta.tipo.join(' • ') : '—'}
                  </Typography>
                </Stack>
              </Grid>
              <Grid item xs={6} sm={6} md={3}>
                <Stack spacing={0.75}>
                  <Stack direction="row" spacing={0.75} alignItems="center">
                    <EventIcon fontSize="small" sx={{ color: 'success.main' }} />
                    <Typography
                      variant="caption"
                      sx={{
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                        fontWeight: 700,
                        color: 'text.secondary',
                      }}
                    >
                      Inizio
                    </Typography>
                  </Stack>
                  <Typography variant="body1" sx={{ fontWeight: 600, pl: 3 }}>
                    {formatDate(meta.dataInizio || meta.createdAt)}
                  </Typography>
                </Stack>
              </Grid>
              <Grid item xs={6} sm={6} md={3}>
                <Stack spacing={0.75}>
                  <Stack direction="row" spacing={0.75} alignItems="center">
                    <EventIcon fontSize="small" sx={{ color: 'error.main' }} />
                    <Typography
                      variant="caption"
                      sx={{
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                        fontWeight: 700,
                        color: 'text.secondary',
                      }}
                    >
                      Fine
                    </Typography>
                  </Stack>
                  <Typography variant="body1" sx={{ fontWeight: 600, pl: 3 }}>
                    {formatDate(meta.dataFine)}
                  </Typography>
                </Stack>
              </Grid>
            </Grid>

            {meta.descrizione && (
              <>
                <Divider />
                <Stack spacing={1}>
                  <Stack direction="row" spacing={0.75} alignItems="center">
                    <DescriptionIcon fontSize="small" sx={{ color: 'primary.main' }} />
                    <Typography
                      variant="caption"
                      sx={{
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                        fontWeight: 700,
                        color: 'text.secondary',
                      }}
                    >
                      Descrizione
                    </Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7, pl: 3 }}>
                    {meta.descrizione}
                  </Typography>
                </Stack>
              </>
            )}
          </Stack>

          <Divider sx={{ my: 1 }} />

          {/* Assignments Section */}
          <Card
            elevation={0}
            sx={{
              borderRadius: 2.5,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.default',
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <CommessaAssignmentsContainer
                key={`assignments-${commessaId}`}
                commessaId={commessaId}
                commessaMeta={meta}
                onAssignmentsChange={onRefresh}
              />
            </CardContent>
          </Card>
        </>
      )}
    </Stack>
  );
}

CommessaDetailPanel.propTypes = {
  commessaId: PropTypes.string.isRequired,
  summary: PropTypes.object,
  onRefresh: PropTypes.func,
};

export default function CommessaListView({
  commessaMap,
  tabs,
  activeTabId,
  onChangeTab,
  onCloseTab,
  onRefresh,
  error,
}) {
  const enrichedTabs = React.useMemo(() => (
    tabs.map((tab) => {
      if (tab.kind !== 'commessa') {
        return { ...tab, label: 'Come funziona', summary: null };
      }
      const summary = commessaMap.get(tab.commessaId) || null;
      const labelBase = summary?.codice || tab.commessaId;
      const labelName = summary?.nome && summary.nome !== summary.codice ? ` · ${summary.nome}` : '';
      return {
        ...tab,
        label: `${labelBase}${labelName}`,
        summary,
      };
    })
  ), [tabs, commessaMap]);

  const value = React.useMemo(() => {
    const exists = enrichedTabs.some((tab) => tab.id === activeTabId);
    return exists ? activeTabId : enrichedTabs[0]?.id ?? INFO_TAB_ID;
  }, [enrichedTabs, activeTabId]);

  const handleTabChange = (_, next) => {
    if (!next) return;
    onChangeTab?.(next);
  };

  const handleClose = (event, tabId) => {
    event.stopPropagation();
    onCloseTab?.(tabId);
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: 3,
        width: '100%',
        height: '100%',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 2.5,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        overflow: 'hidden',
      }}
    >
      <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
        <Stack direction="row" spacing={1} alignItems="center">
          <PersonIcon sx={{ color: 'primary.main' }} />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Dettaglio commessa
          </Typography>
        </Stack>
        <Stack direction="row" spacing={1} alignItems="center">
          <Tooltip title="Ogni scheda corrisponde a una commessa aperta dal pannello di esplorazione o dal workload.">
            <InfoOutlinedIcon fontSize="small" color="action" />
          </Tooltip>
        </Stack>
      </Stack>
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          borderRadius: 2,
          bgcolor: 'customBackground.default',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Tabs
          value={value}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{
            px: 2,
            '& .MuiTab-root': {
              borderRadius: 2,
              minHeight: 44,
              textTransform: 'none',
              fontWeight: 600,
              transition: 'background-color 0.2s ease, color 0.2s ease',
              mr: 1,
            },
          }}
        >
          {enrichedTabs.map((tab) => (
            <Tab
              key={tab.id}
              value={tab.id}
              disableRipple
              iconPosition="end"
              label={(
                <Stack direction="row" spacing={0.75} alignItems="center">
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: tab.id === value ? 700 : 500, color: 'inherit' }}
                  >
                    {tab.label}
                  </Typography>
                  {tab.kind === 'commessa' && (
                    <IconButton
                      size="small"
                      onClick={(event) => handleClose(event, tab.id)}
                      sx={{ ml: 0.25, color: 'inherit', '&:hover': { bgcolor: 'transparent' } }}
                    >
                      <CloseIcon fontSize="inherit" />
                    </IconButton>
                  )}
                </Stack>
              )}
              sx={() => {
                if (tab.kind !== 'commessa') {
                  return {
                    alignItems: 'center',
                    bgcolor: 'customBackground.main',
                    color: 'text.secondary',
                    '&.Mui-selected': {
                      bgcolor: 'background.default',
                      color: 'text.primary',
                    },
                    '&:hover': {
                      bgcolor: 'background.default',
                    },
                  };
                }

                const colorSeed = tab.summary?.codice || tab.summary?.nome || tab.commessaId;
                const tabColor = getCommessaColor(colorSeed);

                return {
                  alignItems: 'center',
                  bgcolor: 'customBackground.main',
                  color: 'text.secondary',
                  '&.Mui-selected': {
                    bgcolor: alpha(tabColor, 0.18),
                    color: tabColor,
                    boxShadow: `0 0 0 1px ${alpha(tabColor, 0.24)}`,
                  },
                  '&.Mui-selected .MuiIconButton-root': {
                    color: tabColor,
                  },
                  '&:hover': {
                    bgcolor: alpha(tabColor, 0.12),
                  },
                  '&.Mui-selected:hover': {
                    bgcolor: alpha(tabColor, 0.24),
                  },
                };
              }}
            />
          ))}
        </Tabs>
        {error && (
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            {error.message || 'Errore caricamento commesse'}
          </Alert>
        )}
        <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
          {enrichedTabs.map((tab) => (
            <Box
              key={`pane-${tab.id}`}
              role="tabpanel"
              hidden={tab.id !== value}
              sx={{ height: '100%' }}
            >
              {tab.id === INFO_TAB_ID ? (
                <InfoTabContent />
              ) : (
                <CommessaDetailPanel
                  commessaId={tab.commessaId}
                  summary={tab.summary}
                  onRefresh={onRefresh}
                />
              )}
            </Box>
          ))}
        </Box>
      </Box>
    </Paper>
  );
}

CommessaListView.propTypes = {
  commessaMap: PropTypes.instanceOf(Map).isRequired,
  tabs: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    kind: PropTypes.oneOf(['info', 'commessa']).isRequired,
    commessaId: PropTypes.string,
  })).isRequired,
  activeTabId: PropTypes.string.isRequired,
  onChangeTab: PropTypes.func,
  onCloseTab: PropTypes.func,
  onRefresh: PropTypes.func,
  error: PropTypes.object,
};
