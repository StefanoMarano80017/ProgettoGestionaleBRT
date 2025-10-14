import React from 'react';
import PropTypes from 'prop-types';
import { Virtuoso } from 'react-virtuoso';
import {
  Paper,
  Stack,
  Typography,
  TextField,
  Chip,
  CircularProgress,
  Alert,
  Drawer,
  Button,
  Box,
  Card,
  CardContent,
  ToggleButton,
  ToggleButtonGroup,
  Autocomplete,
  Tooltip,
  Avatar,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { getCommessaColor, getCommessaColorLight } from '@shared/utils/commessaColors.js';

const PERIOD_OPTIONS = [
  { value: 'week', label: 'Settimana' },
  { value: 'month', label: 'Mese' },
  { value: 'quarter', label: 'Trimestre' },
  { value: 'year', label: 'Anno' },
];

function Filters({
  search,
  onSearchChange,
  commessaOptions,
  selectedCommessa,
  onCommessaChange,
  summary,
  periodMode,
  onPeriodModeChange,
}) {
  const activePeriod = PERIOD_OPTIONS.find((option) => option.value === periodMode)?.label ?? null;
  const activePeriodLabel = activePeriod ? activePeriod.toLowerCase() : 'periodo selezionato';
  return (
    <Stack spacing={2.5}>
      <Stack spacing={0.75}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: 'common.white' }}>
          Personale e Assegnazioni
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
          Nel periodo ({activePeriodLabel}): {summary.withTimesheet} persone attive su {summary.total} in elenco
        </Typography>
      </Stack>
      <Stack direction="row" spacing={1.5} alignItems="center">
        <TextField
          size="small"
          label="Cerca persona"
          value={search}
          onChange={(event) => onSearchChange?.(event.target.value)}
          sx={{ flex: 1 }}
        />
        <Autocomplete
          size="small"
          options={commessaOptions}
          value={selectedCommessa}
          onChange={(_, value) => onCommessaChange?.(value)}
          getOptionLabel={(option) => option?.label || ''}
          isOptionEqualToValue={(option, value) => option?.id === value?.id}
          renderInput={(params) => <TextField {...params} label="Filtra per commessa" placeholder="Seleziona commessa" />}
          sx={{ flex: 1 }}
        />
      </Stack>
      <ToggleButtonGroup
        value={periodMode}
        exclusive
        size="small"
        onChange={(_, value) => onPeriodModeChange?.(value || periodMode)}
        sx={{
          alignSelf: { xs: 'stretch', sm: 'flex-start' },
          '& .MuiToggleButton-root': {
            borderRadius: 1.5,
            px: 2,
            py: 0.75,
            fontWeight: 500,
            '&.Mui-selected': {
              bgcolor: 'rgba(25, 118, 210, 0.08)',
              color: 'primary.main',
              borderColor: 'primary.main',
              '&:hover': {
                bgcolor: 'rgba(25, 118, 210, 0.12)',
              },
            },
          },
        }}
      >
        {PERIOD_OPTIONS.map((option) => (
          <ToggleButton key={option.value} value={option.value}>
            {option.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Stack>
  );
}

Filters.propTypes = {
  search: PropTypes.string.isRequired,
  onSearchChange: PropTypes.func,
  commessaOptions: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.string, label: PropTypes.string })).isRequired,
  selectedCommessa: PropTypes.shape({ id: PropTypes.string, label: PropTypes.string }),
  onCommessaChange: PropTypes.func,
  summary: PropTypes.shape({ total: PropTypes.number, withTimesheet: PropTypes.number }).isRequired,
  periodMode: PropTypes.oneOf(['week', 'month', 'quarter', 'year']).isRequired,
  onPeriodModeChange: PropTypes.func,
};

function EmployeeList({ rows }) {
  const theme = useTheme();
  const containerSx = {
    flex: 1,
    minHeight: 0,
    height: '100%',
    bgcolor: (t) => (t.palette.mode === 'dark' ? t.palette.background.default : t.palette.grey[100]),
    borderRadius: 2,
    border: '1px solid',
    borderColor: 'divider',
    p: 2,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  };

  if (rows.length === 0) {
    return (
      <Box sx={containerSx}>
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            bgcolor: 'action.hover',
            borderRadius: 2,
            px: 3,
            py: 6,
          }}
        >
          <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
            Nessuna persona corrisponde ai filtri selezionati
          </Typography>
        </Box>
      </Box>
    );
  }

  const itemContent = (index) => {
    const row = rows[index];
    if (!row) return null;

    const first = (row.firstName || '').trim();
    const last = (row.lastName || '').trim();
    const nameParts = (row.name || '').trim().split(/\s+/).filter(Boolean);
    const initials = (first || last)
      ? `${first.charAt(0)}${last.charAt(0)}`.toUpperCase()
      : nameParts.length === 0
        ? (row.employeeId || '??').slice(0, 2).toUpperCase()
        : nameParts.length === 1
          ? nameParts[0].slice(0, 2).toUpperCase()
          : `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
    const seed = [first, last].filter(Boolean).join(' ') || row.name || row.employeeId || 'dipendente';
    const avatarBackground = getCommessaColor(seed);
    const avatarTextColor = theme.palette.getContrastText(avatarBackground);
    const assigned = Array.isArray(row.assigned) ? row.assigned : [];

    return (
      <Box sx={{ pb: index === rows.length - 1 ? 0 : 1.5 }}>
        <Card
          elevation={0}
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              borderColor: 'primary.main',
              boxShadow: 1,
            },
          }}
        >
          <CardContent
            sx={{
              p: 2,
              '&:last-child': { pb: 2 },
              display: 'flex',
              alignItems: 'center',
              minHeight: 86,
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%' }}>
              <Avatar
                sx={{
                  bgcolor: avatarBackground,
                  color: avatarTextColor,
                  width: 44,
                  height: 44,
                  fontSize: '1rem',
                  fontWeight: 600,
                  border: '2px solid rgba(0,0,0,0.14)',
                  flexShrink: 0,
                }}
              >
                {initials}
              </Avatar>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body1" sx={{ fontWeight: 700, flexShrink: 0 }}>
                  {row.name}
                </Typography>
                <Chip
                  size="small"
                  label={row.employeeId}
                  variant="outlined"
                  sx={{ height: 22, fontSize: '0.7rem', fontWeight: 600, borderRadius: 1.5, flexShrink: 0 }}
                />
                <Chip
                  size="small"
                  label={row.company || 'N/D'}
                  color="info"
                  variant="outlined"
                  sx={{ height: 22, fontSize: '0.7rem', fontWeight: 600, borderRadius: 1.5, flexShrink: 0 }}
                />
              </Stack>
              <Stack direction="row" spacing={0.75} alignItems="center" sx={{ flexShrink: 0, ml: 'auto' }}>
                {assigned.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    Nessuna commessa
                  </Typography>
                ) : (
                  <>
                    {assigned.slice(0, 3).map((commessa) => {
                      const color = getCommessaColor(commessa.code);
                      const background = getCommessaColorLight(commessa.code, 0.12);
                      return (
                        <Tooltip
                          key={`${row.employeeId}-${commessa.id}`}
                          title={`${commessa.label} · ${commessa.hours}h`}
                          arrow
                        >
                          <Chip
                            size="small"
                            label={`${commessa.code} · ${commessa.hours}h`}
                            sx={{
                              height: 22,
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              bgcolor: background,
                              color,
                              borderRadius: 1.5,
                            }}
                          />
                        </Tooltip>
                      );
                    })}
                    {assigned.length > 3 && (
                      <Tooltip
                        title={assigned.slice(3).map((c) => `${c.label} · ${c.hours}h`).join(', ')}
                        arrow
                      >
                        <Chip
                          size="small"
                          label={`+${assigned.length - 3}`}
                          variant="outlined"
                          sx={{
                            height: 22,
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            borderRadius: 1.5,
                          }}
                        />
                      </Tooltip>
                    )}
                  </>
                )}
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    );
  };

  return (
    <Box sx={containerSx}>
      <Virtuoso
        data={rows}
        style={{ width: '100%', flex: 1, height: '100%' }}
        itemContent={itemContent}
      />
    </Box>
  );
}

EmployeeList.propTypes = {
  rows: PropTypes.arrayOf(PropTypes.object).isRequired,
};

function PanelContent({
  loading,
  error,
  rows,
  summary,
  search,
  onSearchChange,
  commessaOptions,
  selectedCommessa,
  onCommessaChange,
  periodMode,
  onPeriodModeChange,
}) {
  return (
    <Box
      sx={{
        p: 3,
        width: '100%',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        minHeight: 0,
      }}
    >
      <Filters
        search={search}
        onSearchChange={onSearchChange}
        commessaOptions={commessaOptions}
        selectedCommessa={selectedCommessa}
        onCommessaChange={onCommessaChange}
        summary={summary}
        periodMode={periodMode}
        onPeriodModeChange={onPeriodModeChange}
      />
      {loading && (
        <Stack alignItems="center" justifyContent="center" sx={{ py: 4 }}>
          <CircularProgress size={28} />
        </Stack>
      )}
      {error && !loading && (
        <Alert severity="error">{error.message || 'Errore caricamento workload'}</Alert>
      )}
      {!loading && !error && (
        <Box sx={{ flex: 1, minHeight: 0 }}>
          <EmployeeList rows={rows} />
        </Box>
      )}
    </Box>
  );
}

PanelContent.propTypes = {
  loading: PropTypes.bool,
  error: PropTypes.object,
  rows: PropTypes.arrayOf(PropTypes.object).isRequired,
  summary: PropTypes.shape({ total: PropTypes.number, withTimesheet: PropTypes.number }).isRequired,
  search: PropTypes.string.isRequired,
  onSearchChange: PropTypes.func,
  commessaOptions: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.string, label: PropTypes.string })).isRequired,
  selectedCommessa: PropTypes.shape({ id: PropTypes.string, label: PropTypes.string }),
  onCommessaChange: PropTypes.func,
  periodMode: PropTypes.oneOf(['week', 'month', 'quarter', 'year']).isRequired,
  onPeriodModeChange: PropTypes.func,
};

export default function PeopleWorkloadView({
  loading,
  error,
  rows,
  summary,
  search,
  onSearchChange,
  commessaOptions,
  selectedCommessa,
  onCommessaChange,
  isMobile,
  drawerOpen,
  onToggleDrawer,
  onCloseDrawer,
  periodMode,
  onPeriodModeChange,
}) {
  if (isMobile) {
    return (
      <Box sx={{ width: '100%' }}>
        <Button variant="outlined" onClick={onToggleDrawer} fullWidth>
          {drawerOpen ? 'Chiudi workload' : 'Apri workload'}
        </Button>
        <Drawer anchor="right" open={drawerOpen} onClose={onCloseDrawer} PaperProps={{ sx: { width: 360 } }}>
          <PanelContent
            loading={loading}
            error={error}
            rows={rows}
            summary={summary}
            search={search}
            onSearchChange={onSearchChange}
            commessaOptions={commessaOptions}
            selectedCommessa={selectedCommessa}
            onCommessaChange={onCommessaChange}
            periodMode={periodMode}
            onPeriodModeChange={onPeriodModeChange}
          />
        </Drawer>
      </Box>
    );
  }

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        borderRadius: 3, 
        width: '100%', 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column', 
        border: '2px solid', 
        borderColor: 'divider',
        overflow: 'hidden',
        bgcolor: 'background.paper',
      }}
    >
      <PanelContent
        loading={loading}
        error={error}
        rows={rows}
        summary={summary}
        search={search}
        onSearchChange={onSearchChange}
        commessaOptions={commessaOptions}
        selectedCommessa={selectedCommessa}
        onCommessaChange={onCommessaChange}
        periodMode={periodMode}
        onPeriodModeChange={onPeriodModeChange}
      />
    </Paper>
  );
}

PeopleWorkloadView.propTypes = {
  loading: PropTypes.bool,
  error: PropTypes.object,
  rows: PropTypes.arrayOf(PropTypes.object).isRequired,
  summary: PropTypes.shape({ total: PropTypes.number, withTimesheet: PropTypes.number }).isRequired,
  search: PropTypes.string.isRequired,
  onSearchChange: PropTypes.func,
  commessaOptions: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.string, label: PropTypes.string })).isRequired,
  selectedCommessa: PropTypes.shape({ id: PropTypes.string, label: PropTypes.string }),
  onCommessaChange: PropTypes.func,
  isMobile: PropTypes.bool,
  drawerOpen: PropTypes.bool,
  onToggleDrawer: PropTypes.func,
  onCloseDrawer: PropTypes.func,
  periodMode: PropTypes.oneOf(['week', 'month', 'quarter', 'year']).isRequired,
  onPeriodModeChange: PropTypes.func,
};
