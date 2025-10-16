import React from 'react';
import PropTypes from 'prop-types';
import {
  Alert,
  Autocomplete,
  Avatar,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
  alpha,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import LaunchIcon from '@mui/icons-material/Launch';
import PersonAddAlt1OutlinedIcon from '@mui/icons-material/PersonAddAlt1Outlined';
import { getCommessaColor, getCommessaColorLight } from '@shared/utils/commessaColors.js';
import { getAvatarPalette } from '@shared/utils/avatarColors.js';

const assignmentShape = PropTypes.shape({
  code: PropTypes.string.isRequired,
});

const formatName = (employee) => `${employee.nome ?? ''} ${employee.cognome ?? ''}`.trim() || employee.id;

const getInitials = (employee) => {
  const name = formatName(employee);
  if (!name) return '?';
  const [first = '', second = ''] = name.split(' ');
  const firstInitial = first.charAt(0);
  const secondInitial = second.charAt(0);
  return `${firstInitial}${secondInitial}`.toUpperCase();
};

const normalizeState = (value) => String(value || '').toLowerCase();

const getEmployeeAvatarPalette = (employee) => getAvatarPalette({
  fullName: formatName(employee),
  nome: employee.nome,
  cognome: employee.cognome,
  username: employee.username,
  email: employee.email,
  employeeId: employee.id,
});

function LoadingState() {
  return (
    <Stack alignItems="center" justifyContent="center" sx={{ py: 6 }}>
      <CircularProgress size={28} />
    </Stack>
  );
}

function ErrorState({ message }) {
  return <Alert severity="error">{message || 'Impossibile caricare i dettagli della commessa'}</Alert>;
}

ErrorState.propTypes = {
  message: PropTypes.string,
};

function AssignedEmployeeCard({
  employee,
  disabled,
  onEdit,
  onRemove,
  onOpenTimesheet,
  commessaColor,
}) {
  const activity = employee.assignmentLabel || 'Nessuna attività assegnata';
  const hasActivity = Boolean(employee.assignmentLabel);
  const { background: avatarColor, border: baseBorder } = getEmployeeAvatarPalette(employee);
  const accentColor = avatarColor || commessaColor || '#1976d2';
  const avatarLight = alpha(accentColor, 0.12);
  const avatarBorder = baseBorder || alpha(accentColor, 0.22);
  const accentShadow = alpha(accentColor, 0.28);
  const subtleShadow = alpha(accentColor, 0.12);

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.25,
        borderRadius: 2.5,
        border: '1px solid',
        borderColor: 'divider',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 1.75,
        bgcolor: 'background.paper',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 6px 16px rgba(15, 23, 42, 0.08)',
        transition: 'all 0.25s ease',
        '&:hover': {
          borderColor: accentColor,
          boxShadow: `0 12px 28px ${accentShadow}`,
          transform: 'translateY(-3px)',
        },
      }}
    >
      <Stack direction="row" alignItems="flex-start" spacing={1.75}>
        <Avatar 
          src={employee.avatar} 
          alt={formatName(employee)} 
          sx={{ 
            width: 48, 
            height: 48,
            bgcolor: avatarColor,
            fontWeight: 700,
            fontSize: '1rem',
            border: '2px solid',
            borderColor: avatarBorder,
          }}
        >
          {getInitials(employee)}
        </Avatar>
        <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, lineHeight: 1.3, fontSize: '0.9375rem' }} noWrap>
            {formatName(employee)}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', lineHeight: 1.2 }}>
            Mat. {employee.id}
          </Typography>
        </Stack>
        <Stack direction="row" spacing={0.25}>
          {onOpenTimesheet && (
            <IconButton 
              size="small" 
              onClick={() => onOpenTimesheet(employee.id)} 
              aria-label="Apri timesheet"
              sx={{
                '&:hover': { bgcolor: 'action.hover', color: 'primary.main' },
              }}
            >
              <LaunchIcon fontSize="small" />
            </IconButton>
          )}
          <IconButton 
            size="small" 
            onClick={() => onEdit(employee)} 
            disabled={disabled} 
            aria-label="Modifica attività"
            sx={{
              '&:hover': { bgcolor: 'action.hover', color: 'primary.main' },
            }}
          >
            <EditOutlinedIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => onRemove(employee.id)}
            disabled={disabled}
            aria-label="Rimuovi risorsa"
            sx={{
              '&:hover': { bgcolor: 'error.lighter', color: 'error.main' },
            }}
          >
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Stack>
      <Divider sx={{ my: 0.25 }} />
      <Stack spacing={1.25} sx={{ flex: 1, minHeight: 0 }}>
        <Box>
          <Typography 
            variant="caption" 
            sx={{ 
              textTransform: 'uppercase', 
              letterSpacing: 0.5,
              fontWeight: 700,
              color: 'text.secondary',
              fontSize: '0.6875rem',
            }}
          >
            Attività
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              fontWeight: hasActivity ? 600 : 400,
              color: hasActivity ? 'text.primary' : 'text.disabled',
              mt: 0.5,
              fontStyle: hasActivity ? 'normal' : 'italic',
              fontSize: '0.875rem',
              lineHeight: 1.5,
              px: 1.25,
              py: 0.75,
              borderRadius: 1.5,
              bgcolor: hasActivity ? avatarLight : 'transparent',
            }}
          >
            {activity}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
}

AssignedEmployeeCard.propTypes = {
  employee: PropTypes.shape({
    id: PropTypes.string.isRequired,
    nome: PropTypes.string,
    cognome: PropTypes.string,
    avatar: PropTypes.string,
    assignmentLabel: PropTypes.string,
  }).isRequired,
  disabled: PropTypes.bool,
  onEdit: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  onOpenTimesheet: PropTypes.func,
  commessaColor: PropTypes.string,
};

AssignedEmployeeCard.defaultProps = {
  disabled: false,
  onOpenTimesheet: undefined,
  commessaColor: undefined,
};

function AddEmployeesDialog({
  open,
  onClose,
  availableEmployees,
  selection,
  onSelectionChange,
  search,
  onSearchChange,
  assignmentValue,
  onAssignmentValueChange,
  onAssign,
  mutating,
  isClosed,
}) {
  const interactionDisabled = mutating || isClosed;
  const hasSelection = selection.length > 0;

  const assignmentOptions = React.useMemo(() => {
    const values = new Set();
    availableEmployees.forEach((employee) => {
      if (!Array.isArray(employee.assignments)) return;
      employee.assignments.forEach((assignment) => {
        if (assignment?.code) {
          values.add(assignment.code);
        }
      });
    });
    return Array.from(values).sort((a, b) => a.localeCompare(b, 'it', { sensitivity: 'base' }));
  }, [availableEmployees]);

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

  const assignmentDisabled =
    interactionDisabled || !hasSelection || !(assignmentValue || '').trim();

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      fullWidth 
      maxWidth="md"
      PaperProps={{
        sx: {
          borderRadius: 3,
        },
      }}
    >
      <DialogTitle sx={{ pb: 1.5 }}>
        <Stack spacing={0.5}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Aggiungi risorse alla commessa
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
            Seleziona una o più risorse e assegna loro un'attività specifica.
          </Typography>
        </Stack>
      </DialogTitle>
      <DialogContent dividers sx={{ pt: 2.5, pb: 2.5 }}>
        <Stack spacing={2.5}>
          <TextField
            label="Cerca dipendenti"
            size="small"
            value={search}
            onChange={(event) => onSearchChange?.(event.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
            disabled={interactionDisabled}
          />
          <Paper
            variant="outlined"
            sx={{
              borderRadius: 2.5,
              maxHeight: 360,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.default',
            }}
          >
            <List dense sx={{ flex: 1, overflowY: 'auto', py: 0.5 }}>
              {availableEmployees.length === 0 && (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Nessun dipendente disponibile con i filtri correnti.
                  </Typography>
                </Box>
              )}
              {availableEmployees.map((employee) => {
                const checked = selection.includes(employee.id);
                const assignments = Array.isArray(employee.assignments)
                  ? employee.assignments
                  : [];
                const { background: avatarColor } = getEmployeeAvatarPalette(employee);
                
                return (
                  <ListItemButton
                    key={employee.id}
                    onClick={() => handleToggleCandidate(employee.id)}
                    dense
                    selected={checked}
                    disabled={interactionDisabled}
                    sx={{
                      py: 1.25,
                      px: 2,
                      borderRadius: 1.5,
                      mx: 0.5,
                      mb: 0.5,
                      '&.Mui-selected': {
                        bgcolor: 'primary.lighter',
                        '&:hover': {
                          bgcolor: 'primary.light',
                        },
                      },
                    }}
                  >
                    <Checkbox
                      edge="start"
                      size="small"
                      checked={checked}
                      tabIndex={-1}
                      disableRipple
                      disabled={interactionDisabled}
                      sx={{ mr: 1.5 }}
                    />
                    <Avatar
                      src={employee.avatar}
                      alt={formatName(employee)}
                      sx={{
                        width: 36,
                        height: 36,
                        bgcolor: avatarColor,
                        fontSize: '0.875rem',
                        fontWeight: 700,
                        mr: 1.5,
                        border: '2px solid',
                        borderColor: alpha(avatarColor, 0.2),
                      }}
                    >
                      {getInitials(employee)}
                    </Avatar>
                    <ListItemText
                      primary={
                        <Typography variant="body2" sx={{ fontWeight: checked ? 700 : 600, mb: 0.5 }}>
                          {formatName(employee)}
                        </Typography>
                      }
                      secondary={(
                        <Stack spacing={0.5}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                            Matricola: {employee.id}
                          </Typography>
                          {assignments.length > 0 && (
                            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                              {assignments.map((item) => {
                                const chipColor = getCommessaColor(item.code);
                                return (
                                  <Chip
                                    key={item.code}
                                    label={item.code}
                                    size="small"
                                    sx={{
                                      height: 20,
                                      fontSize: '0.6875rem',
                                      fontWeight: 700,
                                      bgcolor: getCommessaColorLight(item.code, 0.15),
                                      color: chipColor,
                                      border: '1px solid',
                                      borderColor: alpha(chipColor, 0.3),
                                      '& .MuiChip-label': {
                                        px: 0.75,
                                      },
                                    }}
                                  />
                                );
                              })}
                            </Stack>
                          )}
                        </Stack>
                      )}
                    />
                  </ListItemButton>
                );
              })}
            </List>
          </Paper>
          <Autocomplete
            freeSolo
            size="small"
            options={assignmentOptions}
            value={assignmentValue}
            inputValue={assignmentValue}
            onInputChange={(_, newValue) => onAssignmentValueChange?.(newValue || '')}
            onChange={(_, newValue) => onAssignmentValueChange?.((newValue || '').trimStart())}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Attività assegnata"
                placeholder="Es. Progettazione BIM, Supervisione cantiere"
                disabled={interactionDisabled}
                helperText={hasSelection ? `${selection.length} risorsa/e selezionata/e` : 'Seleziona almeno una risorsa'}
              />
            )}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2.5, gap: 1.5, bgcolor: 'background.default' }}>
        <Button onClick={onClose} disabled={mutating} size="medium">
          Annulla
        </Button>
        <Button
          variant="contained"
          onClick={() => onAssign?.((assignmentValue || '').trim())}
          disabled={assignmentDisabled}
          size="medium"
          sx={{ minWidth: 140 }}
        >
          Assegna {hasSelection ? `(${selection.length})` : ''}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

AddEmployeesDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  availableEmployees: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    nome: PropTypes.string,
    cognome: PropTypes.string,
    assignments: PropTypes.arrayOf(assignmentShape),
  })).isRequired,
  selection: PropTypes.arrayOf(PropTypes.string).isRequired,
  onSelectionChange: PropTypes.func,
  search: PropTypes.string.isRequired,
  onSearchChange: PropTypes.func,
  assignmentValue: PropTypes.string.isRequired,
  onAssignmentValueChange: PropTypes.func,
  onAssign: PropTypes.func,
  mutating: PropTypes.bool,
  isClosed: PropTypes.bool,
};

AddEmployeesDialog.defaultProps = {
  onSelectionChange: undefined,
  onSearchChange: undefined,
  onAssignmentValueChange: undefined,
  onAssign: undefined,
  mutating: false,
  isClosed: false,
};

function EditAssignmentDialog({ open, employee, value, onChange, onClose, onSave, mutating }) {
  const displayName = employee ? formatName(employee) : '';

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      fullWidth 
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: 3,
        },
      }}
    >
      <DialogTitle sx={{ pb: 1.5 }}>
        <Stack spacing={0.5}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Modifica attività assegnata
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 400 }}>
            {employee ? `Aggiorna l'attività per ${displayName}.` : "Aggiorna l'attività assegnata."}
          </Typography>
        </Stack>
      </DialogTitle>
      <DialogContent dividers sx={{ pt: 2.5, pb: 2.5 }}>
        <TextField
          label="Attività"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Es. Coordinamento, Sopralluogo"
          autoFocus
          fullWidth
          multiline
          rows={2}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
            },
          }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2.5, gap: 1.5, bgcolor: 'background.default' }}>
        <Button onClick={onClose} disabled={mutating} size="medium">
          Annulla
        </Button>
        <Button 
          variant="contained" 
          onClick={onSave} 
          disabled={mutating}
          size="medium"
          sx={{ minWidth: 100 }}
        >
          Salva
        </Button>
      </DialogActions>
    </Dialog>
  );
}

EditAssignmentDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  employee: PropTypes.object,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  mutating: PropTypes.bool,
};

EditAssignmentDialog.defaultProps = {
  employee: null,
  mutating: false,
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
  search,
  onSearchChange,
  onAssign,
  onRemoveEmployee,
  onOpenTimesheet,
  onUpdateAssignment,
  commessaColor,
  snack,
  onCloseSnack,
}) {
  const isClosed = normalizeState(commessa?.stato) === 'chiusa' || normalizeState(details?.stato) === 'chiusa';
  const [addDialogOpen, setAddDialogOpen] = React.useState(false);
  const [assignmentValue, setAssignmentValue] = React.useState('');
  const [editingEmployee, setEditingEmployee] = React.useState(null);
  const [editingValue, setEditingValue] = React.useState('');

  const effectiveCommessaColor = React.useMemo(() => {
    if (commessaColor) return commessaColor;
    const code = details?.codice || commessa?.codice || '';
    return getCommessaColor(code);
  }, [commessaColor, details, commessa]);
  const effectiveCommessaLight = React.useMemo(() => alpha(effectiveCommessaColor, 0.15), [effectiveCommessaColor]);

  React.useEffect(() => {
    if (!editingEmployee) {
      setEditingValue('');
      return;
    }
    setEditingValue(editingEmployee.assignmentLabel || '');
  }, [editingEmployee]);

  React.useEffect(() => {
    if (selection.length === 0) {
      setAssignmentValue('');
    }
  }, [selection]);

  const handleOpenAddDialog = () => {
    setAddDialogOpen(true);
  };

  const handleCloseAddDialog = () => {
    setAddDialogOpen(false);
    setAssignmentValue('');
    onSelectionChange?.([]);
  };

  const handleAssign = (value) => {
    const trimmed = (value || '').trim();
    if (!trimmed) return;
    onAssign?.(trimmed);
    setAddDialogOpen(false);
    setAssignmentValue('');
    onSelectionChange?.([]);
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
  };

  const handleSaveEdit = () => {
    if (!editingEmployee) return;
    onUpdateAssignment?.(editingEmployee.id, editingValue);
    setEditingEmployee(null);
  };

  if (loading) {
    return (
      <>
        <LoadingState />
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

  if (error) {
    return (
      <>
        <ErrorState message={error.message} />
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

  return (
    <>
      <Stack spacing={2.5} sx={{ width: '100%' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1.5}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box
              sx={{
                width: 6,
                height: 32,
                borderRadius: 1,
                bgcolor: 'primary.main',
              }}
            />
            <Stack spacing={0.25}>
              <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                Risorse assegnate
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {assignedEmployees.length} risorsa/e attualmente assegnata/e
              </Typography>
            </Stack>
          </Stack>
          <Button
            variant="contained"
            size="medium"
            startIcon={<PersonAddAlt1OutlinedIcon />}
            onClick={handleOpenAddDialog}
            disabled={isClosed}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              px: 2.5,
            }}
          >
            Aggiungi risorsa
          </Button>
        </Stack>
        {assignedEmployees.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: 2.5,
              textAlign: 'center',
              bgcolor: 'background.default',
              border: '2px dashed',
              borderColor: 'divider',
            }}
          >
            <Stack spacing={2} alignItems="center">
              <Box
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  bgcolor: effectiveCommessaLight,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <PersonAddAlt1OutlinedIcon sx={{ fontSize: 32, color: effectiveCommessaColor }} />
              </Box>
              <Stack spacing={0.75}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Nessuna risorsa assegnata
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Inizia ad assegnare dipendenti a questa commessa per gestire il team di lavoro.
                </Typography>
              </Stack>
              {!isClosed && (
                <Button
                  variant="contained"
                  size="medium"
                  startIcon={<PersonAddAlt1OutlinedIcon />}
                  sx={{ mt: 1, borderRadius: 2, textTransform: 'none', fontWeight: 600, px: 3 }}
                  onClick={handleOpenAddDialog}
                >
                  Aggiungi la prima risorsa
                </Button>
              )}
            </Stack>
          </Paper>
        ) : (
          <Grid container spacing={2.5}>
            {assignedEmployees.map((employee) => (
              <Grid key={employee.id} item xs={12} sm={6} lg={4}>
                <AssignedEmployeeCard
                  employee={employee}
                  disabled={mutating || isClosed}
                  onEdit={handleEdit}
                  onRemove={onRemoveEmployee}
                  onOpenTimesheet={onOpenTimesheet}
                  commessaColor={effectiveCommessaColor}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Stack>

      <AddEmployeesDialog
        open={addDialogOpen}
        onClose={handleCloseAddDialog}
        availableEmployees={availableEmployees}
        selection={selection}
        onSelectionChange={onSelectionChange}
        search={search}
        onSearchChange={onSearchChange}
        assignmentValue={assignmentValue}
        onAssignmentValueChange={setAssignmentValue}
        onAssign={handleAssign}
        mutating={mutating}
        isClosed={isClosed}
      />

      <EditAssignmentDialog
        open={Boolean(editingEmployee)}
        employee={editingEmployee}
        value={editingValue}
        onChange={setEditingValue}
        onClose={() => setEditingEmployee(null)}
        onSave={handleSaveEdit}
        mutating={mutating}
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
    assignments: PropTypes.arrayOf(assignmentShape),
    assignmentLabel: PropTypes.string,
  })).isRequired,
  selection: PropTypes.arrayOf(PropTypes.string).isRequired,
  onSelectionChange: PropTypes.func,
  search: PropTypes.string.isRequired,
  onSearchChange: PropTypes.func,
  onAssign: PropTypes.func,
  onRemoveEmployee: PropTypes.func.isRequired,
  onOpenTimesheet: PropTypes.func,
  onUpdateAssignment: PropTypes.func,
  commessaColor: PropTypes.string,
  snack: PropTypes.shape({ open: PropTypes.bool, message: PropTypes.string, severity: PropTypes.string }).isRequired,
  onCloseSnack: PropTypes.func,
};

CommessaAssignmentsView.defaultProps = {
  loading: false,
  error: null,
  mutating: false,
  commessa: null,
  details: null,
  onSelectionChange: undefined,
  onSearchChange: undefined,
  onAssign: undefined,
  onOpenTimesheet: undefined,
  onUpdateAssignment: undefined,
  commessaColor: undefined,
  onCloseSnack: undefined,
};
