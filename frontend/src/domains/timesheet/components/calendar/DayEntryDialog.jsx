import React, { useRef, useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, IconButton, Typography, Skeleton, Box, Button, Stack } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DayEntryPanel from './DayEntryPanel';
import PersonalAbsenceEditor from '../panels/PersonalAbsenceEditor';
import useAuth from '@/domains/auth/hooks/useAuth';
import { rolesWithPersonalEntries, getRoleCapabilities, canEditPersonalAbsences } from '@domains/timesheet/hooks/utils/roleCapabilities';
import { useTimesheetStaging } from '@domains/timesheet/hooks/staging';

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
  const [absenceDraft, setAbsenceDraft] = useState(null);
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
      </DialogContent>
    </Dialog>
  );
}
