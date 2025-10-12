import React from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  TextField,
  Stack,
  Alert
} from '@mui/material';
import { LoadingButton } from '@mui/lab';

export default function SegnalazioneDialog({
  open,
  onClose,
  onSend,
  employee,
  selectedDay,
  formatDateLabel,
  sending,
  sendingOk,
  existingSegnalazione
}) {
  const [message, setMessage] = React.useState('');
  const [error, setError] = React.useState('');

  const employeeLabel = React.useMemo(() => {
    if (!employee) return 'il dipendente selezionato';
    const { nome, cognome, username, id } = employee;
    const fullName = [nome, cognome].filter(Boolean).join(' ');
    return fullName || username || id || 'il dipendente selezionato';
  }, [employee]);

  const formattedDay = React.useMemo(() => {
    if (!selectedDay) return '';
    if (typeof formatDateLabel === 'function') {
      try {
        return formatDateLabel(selectedDay);
      } catch (err) {
        console.warn('[SegnalazioneDialog] formatDateLabel error', err);
      }
    }
    return selectedDay;
  }, [selectedDay, formatDateLabel]);

  React.useEffect(() => {
    if (!open) return;
    setMessage('');
    setError('');
  }, [open, selectedDay, employee?.id]);

  const handleClose = React.useCallback(() => {
    if (sending) return;
    onClose?.();
  }, [onClose, sending]);

  const handleSend = React.useCallback(async () => {
    const trimmed = message.trim();
    if (!trimmed) {
      setError('Inserisci un messaggio per la segnalazione.');
      return;
    }
    setError('');
    try {
      await onSend?.(trimmed);
      setMessage('');
    } catch (err) {
      const maybeMsg = err?.message || 'Impossibile inviare la segnalazione. Riprova.';
      setError(maybeMsg);
    }
  }, [message, onSend]);

  const helper = React.useMemo(() => {
    if (formattedDay) {
      return `La segnalazione verrà inviata per la giornata ${formattedDay}.`;
    }
    return 'La segnalazione verrà associata alla giornata selezionata.';
  }, [formattedDay]);

  const trimmedLength = React.useMemo(() => message.trim().length, [message]);

  return (
    <Dialog open={Boolean(open)} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Invia segnalazione amministrativa</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            Questa segnalazione sarà recapitata a <strong>{employeeLabel}</strong>.
          </Typography>
          {helper && (
            <Typography variant="caption" color="text.secondary">{helper}</Typography>
          )}
          {existingSegnalazione?.descrizione && (
            <Alert severity="info">
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Segnalazione esistente</Typography>
              <Typography variant="body2">{existingSegnalazione.descrizione}</Typography>
            </Alert>
          )}
          {sendingOk && (
            <Alert severity="success">{sendingOk}</Alert>
          )}
          {error && (
            <Alert severity="error">{error}</Alert>
          )}
          <TextField
            autoFocus
            multiline
            minRows={4}
            maxRows={8}
            fullWidth
            label="Messaggio"
            placeholder="Descrivi la segnalazione per il dipendente"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            disabled={sending}
            helperText={`${trimmedLength} caratteri`}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} disabled={sending}>Annulla</Button>
        <LoadingButton
          variant="contained"
          onClick={handleSend}
          loading={Boolean(sending)}
          disabled={!trimmedLength || sending}
        >
          Invia Segnalazione
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}

SegnalazioneDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func,
  onSend: PropTypes.func,
  employee: PropTypes.shape({
    id: PropTypes.string,
    nome: PropTypes.string,
    cognome: PropTypes.string,
    username: PropTypes.string
  }),
  selectedDay: PropTypes.string,
  formatDateLabel: PropTypes.func,
  sending: PropTypes.bool,
  sendingOk: PropTypes.string,
  existingSegnalazione: PropTypes.shape({
    descrizione: PropTypes.string,
    livello: PropTypes.string
  })
};

SegnalazioneDialog.defaultProps = {
  open: false,
  onClose: undefined,
  onSend: undefined,
  employee: null,
  selectedDay: null,
  formatDateLabel: undefined,
  sending: false,
  sendingOk: '',
  existingSegnalazione: null
};
