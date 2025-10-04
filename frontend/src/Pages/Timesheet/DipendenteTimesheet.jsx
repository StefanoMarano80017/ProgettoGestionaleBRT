import React, { useState } from "react";
import { Box, Container, Alert } from "@mui/material";
import PageHeader from "@components/PageHeader";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import BadgeCard from "@components/BadgeCard/Badge";
import WorkCalendar from "@components/Calendar/WorkCalendar";
import DayEntryPanel from "@components/Calendar/DayEntryPanel";
import { projectsMock } from "@mocks/ProjectMock";
import { useReferenceData } from '@/Hooks/Timesheet';
import { useDipendenteTimesheetData } from '@/Hooks/Timesheet/DipendenteTimesheet/useDipendenteTimesheetData';
import CommesseDashboard from "@components/DipendenteHomePage/CommesseDashboard";
export default function DipendenteTimesheet() {
  const [selectedDay, setSelectedDay] = useState(null);
  // Core timesheet data and handlers (mocked projects passed for now)
  const { data, handleAddRecord, todayKey, isBadgiatoToday } = useDipendenteTimesheetData(projectsMock);

  // Current employee id (replace with real id from auth/store when available)
  const currentEmployeeId = "emp-001";
  // Load active 'commesse' for the employee via unified reference data hook
  const { commesse: commesseList, loading: commesseLoading, error: commesseError } = useReferenceData({ commesse: true, personale: false, pmGroups: false, employeeId: currentEmployeeId });

  return (
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
            />
          </Box>
        </Box>

        {/* Dashboard with per-commessa charts and stats */}
        <Box sx={{ boxShadow: 8, borderRadius: 2, bgcolor: "customBackground.main", py: 3, px: 4, mb: 4 }}>
          <CommesseDashboard employeeId={currentEmployeeId} assignedCommesse={commesseList} data={data} />
        </Box>
      </Container>
    </Box>
  );
}
