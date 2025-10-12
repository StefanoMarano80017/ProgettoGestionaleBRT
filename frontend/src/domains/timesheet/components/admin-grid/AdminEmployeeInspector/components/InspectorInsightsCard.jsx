import React from 'react';
import PropTypes from 'prop-types';
import { Paper, Tabs, Tab, Box } from '@mui/material';
import { inspectorCardBaseSx } from '../utils';
import { DailyDetailContent } from './DailyDetailCard';
import { PeriodSummaryContent } from './PeriodSummaryCard';

function InspectorInsightsCard({
  activeTab,
  onTabChange,
  dailyProps,
  periodProps
}) {
  const handleChange = (_event, value) => {
    if (!value || value === activeTab) return;
    onTabChange?.(value);
  };

  return (
    <Paper elevation={0} sx={{ ...inspectorCardBaseSx, pb: 2 }}>
      <Tabs
        value={activeTab}
        onChange={handleChange}
        variant="fullWidth"
        sx={{
          mb: 2,
          '& .MuiTab-root': {
            textTransform: 'none',
            fontWeight: 600,
            minHeight: 48
          }
        }}
      >
        <Tab value="daily" label="Dettaglio giornaliero" />
        <Tab value="period" label="Analisi periodo" />
      </Tabs>

      <Box sx={{ mt: 1.5 }}>
        {activeTab === 'daily' ? (
          <DailyDetailContent {...dailyProps} />
        ) : (
          <PeriodSummaryContent {...periodProps} />
        )}
      </Box>
    </Paper>
  );
}

InspectorInsightsCard.propTypes = {
  activeTab: PropTypes.oneOf(['daily', 'period']).isRequired,
  onTabChange: PropTypes.func,
  dailyProps: PropTypes.shape({
    selectedDay: PropTypes.string,
    selectedDayRecords: PropTypes.array.isRequired,
    selectedDaySegnalazione: PropTypes.object,
    formatDateLabel: PropTypes.func.isRequired,
    onOpenSegnalazione: PropTypes.func,
    canSendSegnalazione: PropTypes.bool,
    sendingSegnalazione: PropTypes.bool
  }).isRequired,
  periodProps: PropTypes.shape({
    referenceLoading: PropTypes.bool,
    effectivePeriod: PropTypes.string.isRequired,
    onPeriodChange: PropTypes.func.isRequired,
    periodOptions: PropTypes.array,
    summaryCards: PropTypes.array.isRequired,
    periodReferenceDate: PropTypes.oneOfType([
      PropTypes.instanceOf(Date),
      PropTypes.string
    ]),
    onPeriodReferenceChange: PropTypes.func.isRequired
  }).isRequired
};

InspectorInsightsCard.defaultProps = {
  onTabChange: undefined
};

export default InspectorInsightsCard;
