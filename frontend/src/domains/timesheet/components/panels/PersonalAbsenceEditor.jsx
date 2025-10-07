import React, { useState, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, RadioGroup, FormControlLabel, Radio, Switch, TextField, Stack, Typography, Divider } from '@mui/material';
import { buildMalattia8, buildFerie8, buildPermRol, buildMix, containsMalattia } from '@domains/timesheet/hooks/dayEntry/useNonWorkDraftBuilder';

export default function PersonalAbsenceEditor({ employeeId, employeeName, dateKey, initial = [], onChangeDraft = () => {}, onConfirm = () => {}, onCancel = () => {} }) {
  const parsedDate = dateKey || '';

  // Modes: ferie | permRol | mix
  const [mode, setMode] = useState('ferie');
  const [malattia, setMalattia] = useState(false);
  const [permHours, setPermHours] = useState(0);
  const [rolHours, setRolHours] = useState(0);

  useEffect(() => {
    // initialize from initial entries if provided
    if (!initial || !Array.isArray(initial) || initial.length === 0) return;
    const nw = initial.filter(r => ['FERIE','PERMESSO','ROL','MALATTIA'].includes(String(r.commessa).toUpperCase()));
    if (nw.length === 0) return;
    const codes = nw.map(r => String(r.commessa).toUpperCase());
    if (codes.includes('MALATTIA')) {
      setMalattia(true);
      setMode('ferie');
      setPermHours(0); setRolHours(0);
      return;
    }
  const perm = nw.filter(r => String(r.commessa).toUpperCase() === 'PERMESSO').reduce((s,r)=>s+Number(r.ore||0),0);
  const rol = nw.filter(r => String(r.commessa).toUpperCase() === 'ROL').reduce((s,r)=>s+Number(r.ore||0),0);
    const ferie = nw.filter(r => String(r.commessa).toUpperCase() === 'FERIE').reduce((s,r)=>s+Number(r.ore||0),0);
    if (ferie === 8 && perm === 0 && rol === 0) { setMode('ferie'); }
    else if (ferie === 0 && (perm+rol) === 8) { setMode('permRol'); setPermHours(perm); setRolHours(rol); }
    else { setMode('mix'); setPermHours(perm); setRolHours(rol); }
  }, [initial]);

  const permRolSum = Number(permHours || 0) + Number(rolHours || 0);
  const ferieComputed = mode === 'mix' ? Math.max(0, 8 - permRolSum) : (mode === 'ferie' ? 8 : 0);

  const valid = useMemo(() => {
    if (malattia) return true;
    if (mode === 'ferie') return true;
    if (mode === 'permRol') return permRolSum === 8;
    if (mode === 'mix') return permRolSum <= 8;
    return false;
  }, [malattia, mode, permRolSum]);

  // Notify draft changes when inputs change
  useEffect(() => {
    try {
      let rows = [];
      if (malattia) rows = buildMalattia8();
      else if (mode === 'ferie') rows = buildFerie8();
      else if (mode === 'permRol') rows = (permRolSum === 8) ? buildPermRol(permHours, rolHours) : [];
      else if (mode === 'mix') rows = (permRolSum <= 8) ? buildMix(permHours, rolHours) : [];
      onChangeDraft(rows);
    } catch (err) {
      // don't block UI; onChangeDraft will receive [] if invalid
      onChangeDraft([]);
    }
  }, [malattia, mode, permHours, rolHours, ferieComputed, onChangeDraft]);

  const handleConfirm = () => {
    if (!valid) return;
    let draft = [];
    if (malattia) draft = buildMalattia8();
    else if (mode === 'ferie') draft = buildFerie8();
    else if (mode === 'permRol') draft = buildPermRol(permHours, rolHours);
    else if (mode === 'mix') draft = buildMix(permHours, rolHours);
    // Call onChangeDraft before onConfirm as requested
    try { onChangeDraft(draft); } catch (e) { /* ignore */ }
    onConfirm(draft);
  };

  return (
    <Dialog open={true} onClose={onCancel} fullWidth maxWidth="sm">
      <DialogTitle>Assenza personale — {employeeName} — {parsedDate}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography>Malattia (8h) — esclusiva</Typography>
            <Switch checked={malattia} onChange={(e) => { setMalattia(e.target.checked); if (e.target.checked) { setMode('ferie'); setPermHours(0); setRolHours(0); } }} />
          </Stack>
          <Divider />
          <Typography>Conta come</Typography>
          <RadioGroup value={mode} onChange={(e) => setMode(e.target.value)} row>
            <FormControlLabel value="ferie" control={<Radio />} label="Ferie (8h)" disabled={malattia} />
            <FormControlLabel value="permRol" control={<Radio />} label="Permessi/ROL (8h)" disabled={malattia} />
            <FormControlLabel value="mix" control={<Radio />} label="Mix (ferie + perm/ROL)" disabled={malattia} />
          </RadioGroup>

          {(mode === 'permRol' || mode === 'mix') && (
            <Stack direction="row" spacing={2} alignItems="center">
              <TextField label="Ore PERMESSO" type="number" value={permHours} onChange={(e) => setPermHours(Number(e.target.value || 0))} inputProps={{ min: 0, max: 8 }} />
              <TextField label="Ore ROL" type="number" value={rolHours} onChange={(e) => setRolHours(Number(e.target.value || 0))} inputProps={{ min: 0, max: 8 }} />
              {mode === 'mix' && (
                <TextField label="Ferie (calcolato)" value={ferieComputed} InputProps={{ readOnly: true }} />
              )}
            </Stack>
          )}

          {mode === 'permRol' && permRolSum !== 8 && (
            <Typography color="error">La somma di PERMESSO e ROL deve essere esattamente 8h</Typography>
          )}
          {mode === 'mix' && permRolSum > 8 && (
            <Typography color="error">La somma di PERMESSO e ROL non può superare 8h</Typography>
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
  employeeId: PropTypes.string.isRequired,
  employeeName: PropTypes.string.isRequired,
  dateKey: PropTypes.string.isRequired,
  initial: PropTypes.array,
  onChangeDraft: PropTypes.func,
  onConfirm: PropTypes.func,
  onCancel: PropTypes.func,
};
