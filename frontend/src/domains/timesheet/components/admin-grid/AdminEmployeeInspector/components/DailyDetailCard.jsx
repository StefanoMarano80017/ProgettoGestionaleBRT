import React from 'react';
import PropTypes from 'prop-types';
import { Paper, Stack, Typography, Chip, Alert } from '@mui/material';
import { inspectorCardBaseSx } from '../utils';
import EntryListItem from '@shared/components/Entries/EntryListItem';

const dailyDetailPropTypes = {
  selectedDay: PropTypes.string,
  selectedDayRecords: PropTypes.array.isRequired,
  selectedDaySegnalazione: PropTypes.object,
  formatDateLabel: PropTypes.func.isRequired
};

const dailyDetailDefaultProps = {
  selectedDay: null,
  selectedDaySegnalazione: null
};

export function DailyDetailContent({
  selectedDay,
  selectedDayRecords,
  selectedDaySegnalazione,
  formatDateLabel
}) {
  return (
    <>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        alignItems={{ xs: 'flex-start', md: 'center' }}
        justifyContent="space-between"
      >
        <Stack spacing={0.5}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Dettaglio giornaliero
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Una vista rapida delle voci registrate nella giornata selezionata.
          </Typography>
        </Stack>
        {selectedDay && <Chip size="small" color="primary" label={formatDateLabel(selectedDay)} />}
      </Stack>

      {!selectedDay ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          Seleziona un giorno dal calendario principale per vedere le voci registrate.
        </Alert>
      ) : selectedDayRecords.length === 0 ? (
        <Alert severity="warning" sx={{ mt: 2 }}>
          Nessuna voce registrata per il giorno selezionato.
        </Alert>
      ) : (
        <Stack spacing={1.5} sx={{ mt: 2 }}>
          {selectedDayRecords.map((record, index) => (
            <Paper
              key={`${selectedDay}-${index}`}
              elevation={0}
              sx={{
                p: 1.5,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: 'customBackground.main'
              }}
            >
              <EntryListItem item={record} />
            </Paper>
          ))}
        </Stack>
      )}

      {selectedDaySegnalazione && (
        <Alert severity={selectedDaySegnalazione.livello || 'warning'} sx={{ mt: 2 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Segnalazione amministrativa
          </Typography>
          <Typography variant="body2">
            {selectedDaySegnalazione.descrizione || 'Segnalazione presente.'}
          </Typography>
        </Alert>
      )}
    </>
  );
}

DailyDetailContent.propTypes = dailyDetailPropTypes;
DailyDetailContent.defaultProps = dailyDetailDefaultProps;

function DailyDetailCard(props) {
  return (
    <Paper elevation={0} sx={{ ...inspectorCardBaseSx }}>
      <DailyDetailContent {...props} />
    </Paper>
  );
}

DailyDetailCard.propTypes = dailyDetailPropTypes;
DailyDetailCard.defaultProps = dailyDetailDefaultProps;

export default DailyDetailCard;
