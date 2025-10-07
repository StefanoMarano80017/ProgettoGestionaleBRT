import React, { useState, useMemo } from 'react';
import { Box, Container, Alert, Typography, Snackbar, Paper, ButtonGroup, Button } from '@mui/material';
import MuiAlert from '@mui/material/Alert';
import PageHeader from '@shared/components/PageHeader';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
// navigation icons removed — period controls live inside the dashboard now
import BadgeCard from '@shared/components/BadgeCard/Badge';
import TimesheetStagingBar from '@domains/timesheet/components/staging/TimesheetStagingBar';
import WorkCalendar from '@domains/timesheet/components/calendar/WorkCalendar';
import DayEntryDialog from '@domains/timesheet/components/calendar/DayEntryDialog';
import CommesseDashboard from '@shared/components/DipendenteHomePage/CommesseDashboard';
import { TimesheetProvider, useTimesheetContext, useReferenceData, useTimesheetStaging } from '@domains/timesheet/hooks';
import { findUserById } from '@mocks/UsersMock';
import useAuth from '@/domains/auth/hooks/useAuth';
import useDayEditor from '@domains/timesheet/hooks/useDayEditor';
import useMonthCompleteness from '@domains/timesheet/hooks/useMonthCompleteness';
import useEmployeeTimesheetLoader from '@domains/timesheet/hooks/useEmployeeTimesheetLoader';
import useStableMergedDataMap from '@domains/timesheet/hooks/useStableMergedDataMap';
import useStagedMetaMap from '@domains/timesheet/hooks/staging/useStagedMetaMap';

function InnerDipendente({ employeeId }) {
  const ctx = useTimesheetContext();
  const staging = useTimesheetStaging();
  // Load data once (mock async fetch)
  useEmployeeTimesheetLoader(employeeId);

  const [selectedDay, setSelectedDay] = useState(null);
  const dayEditor = useDayEditor();
  // External draft tracking removed; DayEntryPanel now manages draft & staging internally

  // NOTE: useMonthCompleteness migrated to a minimal version returning { filled, working, ratio } only.
  // Previous missing days logic removed; for now compute a simple previous-month missing count separately (placeholder).
  const prevMonthDate = useMemo(() => { const d = new Date(); d.setMonth(d.getMonth() - 1); return d; }, []);
  const completeness = useMonthCompleteness();
  const missingPrev = [];
  const missingPrevSet = [];
  const { commesse: commesseList, loading: commesseLoading } = useReferenceData({
    commesse: true,
    personale: false,
    pmGroups: false,
    employeeId
  });

  // Editing & auto staging are internal to DayEntryPanel; this page only selects a day and shows staging panel.

  // Merged data view (base + staging overlay + local drafts) using new staging selectors
  const { mergedData } = useStableMergedDataMap({ dataMap: ctx?.dataMap || {}, staging, employeeId, mode: 'single' });
  const stagedMetaAll = useStagedMetaMap(staging);
  const stagedMeta = useMemo(() => stagedMetaAll[employeeId] || {}, [stagedMetaAll, employeeId]);

  // Error boundary for data loading
  if (!ctx) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Errore nel caricamento del contesto timesheet. Riprova più tardi.
      </Alert>
    );
  }

  const todayKey = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const isBadgiatoToday = useMemo(
    () => Boolean(mergedData?.[todayKey]?.length),
    [mergedData, todayKey]
  );

  // Period selection moved from CommesseDashboard to this page (calendar-driven)
  const [period, setPeriod] = useState('month'); // 'week' | 'month' | 'year'
  const [refDateLocal] = useState(new Date());
  // if selectedDay exists, use it as refDate; otherwise use local refDate
  const refDate = selectedDay ? new Date(selectedDay) : refDateLocal;

  // Legacy handleAddRecord removed; DayEntryPanel manages staging internally

  // Toast state (kept for potential errors / info)
  const [toast, setToast] = useState({ open: false, msg: '', severity: 'info' });

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
            helperText={"Fai doppio click su un giorno per aprire l'editor dettagliato. Le modifiche vengono salvate in staging automaticamente dal dialog."}
          />
          <BadgeCard isBadgiato={isBadgiatoToday} />
        </Box>
        <TimesheetStagingBar />
        {/* Placeholder warning: disabled until extended completeness hook restored */}
        {false && missingPrev.length > 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Attenzione: non hai completato il mese precedente ({missingPrev.length} giorni mancanti).
          </Alert>
        )}
        {/* Move: show 'Seleziona un giorno' immediately under the previous-month warning */}
        { !selectedDay && (
          <Box sx={{ mb: 2 }}>
            <Alert severity="info" sx={{ textAlign: 'left' }}> Seleziona un giorno. </Alert>
          </Box>
        )}
        <Box
          sx={{
            boxShadow: 8,
            borderRadius: 2,
            bgcolor: 'customBackground.main',
            py: 3,
            px: { xs: 2, md: 6 },
            mb: 4,
            display: 'flex',
            flexDirection: 'row',
            flexWrap: { xs: 'wrap', md: 'nowrap' },
            gap: 4,
            alignItems: 'flex-start'
          }}
        >
          <Box sx={{ flex: '1 1 600px', minWidth: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
            {selectedDay ? (
              <>
                {commesseLoading && (
                  <Alert severity="info" sx={{ mb: 1 }}> Caricamento commesse... </Alert>
                )}
              </>
            ) : null}

            {/* Commesse dashboard moved to the left column so Histogram + Summary + List appear left of the calendar */}
            <Box sx={{ height: '100%' }}>
              <CommesseDashboard
                employeeId={employeeId}
                assignedCommesse={commesseList}
                data={mergedData}
                period={period}
                refDate={refDate}
                onPeriodChange={(p) => setPeriod(p)}
              />
            </Box>
          </Box>
          {/* Right calendar column */}
          <Box sx={{ flex: '0 0 auto', width: { xs: '100%', md: 420 }, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}>
            {/* Period controls (moved from dashboard) */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }} />
            <WorkCalendar
              data={mergedData}
              selectedDay={selectedDay}
              onDaySelect={setSelectedDay}
              onDayDoubleClick={(d) => { setSelectedDay(d); dayEditor.openEditor(employeeId, d); }}
              variant="wide"
              highlightedDays={missingPrevSet}
              stagedMeta={stagedMeta}
            />
          </Box>
    </Box>
        <DayEntryDialog
          open={dayEditor.isOpen}
          onClose={dayEditor.closeEditor}
            date={dayEditor.date}
            employeeId={dayEditor.employeeId}
            employeeName={(function(){ const m = findUserById(dayEditor.employeeId || employeeId); return m ? `${m.nome} ${m.cognome}` : (dayEditor.employeeId || employeeId); })()}
            data={mergedData}
            commesse={commesseList}
          />
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
  const { user } = useAuth() || {};
  const effectiveId = propEmployeeId || user?.id || 'emp-001';
  return (
    <TimesheetProvider scope="single" employeeIds={[effectiveId]}>
      <InnerDipendente employeeId={effectiveId} />
    </TimesheetProvider>
  );
}
