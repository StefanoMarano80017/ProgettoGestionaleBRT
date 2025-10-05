import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';

// Minimal stub: preserve props API but avoid any admin-only side effects.
export default function SegnalazioneDialog({ open, onClose, onSend }) {
  return (
    <Dialog open={Boolean(open)} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Segnalazione (STUB)</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary"> This dialog has been stubbed. It preserves the same props but does not perform any network actions. </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Chiudi</Button>
        <Button
          variant="contained"
          onClick={async () => {
            // Keep API shape: call onSend if provided so callers expecting a promise won't break.
            if (onSend) await Promise.resolve(onSend('STUB'));
            if (onClose) onClose();
          }}
        >
          Invia (stub)
        </Button>
      </DialogActions>
    </Dialog>
  );
}
