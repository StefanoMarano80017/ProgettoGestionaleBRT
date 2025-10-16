import React from 'react';
import { Box, Paper, Typography, CircularProgress, Alert, Grid, Stack, Button } from '@mui/material';
import { ArrowBack, Engineering } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { TimesheetProvider, usePmCampoTimesheetState } from '@domains/timesheet/hooks';
import TimesheetStagingBar from '@domains/timesheet/components/staging/TimesheetStagingBar';
import AdminTimesheetGrid from '@domains/timesheet/components/admin-grid/AdminTimesheetGrid';
import DayEntryDialog from '@domains/timesheet/components/calendar/DayEntryDialog';
import GroupManagerPanel from '@domains/timesheet/components/pm-campo/GroupManagerPanel';
import BulkToolsPanel from '@domains/timesheet/components/pm-campo/BulkToolsPanel';
import { PageHero } from '@shared/components/PageHeader/';

function PMCampoInner() {
  const navigate = useNavigate();
  const canNavigateBack = typeof navigate === 'function';

  const {
    month,
    year,
    dataMap,
    dayEditor,
    employees,
    operaiUsers,
    groups,
    personalMap,
    loadingExtras,
    extrasError,
    timesheetLoading,
    selectedEmployeeId,
    selectedEmployeeMeta,
    activeEmployeeMeta,
    activeEmployeeData,
    commesseForEmployee,
    commessaOptions,
    stagingEntries,
    stagingMeta,
    selectedDay,
    selectedDayKey,
    canManageGroups,
    handleSelectEmployee,
    handleDaySelect,
    handleDayDoubleClick,
    handleCloseEditor,
    stageAbsence,
    clearDay,
    assignGroupHours,
    createGroup,
    updateGroup,
    deleteGroup,
    handleValidateDraft,
  } = usePmCampoTimesheetState();

  const isLoading = timesheetLoading || loadingExtras;

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: 3 }}>
      <Box sx={{ width: '100%', px: { xs: 2, md: 4 } }}>
        <PageHero
          title="Timesheet — PM Campo"
          subtitle="Gestisci i timesheet giornalieri degli operai, squadre e riparti ore prima del salvataggio definitivo"
          icon={Engineering}
          useCustomBlueGradient={true}
          showStatusChip={true}
        />

        <TimesheetStagingBar sticky={false} panelProps={{ validateDraft: handleValidateDraft }} />

        {isLoading && (
          <Paper sx={{ p: 4, borderRadius: 2, mb: 3, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress size={32} />
          </Paper>
        )}

        {extrasError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {extrasError}
          </Alert>
        )}

        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid size={{ xs: 12, md: 3, lg: 3 }}>
            <Stack spacing={1.5}>
              <BulkToolsPanel
                month={month}
                year={year}
                selectedEmployee={selectedEmployeeMeta}
                selectedDay={selectedDayKey}
                groups={groups}
                commessaOptions={commessaOptions}
                onStageAbsence={stageAbsence}
                onClearDay={clearDay}
                onAssignGroup={assignGroupHours}
                disabled={!canManageGroups}
              />
              <GroupManagerPanel
                groups={groups}
                operai={operaiUsers}
                personalMap={personalMap}
                disabled={!canManageGroups}
                onCreate={createGroup}
                onUpdate={updateGroup}
                onDelete={deleteGroup}
              />
            </Stack>
          </Grid>
          <Grid size={{ xs: 12, md: 9, lg: 9 }}>
            <Box
              sx={{
                height: '100%',
                minHeight: { xs: 480, md: 600 },
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <AdminTimesheetGrid
                year={year}
                month={month}
                employees={employees}
                dataMap={dataMap}
                stagedMeta={stagingMeta}
                stagingEntries={stagingEntries}
                selectedEmployeeId={selectedEmployeeId}
                onSelectEmployee={handleSelectEmployee}
                onDayDoubleClick={handleDayDoubleClick}
                onDaySelect={handleDaySelect}
                selectedDay={selectedDay}
                highlightedDates={new Set(selectedDay ? [selectedDay] : [])}
              />
            </Box>
          </Grid>
        </Grid>

        <DayEntryDialog
          open={dayEditor.isOpen}
          onClose={handleCloseEditor}
          date={dayEditor.date}
          employeeId={dayEditor.employeeId}
          employeeName={activeEmployeeMeta ? `${activeEmployeeMeta.nome} ${activeEmployeeMeta.cognome}`.trim() : ''}
          data={activeEmployeeData}
          commesse={commesseForEmployee}
        />
      </Box>
    </Box>
  );
}

export default function PMCampoTimesheet() {
  return (
    <TimesheetProvider scope="all" autoLoad>
      <PMCampoInner />
    </TimesheetProvider>
  );
}
