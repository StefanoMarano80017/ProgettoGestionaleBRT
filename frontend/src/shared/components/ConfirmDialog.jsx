import React from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from "@mui/material";

export default function ConfirmDialog({ open, title = "Conferma", message = "Sei sicuro?", onClose, onConfirm }) {
  return (
    <Dialog open={!!open} onClose={() => onClose && onClose(false)} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Typography variant="body2">{message}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose && onClose(false)}>Annulla</Button>
        <Button color="error" variant="contained" onClick={() => { onConfirm && onConfirm(); onClose && onClose(false); }}>Elimina</Button>
      </DialogActions>
    </Dialog>
  );
}
