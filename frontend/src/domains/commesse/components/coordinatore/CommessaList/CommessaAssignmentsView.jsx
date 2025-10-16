import React from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Stack,
  Typography,
  TextField,
  Autocomplete,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Button,
  Checkbox,
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

const assignmentShape = PropTypes.shape({
  code: PropTypes.string.isRequired,
});

const columnSx = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  minHeight: 0,
};

function LoadingState() {
  return (
    <Stack alignItems="center" justifyContent="center" sx={{ py: 6 }}>
      <CircularProgress size={24} />
    </Stack>
  );
}

function ErrorState({ message }) {
  return <Alert severity="error">{message || 'Impossibile caricare i dettagli della commessa'}</Alert>;
}

ErrorState.propTypes = {
  message: PropTypes.string,
};

function AvailableCandidatesPanel({
  availableEmployees,
  selection,
  search,
  onSearchChange,
  disciplineFilter,
  onDisciplineFilterChange,
  disciplineOptions,
  onToggleCandidate,
  interactionDisabled,
  onAssign,
  assignmentValue,
  onAssignmentValueChange,
}) {
  const hasSelection = selection.length > 0;
  const assignmentOptions = React.useMemo(() => (
    (disciplineOptions || []).map((option) => {
      if (typeof option === 'string') {
        return DISCIPLINE_LABEL[option] || option;
      }
      return option.label || option.value || option;
    })
  ), [disciplineOptions]);

  const handleAssignmentChange = (_, newValue) => {
    onAssignmentValueChange?.((newValue || '').trimStart());
  };

  const handleAssignmentInputChange = (_, newValue) => {
    onAssignmentValueChange?.(newValue || '');
  };

  const assignmentDisabled = interactionDisabled || !hasSelection || !(assignmentValue || '').trim();

  return (
    <Stack spacing={2} sx={{ flex: 1 }}>
      <Stack spacing={0.5}>
        <Typography
          variant="subtitle1"
          sx={{ fontWeight: 700, color: 'common.white', bgcolor: 'primary.main', px: 1.75, py: 0.75, borderRadius: 1.5 }}
        >
          Candidati disponibili
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Seleziona uno o più dipendenti per aggiungerli alla commessa.
        </Typography>
      </Stack>
      <TextField
        label="Cerca dipendenti"
        size="small"
        value={search}
        onChange={(event) => onSearchChange?.(event.target.value)}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 1.5,
          },
        }}
      />
      <Autocomplete
        size="small"
        value={disciplineFilter || null}
        onChange={(event, newValue) => onDisciplineFilterChange?.(newValue || '')}
        options={disciplineOptions}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 1.5,
          },
        }}
        getOptionLabel={(option) => {
          if (typeof option === 'string') {
            return DISCIPLINE_LABEL[option] || option;
          }
          return option.label || option.value || option;
        }}
        isOptionEqualToValue={(option, value) => {
          const optionValue = typeof option === 'string' ? option : option.value;
          const currentValue = typeof value === 'string' ? value : value?.value;
          return optionValue === currentValue;
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Filtra per disciplina"
            placeholder="Tutte le discipline"
          />
        )}
      />
      <List
        dense
        sx={{
          flex: 1,
          overflowY: 'auto',
          border: (theme) => `1px solid ${theme.palette.divider}`,
          borderRadius: 1.5,
          bgcolor: 'background.default',
          minHeight: 260,
        }}
      >
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
              onClick={() => onToggleCandidate?.(employee.id)}
              dense
              selected={checked}
              disabled={interactionDisabled}
            >
              <Checkbox
                edge="start"
                size="small"
                checked={checked}
                tabIndex={-1}
                disableRipple
                disabled={interactionDisabled}
              />
              <ListItemText
                disableTypography
                primary={
                  <Typography variant="body2" sx={{ fontWeight: checked ? 600 : 500 }}>
                    {formatName(employee)}
                  </Typography>
                }
                secondary={
                  <Typography variant="caption" color="text.secondary">
                    Matricola: {employee.id}
                  </Typography>
                }
              />
            </ListItemButton>
          );
        })}
      </List>
      <Autocomplete
        freeSolo
        size="small"
        options={assignmentOptions}
        value={assignmentValue}
        inputValue={assignmentValue}
        onInputChange={handleAssignmentInputChange}
        onChange={handleAssignmentChange}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Disciplina o attività assegnata"
            placeholder="Es. Meccanica, Progettazione BIM"
          />
        )}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 1.5,
          },
        }}
      />
      {onAssign && (
        <Button
          variant="contained"
          size="small"
          onClick={() => onAssign(assignmentValue)}
          disabled={assignmentDisabled}
          sx={{ alignSelf: 'flex-end' }}
        >
          Assegna selezionati
        </Button>
      )}
    </Stack>
  );
}

AvailableCandidatesPanel.propTypes = {
  availableEmployees: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    nome: PropTypes.string,
    cognome: PropTypes.string,
  })).isRequired,
  selection: PropTypes.arrayOf(PropTypes.string).isRequired,
  search: PropTypes.string.isRequired,
  onSearchChange: PropTypes.func,
  disciplineFilter: PropTypes.string,
  onDisciplineFilterChange: PropTypes.func,
  disciplineOptions: PropTypes.array.isRequired,
  onToggleCandidate: PropTypes.func,
  interactionDisabled: PropTypes.bool,
  onAssign: PropTypes.func,
  assignmentValue: PropTypes.string,
  onAssignmentValueChange: PropTypes.func,
};

AvailableCandidatesPanel.defaultProps = {
  onSearchChange: undefined,
  disciplineFilter: '',
  onDisciplineFilterChange: undefined,
  onToggleCandidate: undefined,
  interactionDisabled: false,
  onAssign: undefined,
  assignmentValue: '',
  onAssignmentValueChange: undefined,
};

function AssignedEmployeesPanel({ assignedEmployees, mutating, isClosed, onOpenTimesheet, onRemoveEmployee }) {
  const disableActions = mutating || isClosed;

  return (
    <Stack spacing={2} sx={{ flex: 1 }}>
      <Typography
        variant="subtitle1"
        sx={{ fontWeight: 700, color: 'common.white', bgcolor: 'primary.main', px: 1.75, py: 0.75, borderRadius: 1.5 }}
      >
        Risorse assegnate ({assignedEmployees.length})
      </Typography>
      <List
        dense
        sx={{
          flex: 1,
          overflowY: 'auto',
          bgcolor: 'background.default',
          borderRadius: 1.5,
          p: 1,
          minHeight: 200,
        }}
      >
        {assignedEmployees.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ py: 1.5, px: 1.5 }}>
            Nessuna risorsa assegnata
          </Typography>
        )}
        {assignedEmployees.map((employee) => (
          <ListItem
            key={employee.id}
            disableGutters
            sx={{ px: 0, py: 0.5 }}
          >
            <Stack
              spacing={0.75}
              sx={{
                width: '100%',
                p: 1,
                borderRadius: 1,
                border: (theme) => `1px solid ${theme.palette.divider}`,
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {formatName(employee)}
                </Typography>
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
                    disabled={disableActions}
                    aria-label="Rimuovi assegnazione"
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Stack>
              </Stack>
              {employee.assignmentLabel && (
                <Typography variant="caption" color="primary.main" sx={{ fontWeight: 600 }}>
                  Attività: {employee.assignmentLabel}
                </Typography>
              )}
              <Typography variant="caption" color="text.secondary">
                Disciplina: {employee.disciplineLabel || DISCIPLINE_LABEL[employee.discipline] || employee.discipline || 'N/D'}
              </Typography>
            </Stack>
          </ListItem>
        ))}
      </List>
    </Stack>
  );
}

AssignedEmployeesPanel.propTypes = {
  assignedEmployees: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    nome: PropTypes.string,
    cognome: PropTypes.string,
    assignments: PropTypes.arrayOf(assignmentShape),
    discipline: PropTypes.string,
    disciplineLabel: PropTypes.string,
    assignmentLabel: PropTypes.string,
  })).isRequired,
  mutating: PropTypes.bool,
  isClosed: PropTypes.bool,
  onOpenTimesheet: PropTypes.func,
  onRemoveEmployee: PropTypes.func,
};

AssignedEmployeesPanel.defaultProps = {
  mutating: false,
  isClosed: false,
  onOpenTimesheet: undefined,
  onRemoveEmployee: undefined,
};

function AssignmentsContent({
  loading,
  error,
  availableEmployees,
  assignedEmployees,
  selection,
  onToggleCandidate,
  search,
  onSearchChange,
  disciplineFilter,
  onDisciplineFilterChange,
  disciplineOptions,
  isClosed,
  mutating,
  onOpenTimesheet,
  onRemoveEmployee,
  onAssign,
  assignmentValue,
  onAssignmentValueChange,
}) {
  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState message={error.message} />;
  }

  return (
    <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} sx={{ width: '100%', flex: 1, minHeight: 0 }}>
      <Box sx={{ ...columnSx, gap: 2 }}>
        <AvailableCandidatesPanel
          availableEmployees={availableEmployees}
          selection={selection}
          search={search}
          onSearchChange={onSearchChange}
          disciplineFilter={disciplineFilter}
          onDisciplineFilterChange={onDisciplineFilterChange}
          disciplineOptions={disciplineOptions}
          onToggleCandidate={onToggleCandidate}
          interactionDisabled={isClosed || mutating}
          onAssign={onAssign}
          assignmentValue={assignmentValue}
          onAssignmentValueChange={onAssignmentValueChange}
        />
      </Box>
      <Box sx={{ ...columnSx, gap: 2 }}>
        <AssignedEmployeesPanel
          assignedEmployees={assignedEmployees}
          mutating={mutating}
          isClosed={isClosed}
          onOpenTimesheet={onOpenTimesheet}
          onRemoveEmployee={onRemoveEmployee}
        />
      </Box>
    </Stack>
  );
}

AssignmentsContent.propTypes = {
  loading: PropTypes.bool,
  error: PropTypes.object,
  availableEmployees: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    nome: PropTypes.string,
    cognome: PropTypes.string,
  })).isRequired,
  assignedEmployees: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    nome: PropTypes.string,
    cognome: PropTypes.string,
    assignments: PropTypes.arrayOf(assignmentShape),
  })).isRequired,
  selection: PropTypes.arrayOf(PropTypes.string).isRequired,
  onToggleCandidate: PropTypes.func,
  search: PropTypes.string.isRequired,
  onSearchChange: PropTypes.func,
  disciplineFilter: PropTypes.string,
  onDisciplineFilterChange: PropTypes.func,
  disciplineOptions: PropTypes.array.isRequired,
  isClosed: PropTypes.bool,
  mutating: PropTypes.bool,
  onOpenTimesheet: PropTypes.func,
  onRemoveEmployee: PropTypes.func,
  onAssign: PropTypes.func,
  assignmentValue: PropTypes.string,
  onAssignmentValueChange: PropTypes.func,
};

AssignmentsContent.defaultProps = {
  loading: false,
  error: null,
  onToggleCandidate: undefined,
  onSearchChange: undefined,
  disciplineFilter: '',
  onDisciplineFilterChange: undefined,
  isClosed: false,
  mutating: false,
  onOpenTimesheet: undefined,
  onRemoveEmployee: undefined,
  onAssign: undefined,
  assignmentValue: '',
  onAssignmentValueChange: undefined,
};

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
  disciplineFilter,
  onDisciplineFilterChange,
  disciplineOptions,
  search,
  onSearchChange,
  onAssign,
  onRemoveEmployee,
  onOpenTimesheet,
  snack,
  onCloseSnack,
}) {
  const isClosed = normalizeState(commessa?.stato) === 'chiusa' || normalizeState(details?.stato) === 'chiusa';
  const [assignmentValue, setAssignmentValue] = React.useState('');

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

  const handleAssign = React.useCallback((value) => {
    const trimmed = (value || '').trim();
    if (!trimmed) return;
    onAssign?.(trimmed);
  }, [onAssign]);

  React.useEffect(() => {
    if (selection.length === 0) {
      setAssignmentValue('');
    }
  }, [selection]);

  return (
    <>
      <AssignmentsContent
        loading={loading}
        error={error}
        availableEmployees={availableEmployees}
        assignedEmployees={assignedEmployees}
        selection={selection}
        onToggleCandidate={handleToggleCandidate}
        search={search}
        onSearchChange={onSearchChange}
        disciplineFilter={disciplineFilter}
        onDisciplineFilterChange={onDisciplineFilterChange}
        disciplineOptions={disciplineOptions}
        isClosed={isClosed}
        mutating={mutating}
        onOpenTimesheet={onOpenTimesheet}
        onRemoveEmployee={onRemoveEmployee}
        onAssign={handleAssign}
        assignmentValue={assignmentValue}
        onAssignmentValueChange={setAssignmentValue}
      />
      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={onCloseSnack}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snack.severity} onClose={onCloseSnack} variant="filled">
          {snack.message}
        </Alert>
      </Snackbar>
    </>
  );
}

CommessaAssignmentsView.propTypes = {
  loading: PropTypes.bool,
  error: PropTypes.object,
  mutating: PropTypes.bool,
  commessa: PropTypes.object,
  details: PropTypes.object,
  availableEmployees: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    nome: PropTypes.string,
    cognome: PropTypes.string,
    assignments: PropTypes.arrayOf(assignmentShape),
  })).isRequired,
  assignedEmployees: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    nome: PropTypes.string,
    cognome: PropTypes.string,
    assignments: PropTypes.arrayOf(assignmentShape).isRequired,
  })).isRequired,
  selection: PropTypes.arrayOf(PropTypes.string).isRequired,
  onSelectionChange: PropTypes.func,
  disciplineFilter: PropTypes.string,
  onDisciplineFilterChange: PropTypes.func,
  disciplineOptions: PropTypes.array.isRequired,
  search: PropTypes.string.isRequired,
  onSearchChange: PropTypes.func,
  onAssign: PropTypes.func,
  onRemoveEmployee: PropTypes.func,
  onOpenTimesheet: PropTypes.func,
  snack: PropTypes.shape({ open: PropTypes.bool, message: PropTypes.string, severity: PropTypes.string }).isRequired,
  onCloseSnack: PropTypes.func,
};
