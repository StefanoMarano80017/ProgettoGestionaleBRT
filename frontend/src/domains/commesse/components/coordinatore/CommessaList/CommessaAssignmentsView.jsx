import React from 'react';
import PropTypes from 'prop-types';
import {
  Stack,
  Typography,
  TextField,
  Autocomplete,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Paper,
  Button,
  Chip,
  Checkbox,
  IconButton,
  CircularProgress,
  Snackbar,
  Alert,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import LaunchIcon from '@mui/icons-material/Launch';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { DISCIPLINES, DISCIPLINE_LABEL } from '@shared/utils/discipline.js';

const formatName = (employee) => `${employee.nome ?? ''} ${employee.cognome ?? ''}`.trim() || employee.id;

const normalizeState = (value) => String(value || '').toLowerCase();

const assignmentShape = PropTypes.shape({
  code: PropTypes.string.isRequired,
});

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
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [showDetails, setShowDetails] = React.useState(false);
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

  return (
    <>
      <Stack spacing={1.5}>
        {loading ? (
          <Stack alignItems="center" justifyContent="center" sx={{ py: 2 }}>
            <CircularProgress size={24} />
          </Stack>
        ) : error ? (
          <Alert severity="error">{error.message || 'Impossibile caricare i dettagli'}</Alert>
        ) : (
          <>
            {/* Compact View */}
            <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="space-between">
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Risorse assegnate: {assignedEmployees.length}
                </Typography>
                {isClosed && <Chip size="small" label="Chiusa" color="default" sx={{ height: 20 }} />}
              </Stack>
              <Stack direction="row" spacing={1}>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<PersonAddIcon fontSize="small" />}
                  onClick={() => setDialogOpen(true)}
                  disabled={isClosed}
                  sx={{ 
                    borderRadius: 1.5,
                    px: 1.5,
                    py: 0.5,
                    fontSize: '0.75rem',
                  }}
                >
                  Gestisci assegnazioni
                </Button>
                <IconButton 
                  size="small" 
                  onClick={() => setShowDetails(!showDetails)}
                  sx={{ ml: 0.5 }}
                >
                  {showDetails ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                </IconButton>
              </Stack>
            </Stack>

            {/* Compact list of assigned employees */}
            {showDetails && assignedEmployees.length > 0 && (
              <Box sx={{ pl: 2 }}>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {assignedEmployees.slice(0, 5).map((employee) => (
                    <Chip
                      key={employee.id}
                      label={formatName(employee)}
                      size="small"
                      sx={{ height: 24, fontSize: '0.75rem' }}
                    />
                  ))}
                  {assignedEmployees.length > 5 && (
                    <Chip
                      label={`+${assignedEmployees.length - 5} altri`}
                      size="small"
                      variant="outlined"
                      sx={{ height: 24, fontSize: '0.75rem' }}
                    />
                  )}
                </Stack>
              </Box>
            )}
          </>
        )}
        <Snackbar open={snack.open} autoHideDuration={3000} onClose={onCloseSnack} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
          <Alert severity={snack.severity} onClose={onCloseSnack} variant="filled">
            {snack.message}
          </Alert>
        </Snackbar>
      </Stack>

      {/* Dialog overlay for full assignment interface */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            maxHeight: '90vh',
          }
        }}
      >
        <DialogTitle sx={{ pb: 2, pt: 3, px: 3 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Typography variant="h5" sx={{ fontWeight: 700, color: 'common.white' }}>
                Gestisci assegnazioni
              </Typography>
              {commessa && (
                <Chip 
                  label={commessa.codice} 
                  size="small" 
                  sx={{ 
                    height: 26,
                    fontWeight: 600,
                    bgcolor: 'rgba(25, 118, 210, 0.08)',
                    color: 'primary.main',
                    border: '1px solid',
                    borderColor: 'primary.main',
                  }}
                />
              )}
              {isClosed && <Chip size="small" label="Commessa chiusa" color="default" sx={{ height: 26, fontWeight: 500 }} />}
            </Stack>
            <IconButton 
              onClick={() => setDialogOpen(false)} 
              size="small"
              sx={{
                bgcolor: 'action.hover',
                '&:hover': {
                  bgcolor: 'action.selected',
                }
              }}
            >
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent 
          dividers
          sx={{
            bgcolor: 'background.default',
            px: 3,
            py: 3,
          }}
        >
          <Stack spacing={3}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="stretch">
                <Paper 
                  elevation={0}
                  sx={{ 
                    flex: 1, 
                    p: 3, 
                    borderRadius: 2,
                    border: '2px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                  }}
                >
                  <Stack spacing={2.5}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'common.white', bgcolor: 'primary.main', px: 2, py: 1, borderRadius: 1.5 }}>
                      Candidati disponibili
                    </Typography>
                    <TextField
                      label="Cerca dipendenti"
                      size="small"
                      value={search}
                      onChange={(event) => onSearchChange?.(event.target.value)}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 1.5,
                        }
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
                        }
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
                    <List dense sx={{ maxHeight: 320, overflowY: 'auto', border: (theme) => `1px solid ${theme.palette.divider}`, borderRadius: 1.5, bgcolor: 'background.default' }}>
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
                              disableTypography
                              primary={(
                                <Typography variant="body2" sx={{ fontWeight: checked ? 600 : 500 }}>
                                  {formatName(employee)}
                                </Typography>
                              )}
                              secondary={(
                                <Typography variant="caption" color="text.secondary">
                                  Matricola: {employee.id}
                                </Typography>
                              )}
                            />
                          </ListItemButton>
                        );
                      })}
                    </List>
                    <Button
                      variant="contained"
                      onClick={onAssign}
                      disabled={selection.length === 0 || mutating || isClosed}
                      startIcon={<PersonAddIcon />}
                      sx={{
                        borderRadius: 1.5,
                        py: 1,
                        fontWeight: 600,
                      }}
                    >
                      Assegna selezionati ({selection.length})
                    </Button>
                  </Stack>
                </Paper>
                <Paper 
                  elevation={0}
                  sx={{ 
                    flex: 1, 
                    p: 3, 
                    borderRadius: 2,
                    border: '2px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.paper',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <Stack spacing={2.5} sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'common.white', bgcolor: 'primary.main', px: 2, py: 1, borderRadius: 1.5 }}>Assegnati ({assignedEmployees.length})</Typography>
                    <List dense sx={{ maxHeight: 450, flex: 1, overflowY: 'auto', bgcolor: 'background.default', borderRadius: 1.5, p: 1 }}>
                      {assignedEmployees.length === 0 && (
                        <Typography variant="body2" color="text.secondary" sx={{ py: 1.5 }}>
                          Nessuna risorsa assegnata
                        </Typography>
                      )}
                      {assignedEmployees.map((employee) => (
                        <ListItem
                          key={employee.id}
                          disableGutters
                          sx={{
                            px: 0,
                            py: 0.5,
                          }}
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
                                  disabled={mutating}
                                  aria-label="Rimuovi assegnazione"
                                >
                                  <DeleteOutlineIcon fontSize="small" />
                                </IconButton>
                              </Stack>
                            </Stack>
                            <Typography variant="caption" color="text.secondary">
                              Disciplina: {employee.disciplineLabel || DISCIPLINE_LABEL[employee.discipline] || employee.discipline || 'N/D'}
                            </Typography>
                          </Stack>
                        </ListItem>
                      ))}
                    </List>
                  </Stack>
                </Paper>
              </Stack>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2.5, bgcolor: 'background.paper' }}>
            <Button 
              onClick={() => setDialogOpen(false)}
              variant="outlined"
              sx={{
                borderRadius: 1.5,
                px: 3,
                py: 1,
                fontWeight: 600,
              }}
            >
              Chiudi
            </Button>
          </DialogActions>
        </Dialog>
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
