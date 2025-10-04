import React, { useState, useMemo, useCallback } from 'react';
import { Box, Container, Alert, Typography, Snackbar } from '@mui/material';
import MuiAlert from '@mui/material/Alert';
import PageHeader from '@components/PageHeader';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import BadgeCard from '@components/BadgeCard/Badge';
import StagedChangesPanel from '@components/Timesheet/StagedChangesPanel';
import WorkCalendar from '@components/Calendar/WorkCalendar';
import DayEntryPanel from '@components/Calendar/DayEntryPanel';
import CommesseDashboard from '@components/DipendenteHomePage/CommesseDashboard';
import { TimesheetProvider, useTimesheetContext, useReferenceData } from '@/Hooks/Timesheet';
import useDayEditBuffer from '@/Hooks/Timesheet/useDayEditBuffer';
import useMonthCompleteness from '@/Hooks/Timesheet/useMonthCompleteness';
import useEmployeeTimesheetLoader from '@/Hooks/Timesheet/refactor/useEmployeeTimesheetLoader';
import useMergedEmployeeData from '@/Hooks/Timesheet/refactor/useMergedEmployeeData';
import useAutoStageDay from '@/Hooks/Timesheet/refactor/useAutoStageDay';

function InnerDipendente({ employeeId }) {
  const ctx = useTimesheetContext();
  // Load data once
  useEmployeeTimesheetLoader(employeeId);

  const [selectedDay, setSelectedDay] = useState(null);
  const [draftsByDay, setDraftsByDay] = useState({});

  const prevMonthDate = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d;
  }, []);
  const baseForCompleteness = ctx.dataMap?.[employeeId] || {};
  const { missingDates: missingPrev, missingSet: missingPrevSet } = useMonthCompleteness({
    tsMap: { [employeeId]: baseForCompleteness },
    id: employeeId,
    year: prevMonthDate.getFullYear(),
    month: prevMonthDate.getMonth()
  });
  const { commesse: commesseList, loading: commesseLoading } = useReferenceData({
    commesse: true,
    personale: false,
    pmGroups: false,
    employeeId
  });

  // Edit buffer for selected day
  const dayBuffer = useDayEditBuffer({
    employeeId,
    dayKey: selectedDay,
    dataMap: { [employeeId]: ctx.dataMap?.[employeeId] || {} },
    stagedMap: ctx.stagedMap
  });

  // Track drafts per day (only for dirty days not yet staged as deletion)
  const updateDraftsForSelected = useCallback(() => {
    if (!selectedDay) return;
    const draftArr = Array.isArray(dayBuffer.draft) ? dayBuffer.draft : [];
    if (dayBuffer.dirty) {
      setDraftsByDay(prev => ({ ...prev, [selectedDay]: draftArr.slice() }));
    } else if (draftsByDay[selectedDay]) {
      setDraftsByDay(prev => {
        const n = { ...prev };
        delete n[selectedDay];
        return n;
      });
    }
  }, [selectedDay, dayBuffer.dirty, dayBuffer.draft, draftsByDay]);
  React.useEffect(updateDraftsForSelected, [updateDraftsForSelected]);

  // Auto-stage hook
  useAutoStageDay({
    employeeId,
    selectedDay,
    draft: dayBuffer.draft,
    onDelete: () => {
      /* no toast now */
    },
    onError: () => {
      /* could set toast */
    }
  });

  // Merged data view (base + staged + drafts overlay)
  const mergedData = useMergedEmployeeData(employeeId, draftsByDay);

  const todayKey = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const isBadgiatoToday = useMemo(
    () => Boolean(mergedData?.[todayKey]?.length),
    [mergedData, todayKey]
  );

  const handleAddRecord = useCallback(
    (day, nextRecords) => {
      if (day === selectedDay) {
        const arr = Array.isArray(nextRecords) ? nextRecords : [nextRecords];
        dayBuffer.setDraft(arr);
      }
    },
    [selectedDay, dayBuffer]
  );

  // Toast state (kept for potential errors / info)
  const [toast, setToast] = useState({ open: false, msg: '', severity: 'info' });
  const showToast = useCallback(
    (msg, severity = 'info') => setToast({ open: true, msg, severity }),
    []
  );

  return (
    <Box sx={{ bgcolor: 'background.default', height: '100vh', overflow: 'auto' }}>
      <Container maxWidth="xl" sx={{ mt: 4 }}>
        <Box
          sx={{
            mb: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2
          }}
        >
          <PageHeader
            title="Timesheet"
            description="Riepilogo e inserimento ore"
            icon={<AccessTimeIcon />}
          />
          <BadgeCard isBadgiato={isBadgiatoToday} />
        </Box>
        <Box
          sx={{
            mb: 3,
            boxShadow: 8,
            borderRadius: 2,
            bgcolor: 'customBackground.main',
            p: 2
          }}
        ><StagedChangesPanel compact maxVisible={5} showLegend /></Box>
        {missingPrev.length > 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Attenzione: non hai completato il mese precedente ({missingPrev.length}{' '}
            giorni mancanti).
          </Alert>
        )}
        <Box
          sx={{
            boxShadow: 8,
            borderRadius: 2,
            bgcolor: 'customBackground.main',
            py: 4,
            px: 8,
            mb: 4,
            display: 'flex',
            flexDirection: 'row',
            gap: 4,
            alignItems: 'flex-start'
          }}
        >
          <Box sx={{ flex: 2, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            {selectedDay ? (
              <>
                {commesseLoading && (
                  <Alert severity="info" sx={{ mb: 1 }}>
                    Caricamento commesse...
                  </Alert>
                )}
                <DayEntryPanel
                  selectedDay={selectedDay}
                  data={(() => {
                    const synthetic = { ...mergedData };
                    if (selectedDay)
                      synthetic[selectedDay] = dayBuffer.dirty
                        ? dayBuffer.draft
                        : mergedData[selectedDay] || [];
                    return synthetic;
                  })()}
                  onAddRecord={handleAddRecord}
                  commesse={commesseList}
                />
                <Typography variant="caption" sx={{ mt: 2, opacity: 0.7 }}>
                  Le modifiche vengono salvate in staging automaticamente. Usa il
                  pannello in alto per Annullare o Confermare.
                </Typography>
              </>
            ) : (
              <Alert
                severity="info"
                sx={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                Seleziona un giorno.
              </Alert>
            )}
          </Box>
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
          ><WorkCalendar data={mergedData} selectedDay={selectedDay} onDaySelect={setSelectedDay} variant="wide" highlightedDays={missingPrevSet} stagedDays={ctx.stagedMap?.[employeeId] ? new Set(Object.keys(ctx.stagedMap[employeeId])) : undefined} /></Box>
        </Box>
        <Box
          sx={{
            boxShadow: 8,
            borderRadius: 2,
            bgcolor: 'customBackground.main',
            py: 3,
            px: 4,
            mb: 4
          }}
        ><CommesseDashboard employeeId={employeeId} assignedCommesse={commesseList} data={mergedData} /></Box>
      </Container>
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <MuiAlert
          onClose={() => setToast(s => ({ ...s, open: false }))}
          severity={toast.severity}
          elevation={6}
          variant="filled"
        >
          {toast.msg}
        </MuiAlert>
      </Snackbar>
    </Box>
  );
}

export default function DipendenteTimesheet({ employeeId: propEmployeeId }) {
  // Fallback: if no prop provided, rely on first id passed to provider (here we still pass single array)
  const effectiveId = propEmployeeId || 'emp-001';
  return (
    <TimesheetProvider scope="single" employeeIds={[effectiveId]}>
      <InnerDipendente employeeId={effectiveId} />
    </TimesheetProvider>
  );
}
