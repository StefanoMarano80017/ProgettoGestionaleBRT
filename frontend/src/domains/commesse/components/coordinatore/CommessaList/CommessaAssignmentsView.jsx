import React from 'react';
import PropTypes from 'prop-types';
import {
  Stack,
  Typography,
  TextField,
  Select,
  MenuItem,
  Checkbox,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Button,
  Chip,
  IconButton,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import LaunchIcon from '@mui/icons-material/Launch';
import { DISCIPLINES, DISCIPLINE_LABEL } from '@shared/utils/discipline.js';

const formatName = (employee) => `${employee.nome ?? ''} ${employee.cognome ?? ''}`.trim() || employee.id;

const normalizeState = (value) => String(value || '').toLowerCase();

export default function CommessaAssignmentsView({
  loading,
  error,
  mutating,
  commessa,
  details,
  availableEmployees,
  assignedEmployees,
  selection,
  onSelectionChange,
  disciplines,
  onDisciplineChange,
  search,
  onSearchChange,
  onAssign,
  onRemoveEmployee,
  onOpenTimesheet,
  snack,
  onCloseSnack,
}) {
  const isClosed = normalizeState(commessa?.stato) === 'chiusa' || normalizeState(details?.stato) === 'chiusa';

  const handleToggleCandidate = (employeeId) => {
    if (!onSelectionChange) return;
    const set = new Set(selection);
    if (set.has(employeeId)) {
      set.delete(employeeId);
    } else {
      set.add(employeeId);
    }
    onSelectionChange(Array.from(set));
  };

  const handleDisciplineSelect = (event) => {
    onDisciplineChange?.(event.target.value);
  };

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={1} alignItems="center">
        <Typography variant="subtitle2">Assegna persone</Typography>
        {isClosed && <Chip size="small" label="Commessa chiusa" color="default" />}
      </Stack>
      {loading ? (
        <Stack alignItems="center" justifyContent="center" sx={{ py: 4 }}>
          <CircularProgress size={28} />
        </Stack>
      ) : error ? (
        <Alert severity="error">{error.message || 'Impossibile caricare i dettagli'}</Alert>
      ) : (
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="stretch">
          <Paper variant="outlined" sx={{ flex: 1, p: 2, borderRadius: 2 }}>
            <Stack spacing={2}>
              <TextField
                label="Cerca dipendenti"
                size="small"
                value={search}
                onChange={(event) => onSearchChange?.(event.target.value)}
              />
              <Select
                multiple
                size="small"
                value={disciplines}
                onChange={handleDisciplineSelect}
                renderValue={(selected) => selected.map((code) => DISCIPLINE_LABEL[code] || code).join(', ') || 'Tutte le discipline'}
              >
                {DISCIPLINES.map((code) => (
                  <MenuItem key={code} value={code}>
                    <Checkbox checked={disciplines.includes(code)} size="small" />
                    {DISCIPLINE_LABEL[code]}
                  </MenuItem>
                ))}
              </Select>
              <List dense sx={{ maxHeight: 260, overflowY: 'auto', border: (theme) => `1px solid ${theme.palette.divider}`, borderRadius: 1 }}>
                {availableEmployees.length === 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 1.5, px: 2 }}>
                    Nessun candidato disponibile
                  </Typography>
                )}
                {availableEmployees.map((employee) => {
                  const checked = selection.includes(employee.id);
                  return (
                    <ListItemButton
                      key={employee.id}
                      onClick={() => handleToggleCandidate(employee.id)}
                      dense
                      selected={checked}
                    >
                      <Checkbox edge="start" size="small" checked={checked} tabIndex={-1} disableRipple />
                      <ListItemText
                        primary={formatName(employee)}
                        secondary={DISCIPLINE_LABEL[employee.discipline] || employee.discipline || 'Disciplina n/d'}
                      />
                    </ListItemButton>
                  );
                })}
              </List>
              <Button
                variant="contained"
                onClick={onAssign}
                disabled={selection.length === 0 || mutating || isClosed}
              >
                Assegna selezionati
              </Button>
            </Stack>
          </Paper>
          <Paper variant="outlined" sx={{ flex: 1, p: 2, borderRadius: 2 }}>
            <Stack spacing={1.5}>
              <Typography variant="subtitle2">Assegnati ({assignedEmployees.length})</Typography>
              <List dense sx={{ maxHeight: 260, overflowY: 'auto' }}>
                {assignedEmployees.length === 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 1.5 }}>
                    Nessuna risorsa assegnata
                  </Typography>
                )}
                {assignedEmployees.map((employee) => (
                  <Stack
                    key={employee.id}
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{ p: 1, borderRadius: 1, '&:hover': { bgcolor: 'action.hover' } }}
                  >
                    <Stack spacing={0.5}>
                      <Typography variant="body2">{formatName(employee)}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {DISCIPLINE_LABEL[employee.discipline] || employee.discipline || 'Disciplina n/d'}
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={1}>
                      <IconButton
                        size="small"
                        onClick={() => onOpenTimesheet?.(employee.id)}
                        aria-label="Apri timesheet"
                      >
                        <LaunchIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => onRemoveEmployee?.(employee.id)}
                        disabled={mutating}
                        aria-label="Rimuovi assegnazione"
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </Stack>
                ))}
              </List>
            </Stack>
          </Paper>
        </Stack>
      )}
      <Snackbar open={snack.open} autoHideDuration={3000} onClose={onCloseSnack} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snack.severity} onClose={onCloseSnack} variant="filled">
          {snack.message}
        </Alert>
      </Snackbar>
    </Stack>
  );
}

CommessaAssignmentsView.propTypes = {
  loading: PropTypes.bool,
  error: PropTypes.object,
  mutating: PropTypes.bool,
  commessa: PropTypes.object,
  details: PropTypes.object,
  availableEmployees: PropTypes.arrayOf(PropTypes.object).isRequired,
  assignedEmployees: PropTypes.arrayOf(PropTypes.object).isRequired,
  selection: PropTypes.arrayOf(PropTypes.string).isRequired,
  onSelectionChange: PropTypes.func,
  disciplines: PropTypes.arrayOf(PropTypes.string).isRequired,
  onDisciplineChange: PropTypes.func,
  search: PropTypes.string.isRequired,
  onSearchChange: PropTypes.func,
  onAssign: PropTypes.func,
  onRemoveEmployee: PropTypes.func,
  onOpenTimesheet: PropTypes.func,
  snack: PropTypes.shape({ open: PropTypes.bool, message: PropTypes.string, severity: PropTypes.string }).isRequired,
  onCloseSnack: PropTypes.func,
};
