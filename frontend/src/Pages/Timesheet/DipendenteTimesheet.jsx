import React, { useState } from "react";
import { Box, Container, Alert, Button } from "@mui/material";
import PageHeader from "@components/PageHeader";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import BadgeCard from "@components/BadgeCard/Badge";
import StagedChangesPanel from '@components/Timesheet/StagedChangesPanel';
import WorkCalendar from "@components/Calendar/WorkCalendar";
import DayEntryPanel from "@components/Calendar/DayEntryPanel";
import { projectsMock, OPERAI } from "@mocks/ProjectMock";
import { useReferenceData, useTimesheetContext, TimesheetProvider } from '@/Hooks/Timesheet';
import { useDipendenteTimesheetData } from '@/Hooks/Timesheet/DipendenteTimesheet/useDipendenteTimesheetData';
import useMonthCompleteness from '@/Hooks/Timesheet/useMonthCompleteness';
import CommesseDashboard from "@components/DipendenteHomePage/CommesseDashboard";
export default function DipendenteTimesheet() {
  const [selectedDay, setSelectedDay] = useState(null);
  // Core timesheet data and handlers (mocked projects passed for now)
  const ctx = (() => { try { return useTimesheetContext(); } catch (_) { return null; } })();
  const { data, handleAddRecord, todayKey, isBadgiatoToday } = useDipendenteTimesheetData(projectsMock, { onStage: ctx ? (day, records) => ctx.stageUpdate('emp-001', day, records) : undefined });

  // Current employee id (replace with real id from auth/store when available)
  const currentEmployeeId = "emp-001";
  // show previous month completeness warning for the current employee
  const prev = new Date(); prev.setMonth(prev.getMonth() - 1);
  const { missingDates: missingPrev, missingSet: missingPrevSet } = useMonthCompleteness({ tsMap: { [currentEmployeeId]: projectsMock }, id: currentEmployeeId, year: prev.getFullYear(), month: prev.getMonth() });
  // Load active 'commesse' for the employee via unified reference data hook
  const { commesse: commesseList, loading: commesseLoading, error: commesseError } = useReferenceData({ commesse: true, personale: false, pmGroups: false, employeeId: currentEmployeeId });

  const commitMyStaged = React.useCallback(() => {
    if (ctx && typeof ctx.commitStagedFor === 'function') ctx.commitStagedFor(currentEmployeeId, async (payload) => {
      const apply = (await import('@hooks/Timesheet/utils/applyStagedToMock')).default;
      return apply(payload);
    });
  }, [ctx]);

  const discardMyStaged = React.useCallback(() => {
    if (ctx && typeof ctx.discardStaged === 'function') ctx.discardStaged({ employeeId: currentEmployeeId });
  }, [ctx]);

  return (
    <TimesheetProvider scope="single" employeeIds={[currentEmployeeId]}>
    <Box sx={{ bgcolor: "background.default", height: "100vh", overflow: "auto" }}>
      <Container maxWidth="xl" sx={{ mt: 4 }}>
        {/* Page header and status badge */}
        <Box sx={{ mb: 4, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
          <PageHeader
            title="Timesheet"
            description="Riepilogo e inserimento ore"
            icon={<AccessTimeIcon />}
          />
          <BadgeCard
            // Badge reflects today's clock-in/clock-out status
            isBadgiato={isBadgiatoToday}
          />
        </Box>
        {missingPrev.length > 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>Attenzione: non hai completato il timesheet del mese precedente ({missingPrev.length} giorni mancanti). Compila i giorni mancanti.</Alert>
        )}
        {/* Main layout: left = day detail, right = month calendar */}
        <Box sx={{
          boxShadow: 8,
          borderRadius: 2,
          bgcolor: 'customBackground.main',
          py: 4,
          px: 8,
          mb: 4,
          display: 'flex',
          flexDirection: 'row',
          height: '100%',
          alignItems: 'flex-end',
          justifyContent: 'stretch',
          gap: 4,
        }}>
          {/* Left column: day detail and controls */}
          <Box sx={{ flex: 2, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100%' }}>
            {selectedDay ? (
              <>
                {commesseLoading && (
                  <Alert severity="info" sx={{ mb: 1 }}>
                    Caricamento commesse attive per il dipendente...
                  </Alert>
                )}
                <DayEntryPanel
                  selectedDay={selectedDay}
                  data={data}
                  onAddRecord={handleAddRecord}
                  commesse={commesseList}
                />
                <Box sx={{ mt: 2, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                  <StagedChangesPanel showActions={false} />
                </Box>
              </>
            ) : (
              <Alert
                severity="info"
                sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                Seleziona un giorno per inserire o modificare i dati.
              </Alert>
            )}
          </Box>

          {/* Right column: month calendar */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', my: 2, minWidth: 0 }}>
            <WorkCalendar
              data={data}
              selectedDay={selectedDay}
              onDaySelect={(d) => { setSelectedDay(d); }}
              variant="wide"
              highlightedDays={missingPrevSet}
              stagedDays={ctx && ctx.stagedMap && ctx.stagedMap[currentEmployeeId] ? new Set(Object.keys(ctx.stagedMap[currentEmployeeId] || {})) : undefined}
            />
          </Box>
        </Box>

        {/* Dashboard with per-commessa charts and stats */}
        <Box sx={{ boxShadow: 8, borderRadius: 2, bgcolor: "customBackground.main", py: 3, px: 4, mb: 4 }}>
          <CommesseDashboard employeeId={currentEmployeeId} assignedCommesse={commesseList} data={data} />
        </Box>
      </Container>
    </Box>
    </TimesheetProvider>
  );
}
