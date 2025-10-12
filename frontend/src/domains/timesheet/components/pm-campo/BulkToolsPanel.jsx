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
import { useTimesheetApi } from '@domains/timesheet/hooks/useTimesheetApi';
import { useTimesheetStaging } from '@domains/timesheet/hooks/staging';
import { useTimesheetContext } from '@domains/timesheet/hooks/TimesheetContext';
import { EMPLOYEE_COMMESSE } from '@mocks/ProjectMock';

const NON_WORK_CODES = ['FERIE', 'MALATTIA', 'PERMESSO', 'ROL'];

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
  onDraftValidate,
  onDraftStage,
  onRefresh,
  disabled = false,
}) {
  const { api } = useTimesheetApi();
  const staging = useTimesheetStaging();
  const ctx = useTimesheetContext();

  const [message, setMessage] = useState(null);
  const [groupMessage, setGroupMessage] = useState(null);
  const [groupForm, setGroupForm] = useState({ groupId: '', dateKey: '', commessa: '', oreTot: '' });
  const [processingGroup, setProcessingGroup] = useState(false);
  const [processingDraft, setProcessingDraft] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [hourDialog, setHourDialog] = useState({ open: false, code: '', hours: 8 });
  const stageFn = onDraftStage || staging.stageDraft;
  const validatorFn = onDraftValidate || (() => ({ ok: true }));

  const stageGroupDistribution = (group, dateKey) => {
    if (!group?.members?.length) return null;
    const entries = group.timesheet?.[dateKey] || [];
    const commesseSet = new Set(entries.map((entry) => String(entry.commessa || '').toUpperCase()));
    const result = { staged: 0, errors: [] };

    group.members.forEach((memberId) => {
      const baseMerged = staging.getMergedDay
        ? staging.getMergedDay(memberId, dateKey)
        : (ctx?.dataMap?.[memberId]?.[dateKey] || []);
      const preserved = (baseMerged || []).filter((rec) => !commesseSet.has(String(rec?.commessa || '').toUpperCase()));
      const groupRows = entries.map((entry, idx) => {
        const ore = Number(entry?.assegnazione?.[memberId] || 0);
        if (!ore) return null;
        return {
          id: `grp-${group.id}-${memberId}-${idx}`,
          commessa: entry.commessa,
          ore,
          descrizione: entry.descrizione || `Assegnazione ${group.name}`,
        };
      }).filter(Boolean);

      const draft = [...preserved, ...groupRows];
      const validation = validatorFn(memberId, dateKey, draft);
      if (!validation.ok) {
        result.errors.push(`${memberId}: ${validation.error}`);
        return;
      }
      if (typeof stageFn === 'function') {
        stageFn(memberId, dateKey, draft);
        result.staged += 1;
      }
    });

    return result;
  };

  const effectiveDay = useMemo(() => {
    const fallback = new Date(year || new Date().getFullYear(), (month ?? new Date().getMonth()), 1);
    return normalizeDateKey(selectedDay, format(fallback, 'yyyy-MM-01'));
  }, [selectedDay, month, year]);

  useEffect(() => {
    setGroupForm((prev) => ({ ...prev, dateKey: effectiveDay }));
  }, [effectiveDay]);

  const commessaOptions = useMemo(() => {
    const codes = new Set();
    if (selectedEmployee?.id) {
      const data = ctx?.dataMap?.[selectedEmployee.id] || {};
      Object.entries(data).forEach(([key, items]) => {
        if (key.endsWith('_segnalazione')) return;
        (items || []).forEach((item) => {
          if (item?.commessa && !NON_WORK_CODES.includes(String(item.commessa).toUpperCase())) {
            codes.add(String(item.commessa).toUpperCase());
          }
        });
      });
      const predefined = EMPLOYEE_COMMESSE?.[selectedEmployee.id];
      if (Array.isArray(predefined)) {
        predefined.forEach((code) => {
          if (code && !NON_WORK_CODES.includes(String(code).toUpperCase())) {
            codes.add(String(code).toUpperCase());
          }
        });
      }
    }
    return Array.from(codes).sort();
  }, [ctx?.dataMap, selectedEmployee?.id]);

  const handleAbsenceClick = (code) => {
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

    // PERMESSO and ROL require hour selection
    if (code === 'PERMESSO' || code === 'ROL') {
      setHourDialog({ open: true, code, hours: 8 });
      return;
    }

    // FERIE and MALATTIA are always 8 hours
    stageAbsence(code, 8);
  };

  const stageAbsence = (code, hours) => {
    const dayKey = normalizeDateKey(effectiveDay, null);
    
    const draft = [{
      id: `absence-${code}-${Date.now()}`,
      commessa: code,
      ore: Number(hours),
      descrizione: '',
    }];
    
    const validation = validatorFn(selectedEmployee.id, dayKey, draft);
    if (!validation.ok) {
      setValidationError(validation.error || 'Validazione non superata.');
      return;
    }
    
    setProcessingDraft(true);
    try {
      if (typeof stageFn === 'function') {
        stageFn(selectedEmployee.id, dayKey, draft);
      }
      setMessage({ type: 'success', text: `${code} (${hours}h) inserita per ${selectedEmployee.nome} ${selectedEmployee.cognome} (${dayKey}).` });
      setValidationError('');
    } catch (error) {
      setValidationError(error?.message || 'Errore durante lo staging.');
    } finally {
      setProcessingDraft(false);
    }
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
      if (typeof stageFn === 'function') {
        stageFn(selectedEmployee.id, dayKey, []);
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
    if (!groupForm.commessa.trim()) {
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
      const group = await api.assignHoursToGroup({
        groupId: groupForm.groupId,
        dateKey,
        commessa: groupForm.commessa.trim().toUpperCase(),
        oreTot,
      });
      const result = stageGroupDistribution(group, dateKey);
      if (result?.errors?.length) {
        setGroupMessage({
          type: 'warning',
          text: `Ore assegnate ma alcune giornate non sono state inserite nello staging: ${result.errors.join(' | ')}`,
        });
      } else {
        setGroupMessage({ type: 'success', text: 'Ore assegnate alla squadra e predisposte nello staging.' });
      }
      if (onRefresh) await onRefresh();
    } catch (error) {
      setGroupMessage({ type: 'error', text: error?.message || 'Errore assegnazione ore.' });
    } finally {
      setProcessingGroup(false);
    }
  };

  const canStage = !disabled && !!selectedEmployee?.id && !!effectiveDay;

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
            options={commessaOptions}
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
          <Button
            variant="outlined"
            size="small"
            disabled={!canStage || processingDraft}
            onClick={() => handleAbsenceClick('FERIE')}
            startIcon={<BeachAccessIcon />}
            sx={{
              py: 1.5,
              fontSize: '0.8rem',
              fontWeight: 600,
              textTransform: 'none',
              justifyContent: 'flex-start',
              px: 2,
              borderColor: '#D8315B',
              color: '#D8315B',
              borderWidth: 2,
              '&:hover': {
                borderColor: '#D8315B',
                bgcolor: 'rgba(216, 49, 91, 0.08)',
                borderWidth: 2,
              },
              '&.Mui-disabled': {
                borderColor: 'rgba(216, 49, 91, 0.3)',
                color: 'rgba(216, 49, 91, 0.3)',
              },
            }}
          >
            Ferie
          </Button>
          <Button
            variant="outlined"
            size="small"
            disabled={!canStage || processingDraft}
            onClick={() => handleAbsenceClick('MALATTIA')}
            startIcon={<LocalHospitalIcon />}
            sx={{
              py: 1.5,
              fontSize: '0.8rem',
              fontWeight: 600,
              textTransform: 'none',
              justifyContent: 'flex-start',
              px: 2,
              borderColor: '#34C759',
              color: '#34C759',
              borderWidth: 2,
              '&:hover': {
                borderColor: '#34C759',
                bgcolor: 'rgba(52, 199, 89, 0.08)',
                borderWidth: 2,
              },
              '&.Mui-disabled': {
                borderColor: 'rgba(52, 199, 89, 0.3)',
                color: 'rgba(52, 199, 89, 0.3)',
              },
            }}
          >
            Malattia
          </Button>
          <Button
            variant="outlined"
            size="small"
            disabled={!canStage || processingDraft}
            onClick={() => handleAbsenceClick('PERMESSO')}
            startIcon={<EventBusyIcon />}
            sx={{
              py: 1.5,
              fontSize: '0.8rem',
              fontWeight: 600,
              textTransform: 'none',
              justifyContent: 'flex-start',
              px: 2,
              borderColor: '#0288d1',
              color: '#0288d1',
              borderWidth: 2,
              '&:hover': {
                borderColor: '#0288d1',
                bgcolor: 'rgba(2, 136, 209, 0.08)',
                borderWidth: 2,
              },
              '&.Mui-disabled': {
                borderColor: 'rgba(2, 136, 209, 0.3)',
                color: 'rgba(2, 136, 209, 0.3)',
              },
            }}
          >
            Permesso
          </Button>
          <Button
            variant="outlined"
            size="small"
            disabled={!canStage || processingDraft}
            onClick={() => handleAbsenceClick('ROL')}
            startIcon={<AccessTimeIcon />}
            sx={{
              py: 1.5,
              fontSize: '0.8rem',
              fontWeight: 600,
              textTransform: 'none',
              justifyContent: 'flex-start',
              px: 2,
              borderColor: '#0288d1',
              color: '#0288d1',
              borderWidth: 2,
              '&:hover': {
                borderColor: '#0288d1',
                bgcolor: 'rgba(2, 136, 209, 0.08)',
                borderWidth: 2,
              },
              '&.Mui-disabled': {
                borderColor: 'rgba(2, 136, 209, 0.3)',
                color: 'rgba(2, 136, 209, 0.3)',
              },
            }}
          >
            ROL
          </Button>
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
  onDraftValidate: PropTypes.func,
  onDraftStage: PropTypes.func,
  onRefresh: PropTypes.func,
  disabled: PropTypes.bool,
};
