import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Chip,
  Alert
} from '@mui/material';

export default function PartialPermessoEditor({
  open,
  employeeName,
  dateKey,
  initial = [],
  onChangeDraft,
  onConfirm,
  onCancel,
  balances = { permesso: 0, rol: 0 }
}) {
  const [permesso, setPermesso] = useState(() => {
    const entry = initial.find(e => e.commessa === 'PERMESSO');
    return entry ? Number(entry.ore) || 0 : 0;
  });
  
  const [rol, setRol] = useState(() => {
    const entry = initial.find(e => e.commessa === 'ROL');
    return entry ? Number(entry.ore) || 0 : 0;
  });

  const total = permesso + rol;
  const isValidTotal = total >= 1 && total <= 7;
  const hasInsufficientBalance = permesso > balances.permesso || rol > balances.rol;
  const canSave = isValidTotal && !hasInsufficientBalance;

  const handleSave = () => {
    if (!canSave) return;
    
    const arr = [];
    if (permesso > 0) arr.push({ commessa: 'PERMESSO', ore: permesso });
    if (rol > 0) arr.push({ commessa: 'ROL', ore: rol });
    
    onChangeDraft(arr);
    onConfirm();
  };

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogTitle>
        Permesso/ROL Parziale - {employeeName}
        <Typography variant="caption" display="block" color="textSecondary">
          Data: {dateKey}
        </Typography>
      </DialogTitle>
      
      <DialogContent>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          Inserisci ore di PERMESSO/ROL (parziale). Il totale può essere &lt; 8 e può coesistere con lavoro.
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            label="PERMESSO"
            type="number"
            value={permesso}
            onChange={(e) => setPermesso(Math.max(0, Math.min(8, Number(e.target.value) || 0)))}
            inputProps={{ min: 0, max: 8, step: 0.5 }}
            fullWidth
            error={permesso > balances.permesso}
            helperText={permesso > balances.permesso ? 'Saldo insufficiente' : ''}
          />
          <TextField
            label="ROL"
            type="number"
            value={rol}
            onChange={(e) => setRol(Math.max(0, Math.min(8, Number(e.target.value) || 0)))}
            inputProps={{ min: 0, max: 8, step: 0.5 }}
            fullWidth
            error={rol > balances.rol}
            helperText={rol > balances.rol ? 'Saldo insufficiente' : ''}
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Chip 
            label={`Saldo PERMESSO: ${balances.permesso}h`} 
            size="small" 
            variant="outlined"
            color={permesso > balances.permesso ? 'error' : 'default'}
          />
          <Chip 
            label={`Saldo ROL: ${balances.rol}h`} 
            size="small" 
            variant="outlined"
            color={rol > balances.rol ? 'error' : 'default'}
          />
        </Box>

        {total > 0 && (
          <Typography variant="body2" sx={{ mb: 1 }}>
            Totale: {total}h
          </Typography>
        )}

        {!isValidTotal && total > 0 && (
          <Alert severity="warning" sx={{ mb: 1 }}>
            Il totale deve essere tra 1 e 7 ore per l'inserimento parziale
          </Alert>
        )}

        {hasInsufficientBalance && (
          <Alert severity="error">
            Saldo insufficiente per le ore richieste
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onCancel}>Annulla</Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          disabled={!canSave}
        >
          Salva
        </Button>
      </DialogActions>
    </Dialog>
  );
}

PartialPermessoEditor.propTypes = {
  open: PropTypes.bool.isRequired,
  employeeName: PropTypes.string.isRequired,
  dateKey: PropTypes.string.isRequired,
  initial: PropTypes.array,
  onChangeDraft: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  balances: PropTypes.shape({
    permesso: PropTypes.number,
    rol: PropTypes.number
  })
};