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
  Autocomplete,
  Tooltip,
  Avatar,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { getCommessaColor, getCommessaColorLight } from '@shared/utils/commessaColors.js';

function Filters({
  search,
  onSearchChange,
  commessaOptions,
  selectedCommessa,
  onCommessaChange,
  summary,
}) {
  return (
    <Stack spacing={2.5}>
      <Stack spacing={0.75}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: 'common.white' }}>
          Personale e Assegnazioni
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
          Persone con attività recente: {summary.withTimesheet} su {summary.total}
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
};

function EmployeeList({ rows, onCommessaOpen }) {
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
                              cursor: 'pointer',
                            }}
                            clickable
                            onClick={() => onCommessaOpen?.(commessa.id)}
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
  onCommessaOpen: PropTypes.func,
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
  onCommessaOpen,
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
          <EmployeeList rows={rows} onCommessaOpen={onCommessaOpen} />
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
  onCommessaOpen: PropTypes.func,
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
  onCommessaOpen,
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
            onCommessaOpen={onCommessaOpen}
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
        onCommessaOpen={onCommessaOpen}
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
  onCommessaOpen: PropTypes.func,
};
