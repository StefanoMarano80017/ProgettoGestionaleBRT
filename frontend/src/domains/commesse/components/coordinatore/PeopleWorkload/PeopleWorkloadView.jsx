import React from 'react';
import PropTypes from 'prop-types';
import {
  Paper,
  Stack,
  Typography,
  TextField,
  Select,
  MenuItem,
  Checkbox,
  Chip,
  ToggleButtonGroup,
  ToggleButton,
  Table,
  TableContainer,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  LinearProgress,
  CircularProgress,
  Alert,
  Drawer,
  Button,
  Box,
} from '@mui/material';
import { DISCIPLINES, DISCIPLINE_LABEL } from '@shared/utils/discipline.js';

const SORT_OPTIONS = [
  { value: 'utilization', label: 'Utilizzo' },
  { value: 'name', label: 'Nome' },
  { value: 'nonWork', label: 'Ore non lavoro' },
];

function PanelContent({
  loading,
  error,
  rows,
  summary,
  disciplines,
  onDisciplineChange,
  search,
  onSearchChange,
  sortBy,
  onSortChange,
}) {
  return (
    <Stack spacing={2} sx={{ p: 2, width: '100%' }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h6">Persone per disciplina</Typography>
        <Stack direction="row" spacing={1}>
          <Chip size="small" label={`Totale ${summary.total}`} />
          <Chip size="small" label={`Con timesheet ${summary.withTimesheet}`} color="primary" variant="outlined" />
        </Stack>
      </Stack>
      <Stack spacing={1.5}>
        <TextField
          size="small"
          label="Cerca per nome"
          value={search}
          onChange={(event) => onSearchChange?.(event.target.value)}
        />
        <Select
          multiple
          size="small"
          value={disciplines}
          onChange={(event) => onDisciplineChange?.(event.target.value)}
          renderValue={(selected) => selected.map((code) => DISCIPLINE_LABEL[code] || code).join(', ') || 'Tutte le discipline'}
        >
          {DISCIPLINES.map((code) => (
            <MenuItem key={code} value={code}>
              <Checkbox checked={disciplines.includes(code)} size="small" />
              {DISCIPLINE_LABEL[code]}
            </MenuItem>
          ))}
        </Select>
        <ToggleButtonGroup
          value={sortBy}
          exclusive
          size="small"
          onChange={(_, value) => value && onSortChange?.(value)}
        >
          {SORT_OPTIONS.map((option) => (
            <ToggleButton key={option.value} value={option.value}>
              {option.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Stack>
      {loading && (
        <Stack alignItems="center" justifyContent="center" sx={{ py: 4 }}>
          <CircularProgress size={28} />
        </Stack>
      )}
      {error && !loading && (
        <Alert severity="error">{error.message || 'Errore caricamento workload'}</Alert>
      )}
      {!loading && !error && (
        <TableContainer sx={{ maxHeight: 560 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Persona</TableCell>
                <TableCell>Disciplina</TableCell>
                <TableCell sx={{ width: 160 }}>Utilizzo</TableCell>
                <TableCell align="right">Ore lavoro</TableCell>
                <TableCell align="right">Ore non lavoro</TableCell>
                <TableCell align="right">Giorni attivi</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                      Nessun dato disponibile per il periodo selezionato
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
              {rows.map((row) => (
                <TableRow key={row.employeeId} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{row.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{row.employeeId}</Typography>
                  </TableCell>
                  <TableCell>{row.disciplineLabel}</TableCell>
                  <TableCell>
                    <Stack spacing={0.5}>
                      <LinearProgress variant="determinate" value={row.utilizationPercent} sx={{ height: 6, borderRadius: 1 }} />
                      <Typography variant="caption" color="text.secondary">{row.utilizationPercent}%</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell align="right">{row.workHours}</TableCell>
                  <TableCell align="right">{row.nonWorkHours}</TableCell>
                  <TableCell align="right">{row.distinctDays}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Stack>
  );
}

PanelContent.propTypes = {
  loading: PropTypes.bool,
  error: PropTypes.object,
  rows: PropTypes.arrayOf(PropTypes.object).isRequired,
  summary: PropTypes.shape({ total: PropTypes.number, withTimesheet: PropTypes.number }).isRequired,
  disciplines: PropTypes.arrayOf(PropTypes.string).isRequired,
  onDisciplineChange: PropTypes.func,
  search: PropTypes.string.isRequired,
  onSearchChange: PropTypes.func,
  sortBy: PropTypes.string.isRequired,
  onSortChange: PropTypes.func,
};

export default function PeopleWorkloadView({
  loading,
  error,
  rows,
  summary,
  disciplines,
  onDisciplineChange,
  search,
  onSearchChange,
  sortBy,
  onSortChange,
  isMobile,
  drawerOpen,
  onToggleDrawer,
  onCloseDrawer,
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
            disciplines={disciplines}
            onDisciplineChange={onDisciplineChange}
            search={search}
            onSearchChange={onSearchChange}
            sortBy={sortBy}
            onSortChange={onSortChange}
          />
        </Drawer>
      </Box>
    );
  }

  return (
    <Paper elevation={1} sx={{ borderRadius: 2, width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <PanelContent
        loading={loading}
        error={error}
        rows={rows}
        summary={summary}
        disciplines={disciplines}
        onDisciplineChange={onDisciplineChange}
        search={search}
        onSearchChange={onSearchChange}
        sortBy={sortBy}
        onSortChange={onSortChange}
      />
    </Paper>
  );
}

PeopleWorkloadView.propTypes = {
  loading: PropTypes.bool,
  error: PropTypes.object,
  rows: PropTypes.arrayOf(PropTypes.object).isRequired,
  summary: PropTypes.shape({ total: PropTypes.number, withTimesheet: PropTypes.number }).isRequired,
  disciplines: PropTypes.arrayOf(PropTypes.string).isRequired,
  onDisciplineChange: PropTypes.func,
  search: PropTypes.string.isRequired,
  onSearchChange: PropTypes.func,
  sortBy: PropTypes.string.isRequired,
  onSortChange: PropTypes.func,
  isMobile: PropTypes.bool,
  drawerOpen: PropTypes.bool,
  onToggleDrawer: PropTypes.func,
  onCloseDrawer: PropTypes.func,
};
