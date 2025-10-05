import React, { useState, useMemo } from 'react';
import { Box, Container, Alert, Typography, Snackbar, Paper } from '@mui/material';
import MuiAlert from '@mui/material/Alert';
import PageHeader from '@components/PageHeader';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import BadgeCard from '@components/BadgeCard/Badge';
import TimesheetStagingBar from '@components/Timesheet/TimesheetStagingBar';
import WorkCalendar from '@components/Calendar/WorkCalendar';
import DayEntryDialog from '@components/Calendar/DayEntryDialog';
import CommesseDashboard from '@components/DipendenteHomePage/CommesseDashboard';
import { TimesheetProvider, useTimesheetContext, useReferenceData, useTimesheetStaging } from '@/Hooks/Timesheet';
import useDayEditor from '@hooks/Timesheet/useDayEditor';
import useMonthCompleteness from '@/Hooks/Timesheet/useMonthCompleteness';
import useEmployeeTimesheetLoader from '@/Hooks/Timesheet/useEmployeeTimesheetLoader';
import useStableMergedDataMap from '@hooks/Timesheet/useStableMergedDataMap';
import useStagedMetaMap from '@hooks/Timesheet/staging/useStagedMetaMap';

function InnerDipendente({ employeeId }) {
  const ctx = useTimesheetContext();
  const staging = useTimesheetStaging();
  // Load data once (mock async fetch)
  useEmployeeTimesheetLoader(employeeId);

  const [selectedDay, setSelectedDay] = useState(null);
  const dayEditor = useDayEditor();
  // External draft tracking removed; DayEntryPanel now manages draft & staging internally

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

  // Editing & auto staging are internal to DayEntryPanel; this page only selects a day and shows staging panel.

  // Merged data view (base + staging overlay + local drafts) using new staging selectors
  // Base data only (no staging overlay) for calendar display
  const { mergedData } = useStableMergedDataMap({ dataMap: ctx.dataMap, staging, employeeId, mode: 'single' });
  const baseData = useMemo(() => ctx.dataMap?.[employeeId] || {}, [ctx.dataMap, employeeId]);
  const stagedMetaAll = useStagedMetaMap(staging);
  const stagedMeta = useMemo(() => stagedMetaAll[employeeId] || {}, [stagedMetaAll, employeeId]);

  const todayKey = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const isBadgiatoToday = useMemo(
    () => Boolean(mergedData?.[todayKey]?.length),
    [mergedData, todayKey]
  );

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
          />
          <BadgeCard isBadgiato={isBadgiatoToday} />
        </Box>
        <TimesheetStagingBar />
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
            px: { xs: 3, md: 8 },
            mb: 4,
            display: 'flex',
            flexDirection: 'row',
            flexWrap: { xs: 'wrap', md: 'nowrap' },
            gap: 4,
            alignItems: 'flex-start'
          }}
        >
          <Box sx={{ flex: '1 1 600px', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            {selectedDay ? (
              <>
                {commesseLoading && (
                  <Alert severity="info" sx={{ mb: 1 }}> Caricamento commesse... </Alert>
                )}
                <Typography variant="body2" sx={{ mb: 1 }}>Fai doppio click su un giorno per aprire l'editor dettagliato in una finestra.</Typography>
                <Typography variant="caption" sx={{ opacity: 0.7 }}>Le modifiche vengono salvate in staging automaticamente dal dialog.</Typography>
              </>
            ) : (
              <Alert severity="info" sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }} > Seleziona un giorno. </Alert>
            )}
          </Box>
          {/* Right calendar column */}
          <Box sx={{ flex: '0 0 auto', width: { xs: '100%', md: 420 }, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <WorkCalendar
              data={baseData}
              selectedDay={selectedDay}
              onDaySelect={setSelectedDay}
              onDayDoubleClick={(d) => { setSelectedDay(d); dayEditor.openEditor(employeeId, d); }}
              variant="wide"
              highlightedDays={missingPrevSet}
              stagedMeta={stagedMeta}
            />
          </Box>
        </Box>
  <Box sx={{ boxShadow: 8, borderRadius: 2, bgcolor: 'customBackground.main', py: 3, px: 4, mb: 4 }}><CommesseDashboard employeeId={employeeId} assignedCommesse={commesseList} data={mergedData} /></Box>
              {/* Monthly summary moved here from DayEntryPanel */}
              {mergedData && mergedData.__monthlySummary && (
                <Box sx={{ boxShadow: 4, borderRadius: 2, bgcolor: 'background.paper', py: 2, px: 3, mb: 4 }}>
                  <Typography variant="subtitle1" sx={{ mb: 1 }}>Riepilogo Mensile</Typography>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Chip size="small" label={`Totale: ${mergedData.__monthlySummary.totalHours || 0}h`} sx={{ borderRadius: 1 }} />
                    <Chip size="small" label={`Ferie: ${(mergedData.__monthlySummary.ferie?.days)||0}g (${(mergedData.__monthlySummary.ferie?.hours)||0}h)`} sx={{ borderRadius: 1 }} />
                    <Chip size="small" label={`Malattia: ${(mergedData.__monthlySummary.malattia?.days)||0}g (${(mergedData.__monthlySummary.malattia?.hours)||0}h)`} sx={{ borderRadius: 1 }} />
                    <Chip size="small" label={`Permesso: ${(mergedData.__monthlySummary.permesso?.days)||0}g (${(mergedData.__monthlySummary.permesso?.hours)||0}h)`} sx={{ borderRadius: 1 }} />
                    {(mergedData.__monthlySummary.commesse || []).slice(0,5).map(c => (
                      <Chip key={c.commessa} size="small" color="info" variant="outlined" label={`${c.commessa}: ${c.ore}h`} sx={{ borderRadius:1 }} />
                    ))}
                  </Box>
                </Box>
              )}
        <DayEntryDialog
          open={dayEditor.isOpen}
          onClose={dayEditor.closeEditor}
            date={dayEditor.date}
            employeeId={dayEditor.employeeId}
            employeeName={employeeId}
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
  const effectiveId = propEmployeeId || 'emp-001';
  return (
    <TimesheetProvider scope="single" employeeIds={[effectiveId]}>
      <InnerDipendente employeeId={effectiveId} />
    </TimesheetProvider>
  );
}
