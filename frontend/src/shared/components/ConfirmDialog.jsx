import React from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from "@mui/material";

export default function ConfirmDialog({
  open,
  title = "Conferma",
  message = "Sei sicuro?",
  onClose,
  onConfirm,
  cancelText = "Annulla",
  confirmText = "Elimina",
  confirmColor = "error",
  confirmVariant = "contained",
}) {
  const handleClose = (result) => {
    if (onClose) onClose(result);
  };

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    handleClose(true);
  };

  return (
    <Dialog open={!!open} onClose={() => handleClose(false)} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        {React.isValidElement(message) ? message : <Typography variant="body2">{message}</Typography>}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => handleClose(false)}>{cancelText}</Button>
        <Button color={confirmColor} variant={confirmVariant} onClick={handleConfirm}>{confirmText}</Button>
      </DialogActions>
    </Dialog>
  );
}
