import React from 'react';
import { Box, Typography, Chip, Stack } from '@mui/material';

// Returns a React node suitable as Tooltip content for a day tile.
// dayData: array of entries for the day
// segnalazione: optional report object
// totalHours: numeric total hours
export default function formatDayTooltip(dayData = [], segnalazione = null, totalHours = 0) {
  return (
    <Box sx={{ maxWidth: 360, whiteSpace: 'normal' }}>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>{dayData.length ? `Ore totali: ${totalHours}h` : 'Nessun inserimento'}</Typography>
      <Stack spacing={0.5}>
        {dayData.map((e, i) => (
          <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mr: 1 }}>{e.commessa}</Typography>
            <Chip size="small" label={`${e.ore}h`} sx={{ mr: 1 }} />
            {e.descrizione && <Typography variant="caption" sx={{ color: 'text.secondary' }}>{e.descrizione}</Typography>}
          </Box>
        ))}
      </Stack>
      {segnalazione && (
        <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: 'text.secondary' }}>{`Segnalazione: ${segnalazione.descrizione}`}</Typography>
      )}
    </Box>
  );
}
