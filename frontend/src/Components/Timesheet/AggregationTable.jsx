import React from 'react';
import PropTypes from 'prop-types';
import { Table, TableHead, TableRow, TableCell, TableBody, Stack, Button, Typography } from '@mui/material';

export default function AggregationTable({ aggregation, includeAbsences, onSelectAll, onDeselectAll }) {
  const { rows, total, absences } = aggregation || { rows: [], total: 0, absences: {} };
  const pct = (h) => total ? ((h / total) * 100).toFixed(1) : '0.0';
  return (
    <>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Typography variant="subtitle2">Aggregazione</Typography>
        <Stack direction="row" spacing={1}>
          {onSelectAll && <Button size="small" onClick={onSelectAll}>Seleziona tutti</Button>}
          {onDeselectAll && <Button size="small" onClick={onDeselectAll}>Deseleziona</Button>}
        </Stack>
      </Stack>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Commessa / Codice</TableCell>
            <TableCell align="right">Ore</TableCell>
            <TableCell align="right">%</TableCell>
            {includeAbsences && <TableCell align="right">Giorni (assenze)</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map(r => (
            <TableRow key={r.commessa}>
              <TableCell>{r.commessa}</TableCell>
              <TableCell align="right">{r.ore}</TableCell>
              <TableCell align="right">{pct(r.ore)}</TableCell>
              {includeAbsences && <TableCell />}
            </TableRow>
          ))}
          {includeAbsences && absences && (
            <>
              {['ferie', 'malattia', 'permesso'].map(k => {
                const data = absences[k];
                if (!data || !data.hours) return null;
                return (
                  <TableRow key={k}>
                    <TableCell sx={{ fontStyle: 'italic' }}>{k.toUpperCase()}</TableCell>
                    <TableCell align="right">{data.hours}</TableCell>
                    <TableCell align="right">{pct(data.hours)}</TableCell>
                    <TableCell align="right">{data.days}</TableCell>
                  </TableRow>
                );
              })}
            </>
          )}
          <TableRow>
            <TableCell sx={{ fontWeight: 600 }}>Totale</TableCell>
            <TableCell align="right" sx={{ fontWeight: 600 }}>{total}</TableCell>
            <TableCell />
            {includeAbsences && <TableCell />}
          </TableRow>
        </TableBody>
      </Table>
    </>
  );
}

AggregationTable.propTypes = {
  aggregation: PropTypes.object,
  includeAbsences: PropTypes.bool,
  onSelectAll: PropTypes.func,
  onDeselectAll: PropTypes.func,
};
