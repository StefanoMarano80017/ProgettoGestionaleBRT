import React from 'react';
import PropTypes from 'prop-types';
import { Box, Paper, Typography } from '@mui/material';
import HeaderCard from './components/HeaderCard';
import PanoramaCard from './components/PanoramaCard';
import InspectorInsightsCard from './components/InspectorInsightsCard';
import { inspectorCardBaseSx, PERIOD_OPTIONS } from './utils';

function AdminEmployeeInspectorView({
  employee,
  monthLabel,
  heroAvatarColor,
  periodOptions,
  effectivePeriod,
  onPeriodChange,
  summaryCards,
  analytics,
  dailyAnalytics,
  hasCommessaData,
  hasAbsenceData,
  hasDailyCommessaData,
  hasDailyAbsenceData,
  commesseDetails,
  hasActiveCommesse,
  hasArchivedCommesse,
  commessaTab,
  onCommessaTabChange,
  referenceLoading,
  selectedDayRecords,
  selectedDaySegnalazione,
  previousMonthStatus,
  formatHours,
  formatDateLabel,
  selectedDay,
  periodReferenceDate,
  onPeriodReferenceChange,
  insightTab,
  onInsightTabChange
}) {
  if (!employee) {
    return (
      <Paper
        elevation={0}
        sx={{
          ...inspectorCardBaseSx,
          mt: 4,
          alignItems: 'center',
          textAlign: 'center',
          gap: 1.5
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Seleziona un dipendente dalla tabella</Typography>
        <Typography variant="body2" color="text.secondary">Usa il calendario principale per esplorare giorni e periodi. Qui troverai gli approfondimenti analitici della persona selezionata.</Typography>
      </Paper>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box
        sx={{
          display: 'grid',
          gap: { xs: 1.5, md: 2 },
          gridAutoFlow: 'row dense',
          gridTemplateColumns: {
            xs: '1fr',
            md: 'repeat(12, minmax(0, 1fr))',
            xl: 'repeat(12, minmax(0, 1fr))'
          },
          height: '100%',
          overflow: 'auto',
          '&::-webkit-scrollbar': {
            width: 8
          },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: 'divider',
            borderRadius: 4
          }
        }}
      >
        <Box sx={{ gridColumn: { xs: '1 / -1', md: '1 / -1' } }}>
          <HeaderCard employee={employee} monthLabel={monthLabel} heroAvatarColor={heroAvatarColor} />
        </Box>

        <Box sx={{ gridColumn: { xs: '1 / -1', md: '1 / -1' } }}>
          <InspectorInsightsCard
            activeTab={insightTab}
            onTabChange={onInsightTabChange}
            dailyProps={{
              selectedDay,
              selectedDayRecords,
              selectedDaySegnalazione,
              formatDateLabel
            }}
            periodProps={{
              referenceLoading,
              effectivePeriod,
              onPeriodChange,
              periodOptions,
              summaryCards,
              periodReferenceDate,
              onPeriodReferenceChange
            }}
          />
        </Box>

        <Box sx={{ gridColumn: { xs: '1 / -1', md: '1 / -1' } }}>
          <PanoramaCard
            commessaTab={commessaTab}
            onCommessaTabChange={onCommessaTabChange}
            analytics={insightTab === 'daily' ? dailyAnalytics : analytics}
            hasCommessaData={insightTab === 'daily' ? hasDailyCommessaData : hasCommessaData}
            hasAbsenceData={insightTab === 'daily' ? hasDailyAbsenceData : hasAbsenceData}
            commesseDetails={commesseDetails}
            hasActiveCommesse={hasActiveCommesse}
            hasArchivedCommesse={hasArchivedCommesse}
            previousMonthStatus={previousMonthStatus}
            formatHours={formatHours}
            insightTab={insightTab}
          />
        </Box>
      </Box>
    </Box>
  );
}

AdminEmployeeInspectorView.propTypes = {
  employee: PropTypes.shape({
    id: PropTypes.string,
    nome: PropTypes.string,
    cognome: PropTypes.string,
    azienda: PropTypes.string,
    username: PropTypes.string,
    roles: PropTypes.arrayOf(PropTypes.string)
  }),
  monthLabel: PropTypes.string.isRequired,
  heroAvatarColor: PropTypes.string,
  periodOptions: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired
    })
  ),
  effectivePeriod: PropTypes.string.isRequired,
  onPeriodChange: PropTypes.func.isRequired,
  periodReferenceDate: PropTypes.oneOfType([
    PropTypes.instanceOf(Date),
    PropTypes.string
  ]),
  onPeriodReferenceChange: PropTypes.func.isRequired,
  summaryCards: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      description: PropTypes.string
    })
  ).isRequired,
  analytics: PropTypes.shape({
    totalWorkHours: PropTypes.number,
    commessaRows: PropTypes.array,
    pieData: PropTypes.array,
    absenceRows: PropTypes.array
  }).isRequired,
  dailyAnalytics: PropTypes.shape({
    totalWorkHours: PropTypes.number,
    commessaRows: PropTypes.array,
    pieData: PropTypes.array,
    absenceRows: PropTypes.array
  }).isRequired,
  hasCommessaData: PropTypes.bool.isRequired,
  hasAbsenceData: PropTypes.bool.isRequired,
  hasDailyCommessaData: PropTypes.bool.isRequired,
  hasDailyAbsenceData: PropTypes.bool.isRequired,
  commesseDetails: PropTypes.shape({
    active: PropTypes.array.isRequired,
    archived: PropTypes.array.isRequired
  }).isRequired,
  hasActiveCommesse: PropTypes.bool.isRequired,
  hasArchivedCommesse: PropTypes.bool.isRequired,
  commessaTab: PropTypes.oneOf(['active', 'archived', 'absences', 'health']).isRequired,
  onCommessaTabChange: PropTypes.func.isRequired,
  referenceLoading: PropTypes.bool,
  selectedDayRecords: PropTypes.array.isRequired,
  selectedDaySegnalazione: PropTypes.object,
  previousMonthStatus: PropTypes.shape({
    label: PropTypes.string,
    isComplete: PropTypes.bool,
    ratio: PropTypes.number,
    missingCount: PropTypes.number,
    missingSamples: PropTypes.arrayOf(PropTypes.string)
  }),
  formatHours: PropTypes.func.isRequired,
  formatDateLabel: PropTypes.func.isRequired,
  selectedDay: PropTypes.string,
  insightTab: PropTypes.oneOf(['daily', 'period']).isRequired,
  onInsightTabChange: PropTypes.func.isRequired
};

AdminEmployeeInspectorView.defaultProps = {
  employee: null,
  heroAvatarColor: undefined,
  periodOptions: PERIOD_OPTIONS,
  referenceLoading: false,
  selectedDaySegnalazione: null,
  previousMonthStatus: null,
  selectedDay: null,
  periodReferenceDate: null
};

export default AdminEmployeeInspectorView;
