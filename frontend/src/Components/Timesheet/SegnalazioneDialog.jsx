import React from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack, TextField, Alert } from "@mui/material";
import SendIcon from "@mui/icons-material/Send";

export default function SegnalazioneDialog({ open, onClose, selEmp, selDate, onSend, sendingOk }) {
  const [msg, setMsg] = React.useState("");

  React.useEffect(() => {
    if (!open) setMsg("");
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {selEmp && selDate ? `Invia segnalazione a ${selEmp.dipendente} — ${selDate}` : "Invia segnalazione"}
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <TextField label="Data (YYYY-MM-DD)" value={selDate || ""} size="small" InputProps={{ readOnly: true }} />
          <TextField
            label="Messaggio"
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            multiline
            minRows={3}
            placeholder="Descrivi l'irregolarità negli inserimenti..."
          />
          {sendingOk && <Alert severity="success">{sendingOk}</Alert>}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Annulla</Button>
        <Button
          variant="contained"
          startIcon={<SendIcon />}
          disabled={!selEmp || !selDate || !msg.trim()}
          onClick={async () => {
            await onSend(msg.trim());
          }}
        >
          Invia
        </Button>
      </DialogActions>
    </Dialog>
  );
}
