import React from 'react';
import PropTypes from 'prop-types';
import { Box, Paper, Typography, Stack, Button, Tooltip } from '@mui/material';
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';
import HeaderCard from './components/HeaderCard';
import PanoramaCard from './components/PanoramaCard';
import InspectorInsightsCard from './components/InspectorInsightsCard';
import { inspectorCardBaseSx, PERIOD_OPTIONS } from './utils';
import { SegnalazioneDialog } from '@shared/dialogs';
import { BadgeCompact } from '@shared/components/BadgeCard';

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
  onInsightTabChange,
  segnalazioneDialogOpen,
  onOpenSegnalazione,
  onCloseSegnalazione,
  onSendSegnalazione,
  canSendSegnalazione,
  sendingSegnalazione,
  sendingSegnalazioneOk,
  badgeData,
  onOpenBadgeHistory
}) {
  const hasBadgeData = Boolean(badgeData?.hasBadge);
  const badgeHistoryDisabled = !onOpenBadgeHistory;

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
          <Paper
            elevation={0}
            sx={{
              ...inspectorCardBaseSx,
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5
            }}
          >
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }}>
              <Stack spacing={0.5}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>Badge recente</Typography>
                <Typography variant="body2" color="text.secondary">
                  {hasBadgeData ? 'Ultimo movimento badge rilevato.' : 'Nessun badge disponibile per questo profilo.'}
                </Typography>
              </Stack>
              <Tooltip title="Lo storico dettagliato sarà disponibile a breve" placement="top">
                <span>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<HistoryRoundedIcon fontSize="small" />}
                    onClick={() => onOpenBadgeHistory?.()}
                    disabled={badgeHistoryDisabled}
                    sx={{ textTransform: 'none', fontWeight: 600 }}
                  >
                    Storico badge
                  </Button>
                </span>
              </Tooltip>
            </Stack>

            {hasBadgeData ? (
              <Box sx={{ display: 'flex', justifyContent: { xs: 'center', md: 'flex-start' } }}>
                <BadgeCompact
                  isBadgiato={Boolean(badgeData?.isBadgiato)}
                  badgeNumber={badgeData?.badgeNumber || employee?.id}
                  lastBadgeTime={badgeData?.lastBadgeTime}
                  lastBadgeType={badgeData?.lastBadgeType}
                  lastBadgeLabel={badgeData?.lastBadgeLabel}
                  width={460}
                />
              </Box>
            ) : (
              <Typography variant="caption" color="text.secondary">
                Questo dipendente non ha ancora registrazioni badge nel sistema mock.
              </Typography>
            )}
          </Paper>
        </Box>

        <Box sx={{ gridColumn: { xs: '1 / -1', md: '1 / -1' } }}>
          <InspectorInsightsCard
            activeTab={insightTab}
            onTabChange={onInsightTabChange}
            dailyProps={{
              selectedDay,
              selectedDayRecords,
              selectedDaySegnalazione,
              formatDateLabel,
              onOpenSegnalazione,
              canSendSegnalazione,
              sendingSegnalazione
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

      <SegnalazioneDialog
        open={segnalazioneDialogOpen}
        onClose={onCloseSegnalazione}
        onSend={onSendSegnalazione}
        employee={employee}
        selectedDay={selectedDay}
        formatDateLabel={formatDateLabel}
        sending={sendingSegnalazione}
        sendingOk={sendingSegnalazioneOk}
        existingSegnalazione={selectedDaySegnalazione}
      />
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
  onInsightTabChange: PropTypes.func.isRequired,
  segnalazioneDialogOpen: PropTypes.bool,
  onOpenSegnalazione: PropTypes.func,
  onCloseSegnalazione: PropTypes.func,
  onSendSegnalazione: PropTypes.func,
  canSendSegnalazione: PropTypes.bool,
  sendingSegnalazione: PropTypes.bool,
  sendingSegnalazioneOk: PropTypes.string,
  badgeData: PropTypes.shape({
    hasBadge: PropTypes.bool,
    isBadgiato: PropTypes.bool,
    badgeNumber: PropTypes.string,
    lastBadgeTime: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    lastBadgeType: PropTypes.string,
    lastBadgeLabel: PropTypes.string
  }),
  onOpenBadgeHistory: PropTypes.func
};

AdminEmployeeInspectorView.defaultProps = {
  employee: null,
  heroAvatarColor: undefined,
  periodOptions: PERIOD_OPTIONS,
  referenceLoading: false,
  selectedDaySegnalazione: null,
  previousMonthStatus: null,
  selectedDay: null,
  periodReferenceDate: null,
  segnalazioneDialogOpen: false,
  onOpenSegnalazione: undefined,
  onCloseSegnalazione: undefined,
  onSendSegnalazione: undefined,
  canSendSegnalazione: false,
  sendingSegnalazione: false,
  sendingSegnalazioneOk: '',
  badgeData: null,
  onOpenBadgeHistory: undefined
};

export default AdminEmployeeInspectorView;
