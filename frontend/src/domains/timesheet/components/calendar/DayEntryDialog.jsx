import React, { useRef, useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, IconButton, Typography, Skeleton, Box, Button, Stack } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DayEntryPanel from './DayEntryPanel';
import PersonalAbsenceEditor from '../panels/PersonalAbsenceEditor';
import PartialPermessoEditor from '../panels/PartialPermessoEditor';
import FullDayPermessoEditor from '../panels/FullDayPermessoEditor';
import useAuth from '@/domains/auth/hooks/useAuth';
import { rolesWithPersonalEntries, getRoleCapabilities, canEditPersonalAbsences } from '@domains/timesheet/hooks/utils/roleCapabilities';
import { useTimesheetStaging } from '@domains/timesheet/hooks/staging';
import { getBalances } from '@domains/timesheet/services/projectService';

/**
 * DayEntryDialog
 * Simple modal wrapper around DayEntryPanel opened via calendar double-click.
 */
export default function DayEntryDialog({
  open,
  onClose,
  date,
  employeeId,
  employeeName,
  data,
  commesse,
}) {
  const [openAbsenceEditor, setOpenAbsenceEditor] = useState(false);
  const [openPartialPermesso, setOpenPartialPermesso] = useState(false);
  const [openFullDayPermesso, setOpenFullDayPermesso] = useState(false);
  const [absenceDraft, setAbsenceDraft] = useState(null);
  const [partialDraft, setPartialDraft] = useState(null);
  const [fullDayDraft, setFullDayDraft] = useState(null);
  const [balances, setBalances] = useState({ permesso: 0, rol: 0 });
  const [error, setError] = useState('');
  const staging = useTimesheetStaging();
  const { user } = useAuth();
  const closeBtnRef = useRef(null);
  const titleId = 'day-entry-dialog-title';
  const descId = 'day-entry-dialog-description';

  useEffect(() => {
    if (open && closeBtnRef.current) {
      // Focus close button for quick keyboard dismissal
      try { closeBtnRef.current.focus(); } catch { /* ignore */ }
    }
  }, [open]);

  const longDate = date ? new Date(date).toLocaleDateString('it-IT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '';
  const empLabel = employeeName ? ` – ${employeeName}` : '';
  const userRoles = Array.isArray(user?.roles) ? user.roles : (user?.role ? [user.role] : []);
  const canOpenAbsenceEditor = userRoles.some((r) => canEditPersonalAbsences(r) || rolesWithPersonalEntries.includes(String(r).toLowerCase()) || getRoleCapabilities(r)?.canEditAll || getRoleCapabilities(r)?.canEditOwn);

  const handlePartialPermessoOpen = async () => {
    try {
      const bal = await getBalances(employeeId);
      setBalances(bal);
      setOpenPartialPermesso(true);
      setError('');
    } catch (err) {
      setError(err.message || 'Errore nel caricamento saldi');
    }
  };

  const handleFullDayPermessoOpen = async () => {
    try {
      const bal = await getBalances(employeeId);
      setBalances(bal);
      setOpenFullDayPermesso(true);
      setError('');
    } catch (err) {
      setError(err.message || 'Errore nel caricamento saldi');
    }
  };

  const handlePartialPermessoConfirm = () => {
    try {
      // Merge behavior: remove existing PERMESSO/ROL from committed entries
      const committed = data?.[date] || [];
      const baseEntries = committed.filter(e => !['PERMESSO', 'ROL'].includes(String(e.commessa).toUpperCase()));
      const merged = [...baseEntries, ...(partialDraft || [])];
      
      if (staging && typeof staging.stageDraft === 'function') {
        staging.stageDraft(employeeId, date, merged, { origin: 'day-entry-dialog.partial-permesso' });
      }
      setOpenPartialPermesso(false);
      setPartialDraft(null);
    } catch (err) {
      setError(err.message || 'Errore nel salvataggio');
    }
  };

  const handleFullDayPermessoConfirm = () => {
    try {
      // Full day PERMESSO/ROL only (no work)
      const draft = fullDayDraft || [];
      if (staging && typeof staging.stageDraft === 'function') {
        staging.stageDraft(employeeId, date, draft, { origin: 'day-entry-dialog.fullday-permesso' });
      }
      setOpenFullDayPermesso(false);
      setFullDayDraft(null);
    } catch (err) {
      setError(err.message || 'Errore nel salvataggio');
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      aria-labelledby={titleId}
      aria-describedby={descId}
    >
      <DialogTitle id={titleId} sx={{ pr: 5 }}>
        {longDate}{empLabel}
        {canOpenAbsenceEditor && (
          <Stack direction="row" spacing={1} sx={{ position: 'absolute', left: 16, top: 8 }}>
            <Button size="small" variant="outlined" onClick={() => setOpenAbsenceEditor(true)}>Assenza personale</Button>
            <Button size="small" variant="outlined" onClick={handlePartialPermessoOpen}>Permesso/ROL parziale</Button>
            <Button size="small" variant="outlined" onClick={handleFullDayPermessoOpen}>Assenza 8h (Permesso/ROL)</Button>
          </Stack>
        )}
        <IconButton
          aria-label="Chiudi"
          onClick={onClose}
          size="small"
          sx={{ position: 'absolute', right: 8, top: 8 }}
          ref={closeBtnRef}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ bgcolor: 'customBackground.main' }}>
        <Typography id={descId} variant="caption" sx={{ display:'block', mb:1, opacity:0.75 }}>
          {longDate}{empLabel}. Le modifiche vengono salvate nello staging automaticamente.
        </Typography>
        {error && (
          <Box sx={{ mb: 2, p: 1, bgcolor: 'error.light', borderRadius: 1 }}>
            <Typography variant="body2" color="error.main">{error}</Typography>
          </Box>
        )}
        {open && (!data || Object.keys(data).length === 0) && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Skeleton variant="text" width="60%" />
            <Skeleton variant="rectangular" height={160} />
            <Skeleton variant="text" width="40%" />
          </Box>
        )}
        {open && data && Object.keys(data).length > 0 && (
          <DayEntryPanel
            selectedDay={date}
            employeeId={employeeId}
            data={data}
            commesse={commesse}
            maxHoursPerDay={8}
          />
        )}
        {/* PersonalAbsenceEditor rendered as a step inside the same dialog */}
        {openAbsenceEditor && (
          <PersonalAbsenceEditor
            employeeId={employeeId}
            employeeName={employeeName}
            dateKey={date}
            initial={data?.[date] || []}
            onChangeDraft={(d) => setAbsenceDraft(d)}
            onCancel={() => { setOpenAbsenceEditor(false); setAbsenceDraft(null); }}
            onConfirm={() => {
              // Stage the draft and close editor
              const draft = absenceDraft || [];
              if (staging && typeof staging.stageDraft === 'function') {
                staging.stageDraft(employeeId, date, draft, { origin: 'day-entry-dialog.personal-absence' });
              }
              setOpenAbsenceEditor(false);
              setAbsenceDraft(null);
            }}
          />
        )}

        {/* PartialPermessoEditor for workdays */}
        <PartialPermessoEditor
          open={openPartialPermesso}
          employeeId={employeeId}
          employeeName={employeeName}
          dateKey={date}
          initial={data?.[date] || []}
          onChangeDraft={(d) => setPartialDraft(d)}
          onConfirm={handlePartialPermessoConfirm}
          onCancel={() => { setOpenPartialPermesso(false); setPartialDraft(null); setError(''); }}
          balances={balances}
        />

        {/* Full-day PERMESSO/ROL Editor */}
        <FullDayPermessoEditor
          open={openFullDayPermesso}
          employeeId={employeeId}
          employeeName={employeeName}
          dateKey={date}
          onChangeDraft={(d) => setFullDayDraft(d)}
          onConfirm={handleFullDayPermessoConfirm}
          onCancel={() => { setOpenFullDayPermesso(false); setFullDayDraft(null); setError(''); }}
          balances={balances}
        />
      </DialogContent>
    </Dialog>
  );
}
