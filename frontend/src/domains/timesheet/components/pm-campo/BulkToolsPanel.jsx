import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { it } from 'date-fns/locale';
import ScheduleIcon from '@mui/icons-material/Schedule';
import GroupsIcon from '@mui/icons-material/Groups';
import BeachAccessIcon from '@mui/icons-material/BeachAccess';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { format, parse } from 'date-fns';

const ABSENCE_PRESETS = [
  { code: 'FERIE', label: 'Ferie', icon: BeachAccessIcon, color: '#D8315B' },
  { code: 'MALATTIA', label: 'Malattia', icon: LocalHospitalIcon, color: '#34C759' },
  { code: 'PERMESSO', label: 'Permesso', icon: EventBusyIcon, color: '#0288d1', needsHours: true },
  { code: 'ROL', label: 'ROL', icon: AccessTimeIcon, color: '#0288d1', needsHours: true },
];

function normalizeDateKey(value, fallback) {
  if (!value) return fallback;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return fallback;
  return format(parsed, 'yyyy-MM-dd');
}

export default function BulkToolsPanel({
  month,
  year,
  selectedEmployee = null,
  selectedDay = null,
  groups = [],
  commessaOptions = [],
  onStageAbsence,
  onClearDay,
  onAssignGroup,
  disabled = false,
}) {
  const [message, setMessage] = useState(null);
  const [groupMessage, setGroupMessage] = useState(null);
  const [groupForm, setGroupForm] = useState({ groupId: '', dateKey: '', commessa: '', oreTot: '' });
  const [processingGroup, setProcessingGroup] = useState(false);
  const [processingDraft, setProcessingDraft] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [hourDialog, setHourDialog] = useState({ open: false, code: '', hours: 8 });

  const effectiveDay = useMemo(() => {
    const fallback = new Date(year || new Date().getFullYear(), month ?? new Date().getMonth(), 1);
    return normalizeDateKey(selectedDay, format(fallback, 'yyyy-MM-01'));
  }, [selectedDay, month, year]);

  useEffect(() => {
    setGroupForm((prev) => ({ ...prev, dateKey: effectiveDay }));
  }, [effectiveDay]);

  useEffect(() => {
    setMessage(null);
    setValidationError('');
  }, [selectedEmployee?.id, effectiveDay]);

  const canStage = !disabled && !!selectedEmployee?.id && !!effectiveDay;

  const stageAbsence = async (code, hours) => {
    if (disabled) {
      setValidationError('Non hai i permessi per inserire assenze.');
      return;
    }
    if (!selectedEmployee?.id) {
      setValidationError('Seleziona un operaio dalla griglia.');
      return;
    }
    const dayKey = normalizeDateKey(effectiveDay, null);
    if (!dayKey) {
      setValidationError('Seleziona una data valida.');
      return;
    }

    setProcessingDraft(true);
    try {
      const result = await Promise.resolve(onStageAbsence?.({
        employeeId: selectedEmployee.id,
        dateKey: dayKey,
        code,
        hours,
      }));
      if (!result?.ok) {
        setValidationError(result?.error || 'Validazione non superata.');
        return;
      }
      setMessage({
        type: 'success',
        text: `${code} (${hours}h) inserita per ${selectedEmployee.nome} ${selectedEmployee.cognome} (${dayKey}).`,
      });
      setValidationError('');
    } catch (error) {
      setValidationError(error?.message || 'Errore durante lo staging.');
    } finally {
      setProcessingDraft(false);
    }
  };

  const handleAbsenceClick = (code, needsHours) => {
    if (!canStage || processingDraft) {
      setValidationError(canStage ? 'Attendi il completamento della precedente operazione.' : 'Seleziona operaio e data.');
      return;
    }
    if (needsHours) {
      setHourDialog({ open: true, code, hours: 8 });
      return;
    }
    stageAbsence(code, 8);
  };

  const handleHourDialogConfirm = () => {
    const hours = Number(hourDialog.hours);
    if (!hours || hours <= 0 || hours > 8) {
      setValidationError('Inserire un numero di ore valido (1-8).');
      return;
    }
    stageAbsence(hourDialog.code, hours);
    setHourDialog({ open: false, code: '', hours: 8 });
  };

  const handleStageClear = async () => {
    if (disabled) {
      setValidationError('Non hai i permessi per svuotare la giornata.');
      return;
    }
    if (!selectedEmployee?.id) {
      setValidationError('Seleziona un operaio dalla griglia per applicare le modifiche.');
      return;
    }
    const dayKey = normalizeDateKey(effectiveDay, null);
    if (!dayKey) {
      setValidationError('Seleziona una data valida.');
      return;
    }

    setProcessingDraft(true);
    try {
      const result = await Promise.resolve(onClearDay?.({
        employeeId: selectedEmployee.id,
        dateKey: dayKey,
      }));
      if (!result?.ok) {
        setValidationError(result?.error || 'Errore durante lo staging.');
        return;
      }
      setMessage({ type: 'info', text: `Giornata ${dayKey} svuotata nello staging.` });
      setValidationError('');
    } catch (error) {
      setValidationError(error?.message || 'Errore durante lo staging.');
    } finally {
      setProcessingDraft(false);
    }
  };

  const handleGroupSubmit = async () => {
    if (disabled) {
      setGroupMessage({ type: 'warning', text: 'Non hai i permessi per assegnare ore alle squadre.' });
      return;
    }
    if (!groupForm.groupId) {
      setGroupMessage({ type: 'warning', text: 'Seleziona una squadra.' });
      return;
    }
    const dateKey = normalizeDateKey(groupForm.dateKey, effectiveDay);
    if (!dateKey) {
      setGroupMessage({ type: 'warning', text: 'Seleziona una data valida.' });
      return;
    }
    const commessa = groupForm.commessa.trim().toUpperCase();
    if (!commessa) {
      setGroupMessage({ type: 'warning', text: 'Inserisci la commessa.' });
      return;
    }
    const oreTot = Number(groupForm.oreTot);
    if (!oreTot || oreTot <= 0) {
      setGroupMessage({ type: 'warning', text: 'Inserisci il totale di ore da distribuire.' });
      return;
    }

    setProcessingGroup(true);
    try {
      const result = await Promise.resolve(onAssignGroup?.({
        groupId: groupForm.groupId,
        dateKey,
        commessa,
        oreTot,
      }));
      if (!result?.ok) {
        setGroupMessage({ type: 'error', text: result?.error || 'Errore assegnazione ore.' });
        return;
      }
      if (result?.errors?.length) {
        setGroupMessage({
          type: 'warning',
          text: `Ore assegnate, ma alcune giornate non sono nello staging: ${result.errors.join(' | ')}`,
        });
      } else {
        setGroupMessage({ type: 'success', text: 'Ore assegnate alla squadra e predisposte nello staging.' });
      }
      setMessage(null);
    } catch (error) {
      setGroupMessage({ type: 'error', text: error?.message || 'Errore assegnazione ore.' });
    } finally {
      setProcessingGroup(false);
    }
  };

  return (
    <Paper
      elevation={2}
      sx={{
        p: 1.5,
        borderRadius: 1.5,
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider'
      }}
    >
      <Stack direction="row" spacing={0.5} alignItems="center" sx={{ px: 0.5 }}>
        <ScheduleIcon fontSize="small" color="primary" />
        <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.85rem' }}>
          Strumenti Rapidi
        </Typography>
      </Stack>

      <Box
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 1,
          p: 1.5,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
          bgcolor: (theme) => alpha(theme.palette.background.default, 0.4),
        }}
      >
        <Stack direction="column" spacing={1}>
          <TextField
            select
            size="small"
            label="Squadra"
            value={groupForm.groupId}
            onChange={(event) => setGroupForm((prev) => ({ ...prev, groupId: event.target.value }))}
            sx={{ minWidth: 160 }}
            disabled={disabled}
          >
            <MenuItem value="">
              <em>Seleziona</em>
            </MenuItem>
            {(groups || []).map((group) => (
              <MenuItem key={group.id} value={group.id}>{group.name}</MenuItem>
            ))}
          </TextField>
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={it}>
            <DatePicker
              label="Data"
              value={groupForm.dateKey ? parse(groupForm.dateKey, 'yyyy-MM-dd', new Date()) : null}
              onChange={(newValue) => {
                const formatted = newValue ? format(newValue, 'yyyy-MM-dd') : '';
                setGroupForm((prev) => ({ ...prev, dateKey: formatted }));
              }}
              disabled={disabled}
              slotProps={{
                textField: {
                  size: 'small',
                  sx: {
                    '& .MuiInputBase-input': {
                      fontSize: '0.875rem',
                    },
                    '& .MuiInputBase-root': {
                      bgcolor: 'background.paper',
                    },
                  },
                },
              }}
            />
          </LocalizationProvider>
          <Autocomplete
            freeSolo
            options={commessaOptions || []}
            value={groupForm.commessa}
            inputValue={groupForm.commessa}
            onInputChange={(event, value) => setGroupForm((prev) => ({ ...prev, commessa: value }))}
            onChange={(event, value) => setGroupForm((prev) => ({ ...prev, commessa: value || '' }))}
            size="small"
            disableClearable
            disabled={disabled}
            sx={{ minWidth: 180 }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Commessa"
                size="small"
              />
            )}
          />
          <TextField
            label="Ore totali"
            size="small"
            type="number"
            value={groupForm.oreTot}
            onChange={(event) => setGroupForm((prev) => ({ ...prev, oreTot: event.target.value }))}
            InputProps={{ endAdornment: <InputAdornment position="end">h</InputAdornment> }}
            disabled={disabled}
          />
          <Button startIcon={<GroupsIcon />} variant="contained" size="small" onClick={handleGroupSubmit} disabled={processingGroup || disabled}>
            Assegna gruppo
          </Button>
        </Stack>
        {groupMessage && <Alert severity={groupMessage.type}>{groupMessage.text}</Alert>}
      </Box>

      <Divider textAlign="left" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>Inserimento rapido assenze</Divider>

      <Stack spacing={1.5}>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
          {selectedEmployee ? `${selectedEmployee.nome} ${selectedEmployee.cognome}` : 'Seleziona operaio dalla griglia'} • {effectiveDay || 'Seleziona data'}
        </Typography>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 1,
          }}
        >
          {ABSENCE_PRESETS.map((preset) => (
            <Button
              key={preset.code}
              variant="outlined"
              size="small"
              disabled={!canStage || processingDraft}
              onClick={() => handleAbsenceClick(preset.code, preset.needsHours)}
              startIcon={React.createElement(preset.icon)}
              sx={{
                py: 1.5,
                fontSize: '0.8rem',
                fontWeight: 600,
                textTransform: 'none',
                justifyContent: 'flex-start',
                px: 2,
                borderColor: preset.color,
                color: preset.color,
                borderWidth: 2,
                '&:hover': {
                  borderColor: preset.color,
                  bgcolor: `${preset.color}1A`,
                  borderWidth: 2,
                },
                '&.Mui-disabled': {
                  borderColor: `${preset.color}4D`,
                  color: `${preset.color}4D`,
                },
              }}
            >
              {preset.label}
            </Button>
          ))}
        </Box>

        <Divider sx={{ my: 0.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>oppure</Typography>
        </Divider>

        <Button
          variant="outlined"
          size="small"
          color="error"
          onClick={handleStageClear}
          disabled={!canStage || processingDraft}
          sx={{ fontSize: '0.75rem' }}
        >
          Svuota giornata
        </Button>

        {validationError && <Alert severity="error" sx={{ fontSize: '0.75rem' }}>{validationError}</Alert>}
        {message && <Alert severity={message.type} sx={{ fontSize: '0.75rem' }}>{message.text}</Alert>}
      </Stack>

      <Dialog open={hourDialog.open} onClose={() => setHourDialog({ open: false, code: '', hours: 8 })} maxWidth="xs" fullWidth>
        <DialogTitle>
          Ore {hourDialog.code}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            label="Numero di ore"
            type="number"
            fullWidth
            value={hourDialog.hours}
            onChange={(e) => setHourDialog((prev) => ({ ...prev, hours: e.target.value }))}
            inputProps={{ min: 0.5, max: 8, step: 0.5 }}
            InputProps={{ endAdornment: <InputAdornment position="end">h</InputAdornment> }}
            helperText="Massimo 8 ore per rispettare il vincolo giornaliero"
            autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHourDialog({ open: false, code: '', hours: 8 })} color="inherit">
            Annulla
          </Button>
          <Button onClick={handleHourDialogConfirm} variant="contained">
            Conferma
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

BulkToolsPanel.propTypes = {
  month: PropTypes.number,
  year: PropTypes.number,
  selectedEmployee: PropTypes.shape({
    id: PropTypes.string,
    nome: PropTypes.string,
    cognome: PropTypes.string,
  }),
  selectedDay: PropTypes.string,
  groups: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string,
  })),
  commessaOptions: PropTypes.arrayOf(PropTypes.string),
  onStageAbsence: PropTypes.func,
  onClearDay: PropTypes.func,
  onAssignGroup: PropTypes.func,
  disabled: PropTypes.bool,
};
