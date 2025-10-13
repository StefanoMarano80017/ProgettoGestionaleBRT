import React, { useState, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, RadioGroup, FormControlLabel, Radio, Switch, TextField, Stack, Typography, Divider } from '@mui/material';
import { buildMalattia8, buildFerie8, buildPermRol } from '@domains/timesheet/hooks/dayEntry/useNonWorkDraftBuilder';

export default function PersonalAbsenceEditor({ employeeName, dateKey, initial = [], onChangeDraft = () => {}, onConfirm = () => {}, onCancel = () => {} }) {
  const parsedDate = dateKey || '';

  // Modes: ferie | permRolOnly | feriePermRol
  // - ferie: FERIE 8h
  // - permRolOnly: PERMESSO/ROL any hours (for mixed days with work)
  // - feriePermRol: PERMESSO/ROL totaling exactly 8h as FERIE replacement (auto-compensate)
  const [mode, setMode] = useState('ferie');
  const [malattia, setMalattia] = useState(false);
  const [permHours, setPermHours] = useState(4); // Default 4h for feriePermRol
  const [rolHours, setRolHours] = useState(4);   // Default 4h for feriePermRol

  useEffect(() => {
    // initialize from initial entries if provided
    if (!initial || !Array.isArray(initial) || initial.length === 0) return;
    const nw = initial.filter(r => ['FERIE','PERMESSO','ROL','MALATTIA'].includes(String(r.commessa).toUpperCase()));
    if (nw.length === 0) return;
    const codes = nw.map(r => String(r.commessa).toUpperCase());
    if (codes.includes('MALATTIA')) {
      setMalattia(true);
      setMode('ferie');
      setPermHours(4); setRolHours(4);
      return;
    }
  const perm = nw.filter(r => String(r.commessa).toUpperCase() === 'PERMESSO').reduce((s,r)=>s+Number(r.ore||0),0);
  const rol = nw.filter(r => String(r.commessa).toUpperCase() === 'ROL').reduce((s,r)=>s+Number(r.ore||0),0);
    const ferie = nw.filter(r => String(r.commessa).toUpperCase() === 'FERIE').reduce((s,r)=>s+Number(r.ore||0),0);
    if (ferie === 8 && perm === 0 && rol === 0) { setMode('ferie'); }
    else if (ferie === 0 && (perm+rol) === 8) { setMode('feriePermRol'); setPermHours(perm); setRolHours(rol); }
    else { setMode('permRolOnly'); setPermHours(perm); setRolHours(rol); }
  }, [initial]);

  const permRolSum = Number(permHours || 0) + Number(rolHours || 0);

  const valid = useMemo(() => {
    if (malattia) return true;
    if (mode === 'ferie') return true;
    // permRolOnly: at least one field must have hours, and total <= 8
    if (mode === 'permRolOnly') {
      const hasPermesso = permHours > 0;
      const hasRol = rolHours > 0;
      return (hasPermesso || hasRol) && permRolSum <= 8;
    }
    if (mode === 'feriePermRol') return permRolSum === 8; // Must total exactly 8h to replace FERIE
    return false;
  }, [malattia, mode, permRolSum, permHours, rolHours]);

  // Handler for PERMESSO hours change with auto-compensation in feriePermRol mode
  const handlePermHoursChange = (newPerm) => {
    const clamped = Math.max(0, Math.min(8, Number(newPerm || 0)));
    setPermHours(clamped);
    if (mode === 'feriePermRol') {
      // Auto-compensate ROL to maintain 8h total
      setRolHours(Math.max(0, 8 - clamped));
    }
  };

  // Handler for ROL hours change with auto-compensation in feriePermRol mode
  const handleRolHoursChange = (newRol) => {
    const clamped = Math.max(0, Math.min(8, Number(newRol || 0)));
    setRolHours(clamped);
    if (mode === 'feriePermRol') {
      // Auto-compensate PERMESSO to maintain 8h total
      setPermHours(Math.max(0, 8 - clamped));
    }
  };

  // Notify draft changes when inputs change
  useEffect(() => {
    try {
      let rows = [];
      if (malattia) rows = buildMalattia8();
      else if (mode === 'ferie') rows = buildFerie8();
      else if (mode === 'permRolOnly') rows = (permRolSum > 0 && permRolSum <= 8) ? buildPermRol(permHours, rolHours, false) : [];
      else if (mode === 'feriePermRol') rows = (permRolSum === 8) ? buildPermRol(permHours, rolHours, true) : []; // Strict=true for 8h requirement
      onChangeDraft(rows);
    } catch {
      // don't block UI; onChangeDraft will receive [] if invalid
      onChangeDraft([]);
    }
  }, [malattia, mode, permHours, rolHours, permRolSum, onChangeDraft]);

  const handleConfirm = () => {
    if (!valid) return;
    let draft = [];
    if (malattia) draft = buildMalattia8();
    else if (mode === 'ferie') draft = buildFerie8();
    else if (mode === 'permRolOnly') draft = buildPermRol(permHours, rolHours, false);
    else if (mode === 'feriePermRol') draft = buildPermRol(permHours, rolHours, true); // Strict=true for 8h requirement
    // Call onChangeDraft before onConfirm as requested
  try { onChangeDraft(draft); } catch { /* ignore */ }
    onConfirm(draft);
  };

  return (
    <Dialog open onClose={onCancel} fullWidth maxWidth="sm">
      <DialogTitle>Assenza personale — {employeeName} — {parsedDate}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography>Malattia (8h) — esclusiva</Typography>
            <Switch checked={malattia} onChange={(e) => { setMalattia(e.target.checked); if (e.target.checked) { setMode('ferie'); setPermHours(0); setRolHours(0); } }} />
          </Stack>
          <Divider />
          <Typography>Conta come</Typography>
          <RadioGroup value={mode} onChange={(e) => {
            const newMode = e.target.value;
            setMode(newMode);
            // Initialize hours when switching to feriePermRol
            if (newMode === 'feriePermRol' && permRolSum !== 8) {
              setPermHours(4);
              setRolHours(4);
            }
          }} row>
            <FormControlLabel value="ferie" control={<Radio />} label="Ferie (8h)" disabled={malattia} />
            <FormControlLabel value="permRolOnly" control={<Radio />} label="Permessi/ROL" disabled={malattia} />
            <FormControlLabel value="feriePermRol" control={<Radio />} label="FERIE(Permessi/ROL)" disabled={malattia} />
          </RadioGroup>

          {(mode === 'permRolOnly' || mode === 'feriePermRol') && (
            <Stack direction="row" spacing={2} alignItems="center">
              <TextField 
                label="Ore PERMESSO" 
                type="number" 
                value={permHours} 
                onChange={(e) => handlePermHoursChange(e.target.value)} 
                inputProps={{ min: 0, max: 8, step: 0.5 }} 
              />
              <TextField 
                label="Ore ROL" 
                type="number" 
                value={rolHours} 
                onChange={(e) => handleRolHoursChange(e.target.value)} 
                inputProps={{ min: 0, max: 8, step: 0.5 }} 
              />
              {mode === 'feriePermRol' && (
                <Typography variant="body2" sx={{ minWidth: 80, color: 'text.secondary' }}>
                  = {permRolSum}h
                </Typography>
              )}
            </Stack>
          )}

          {mode === 'permRolOnly' && permRolSum <= 0 && (
            <Typography color="error">Inserire almeno 1 ora tra PERMESSO e ROL</Typography>
          )}
          {mode === 'permRolOnly' && permRolSum > 8 && (
            <Typography color="error">La somma non può superare 8h</Typography>
          )}
          {mode === 'feriePermRol' && permRolSum !== 8 && (
            <Typography color="error">La somma deve essere esattamente 8h (compensazione automatica)</Typography>
          )}

          {/* no balances here per spec (optional) */}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Annulla</Button>
        <Button onClick={handleConfirm} disabled={!valid} variant="contained">Salva</Button>
      </DialogActions>
    </Dialog>
  );
}

PersonalAbsenceEditor.propTypes = {
  employeeName: PropTypes.string.isRequired,
  dateKey: PropTypes.string.isRequired,
  initial: PropTypes.array,
  onChangeDraft: PropTypes.func,
  onConfirm: PropTypes.func,
  onCancel: PropTypes.func,
};
