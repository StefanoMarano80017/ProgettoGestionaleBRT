import React, { useState, useMemo } from 'react';
import { Box, Container, Alert, Typography, Snackbar, Paper, ButtonGroup, Button, Stack } from '@mui/material';
import MuiAlert from '@mui/material/Alert';
import PageHeader from '@shared/components/PageHeader';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import UndoIcon from '@mui/icons-material/Undo';
import CloseIcon from '@mui/icons-material/Close';
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

  // Merged data view (base + staging overlay + local drafts) using new staging selectors
  const { mergedData } = useStableMergedDataMap({ dataMap: ctx?.dataMap || {}, staging, employeeId, mode: 'single' });
  const stagedMetaAll = useStagedMetaMap(staging);
  const stagedMeta = useMemo(() => stagedMetaAll[employeeId] || {}, [stagedMetaAll, employeeId]);

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

  const { commesse: commesseList, loading: commesseLoading } = useReferenceData({
    commesse: true,
    personale: false,
    pmGroups: false,
    employeeId
  });

  // Placeholder for missing days logic (currently disabled)
  const missingPrevSet = new Set();

  // Error boundary for data loading
  if (!ctx) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        Errore nel caricamento del contesto timesheet. Riprova più tardi.
      </Alert>
    );
  }

  return (
    <Box sx={{ bgcolor: 'background.default', height: '100vh', overflow: 'auto' }}>
      <Container maxWidth="xl" sx={{ mt: 4 }}>
        {/* Header Section */}
        <Box sx={{ mb: 3 }}>
          <Box
            sx={{
              mb: 3,
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

          <Box sx={{ mb: 2 }}>
            <TimesheetStagingBar />
          </Box>
        </Box>

        {/* Status Alerts Section */}
        <Box sx={{ mb: 3 }}>
          {/* Move: show 'Seleziona un giorno' immediately under the previous-month warning */}
          { !selectedDay && (
            <Alert severity="info" sx={{ textAlign: 'left' }}> Seleziona un giorno. </Alert>
          )}
        </Box>

        {/* Main Content Section */}
        <Box
          sx={{
            borderRadius: 2,
            bgcolor: 'customBackground.main',
            py: 3,
            px: { xs: 2, md: 6 },
            mb: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch'
          }}
        >
          <Typography variant="h5" sx={{ textAlign: 'center', mb: 3, color: 'primary.main', fontWeight: 600 }}>
            Dashboard Timesheet Dipendente
          </Typography>
          <Box
            sx={{
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
            <Box sx={{ height: '100%', borderRadius: 2 }}>
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
          <Box sx={{ 
            flex: '0 0 auto', 
            width: { xs: '100%', md: 420 }, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            height: '100%',
            bgcolor: 'background.default',
            borderRadius: 2,
            p: 2
          }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic', textAlign: 'center', mb: 2 }}>
              Fai doppio click su un giorno per modificare le ore lavorate.
            </Typography>
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
