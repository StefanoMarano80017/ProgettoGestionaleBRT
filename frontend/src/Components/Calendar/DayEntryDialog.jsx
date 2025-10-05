import React, { useRef, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, IconButton, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DayEntryPanel from './DayEntryPanel';

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
        {open && (
          <DayEntryPanel
            selectedDay={date}
            employeeId={employeeId}
            data={data}
            commesse={commesse}
            maxHoursPerDay={8}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
