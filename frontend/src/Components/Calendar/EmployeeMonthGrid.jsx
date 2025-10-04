import React, { useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Box, Typography, Checkbox, Tooltip } from '@mui/material';
import { alpha } from '@mui/material/styles';
import DayEntryTile from './DayEntryTile';
import useEmployeeMonthGridRows from '@hooks/Timesheet/useEmployeeMonthGridRows';

const GAP = 4; // px, like WorkCalendarGrid (gap: 0.5)

export function EmployeeMonthGrid({
  year,
  month, // 0-based
  rows = [],
  tsMap = {},
  onDayClick,
  onEmployeeClick,
  statsSelection = null,
  onToggleStats,
  selectedEmpId = null,
  selectedDate = null,
  height = 520,
  dayWidth = 52,
  dayHeight = 28,
  dipWidth = 240,
  azWidth = 130,
  sx = {},
  rowHighlights = new Set(),
  highlightedDaysMap = {},
  stagedDaysMap = {},
}) {
  const { daysInMonth, visualRows } = useEmployeeMonthGridRows({ rows, tsMap, year, month });
  const gridTemplateColumns = useMemo(
    () => `${dipWidth}px ${azWidth}px ${Array.from({ length: daysInMonth }).map(() => `${dayWidth}px`).join(' ')}`,
    [dipWidth, azWidth, dayWidth, daysInMonth]
  );

  const leftCellSx = useMemo(() => ({
    position: 'sticky', left: 0, zIndex: 3, width: dipWidth, bgcolor: 'background.paper', display: 'flex', alignItems: 'center', fontWeight: 600, pl: 1,
  }), [dipWidth]);

  const aziendaCellSx = useMemo(() => ({
    position: 'sticky', left: dipWidth + GAP, zIndex: 3, width: azWidth, bgcolor: 'background.paper', display: 'flex', alignItems: 'center', fontWeight: 600, pl: 1,
  }), [dipWidth, azWidth]);

  const headerDays = useMemo(() => Array.from({ length: daysInMonth }).map((_, i) => i + 1), [daysInMonth]);

  const EmployeeRow = React.memo(function EmployeeRow({ row }) {
    const variant = dayHeight < 44 ? 'compact' : 'default';
    const effectiveDayHeight = variant === 'compact' ? 44 : dayHeight;

    const handleEmployeeClick = useCallback(() => {
      if (onEmployeeClick) onEmployeeClick(row);
    }, [onEmployeeClick, row]);

    const onDayClickForRow = useCallback((dateStr) => {
      if (onDayClick) onDayClick(row, dateStr);
    }, [onDayClick, row]);

    const displayName = row.name || row.dipendente || row.id;
    const isRowHighlighted = rowHighlights && (rowHighlights.has ? rowHighlights.has(row.id) : Array.isArray(rowHighlights) && rowHighlights.includes(row.id));

    return (
      <Box
        key={row.id}
        sx={{
          display: 'grid',
          gridTemplateColumns,
          alignItems: 'center',
          columnGap: `${GAP}px`,
          rowGap: `${GAP}px`,
          mb: 0.75,
        }}
      >
        <Box sx={{ ...leftCellSx, display:'flex', gap:0.5, bgcolor: 'customBackground.main', border: '1px solid', borderColor: 'divider', borderRadius: 1, px: 0.5, py: 0.5, fontSize: 14, fontWeight: 500, alignItems:'center', ...(isRowHighlighted ? { boxShadow: (t) => `0 0 0 6px ${alpha(t.palette.warning.main, 0.12)}` } : {}) }} title={displayName}>
          {onToggleStats && (
            <Tooltip title={statsSelection && (statsSelection.has ? statsSelection.has(row.id) : statsSelection.includes(row.id)) ? 'Escludi dalle statistiche' : 'Includi nelle statistiche'}>
              <Checkbox size="small" sx={{ p:0, mr:0.5 }}
                checked={statsSelection ? (statsSelection.has ? statsSelection.has(row.id) : statsSelection.includes(row.id)) : true}
                onChange={() => onToggleStats(row)}
              />
            </Tooltip>
          )}
          <Box sx={{ flex:1, cursor: onEmployeeClick ? 'pointer' : 'default', '&:hover': onEmployeeClick ? { textDecoration:'underline' } : {} }} onClick={onEmployeeClick ? handleEmployeeClick : undefined}>
            {displayName}
          </Box>
        </Box>
        <Box sx={{ ...aziendaCellSx, bgcolor: 'customBackground.main', border: '1px solid', borderColor: 'divider', borderRadius: 1, px: 1, py: 0.75, fontSize: 13, color: 'text.secondary' }}>
          {row.azienda || '—'}
        </Box>

        {row.cells.map((cell) => {
          const isSelected = selectedDate === cell.dateStr && selectedEmpId && String(selectedEmpId) === String(row.id);
          const tooltipContent = cell.tooltipContent;
          const rowHighlightedSet = highlightedDaysMap && highlightedDaysMap[row.id];
          const cellHighlighted = rowHighlightedSet && (rowHighlightedSet.has ? rowHighlightedSet.has(cell.dateStr) : Array.isArray(rowHighlightedSet) && rowHighlightedSet.includes(cell.dateStr));
          const rowStagedMap = stagedDaysMap && stagedDaysMap[row.id];
          const cellAction = rowStagedMap ? rowStagedMap[cell.dateStr] : undefined;
          // map action -> status name used by tileStyles
          let stagedStatus = null;
          if (cellAction === 'insert') stagedStatus = 'staged-insert';
          else if (cellAction === 'update') stagedStatus = 'staged-update';
          else if (cellAction === 'delete') stagedStatus = 'staged-delete';
          const effectiveStatus = stagedStatus ? stagedStatus : (cellHighlighted ? 'prev-incomplete' : cell.status);
          return (
            <Box key={`c-${row.id}-${cell.dateStr}`} sx={{ height: effectiveDayHeight }}>
              <DayEntryTile
                dateStr={cell.dateStr}
                day={cell.day}
                isSelected={isSelected}
                status={effectiveStatus}
                variant={variant}
                iconTopRight={false}
                showHours={cell.totalHours > 0}
                totalHours={cell.totalHours}
                onClick={onDayClick ? () => onDayClick(row, cell.dateStr) : undefined}
                tooltipContent={tooltipContent}
                // show day staged status if present
                // DayEntryTile will map 'staged' status via tileStyles
                
                showDayNumber={true}
              />
            </Box>
          );
        })}
      </Box>
    );
  });

  return (
    <Box
      sx={{
        height,
        overflow: "auto",
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.main",
        ...sx,
      }}
    >
      {/* Header sticky */}
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 2,
          display: "grid",
          gridTemplateColumns,
          alignItems: "stretch",
          columnGap: `${GAP}px`,
          rowGap: `${GAP}px`,
          px: 1,
          py: 0.75,
          bgcolor: "background.paper",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        {/* Intestazioni fisse a sinistra */}
        <Box
          sx={{
            position: "sticky",
            left: 0,
            zIndex: 3,
            width: dipWidth,
            bgcolor: "background.paper",
            display: "flex",
            alignItems: "center",
            fontWeight: 600,
            pl: 1,
          }}
        >
          Dipendente
        </Box>
        <Box
          sx={{
            position: "sticky",
            left: dipWidth + GAP,
            zIndex: 3,
            width: azWidth,
            bgcolor: "background.paper",
            display: "flex",
            alignItems: "center",
            fontWeight: 600,
            pl: 1,
          }}
        >
          Azienda
        </Box>

        {/* Giorni */}
        {headerDays.map((d) => (
          <Box
            key={`h-${d}`}
            sx={{
              textAlign: "center",
              fontWeight: 600,
              color: "text.primary",
              borderRadius: 1,
              py: 0.5,
            }}
          >
            {d}
          </Box>
        ))}
      </Box>

      {/* Body righe */}
      <Box sx={{ px: 1, py: 1, bgcolor: "background.main", borderBottomLeftRadius: 8, borderBottomRightRadius: 8 }}>
        {visualRows.map((row) => (
          <EmployeeRow key={row.id} row={row} />
        ))}

        {!rows.length && (
          <Box sx={{ py: 6, textAlign: "center", color: "text.secondary" }}>
            <Typography variant="body2">Nessun dipendente corrisponde ai filtri.</Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}

EmployeeMonthGrid.propTypes = {
  year: PropTypes.number.isRequired,
  month: PropTypes.number.isRequired,
  rows: PropTypes.array,
  tsMap: PropTypes.object,
  rowHighlights: PropTypes.oneOfType([PropTypes.instanceOf(Set), PropTypes.array]),
  highlightedDaysMap: PropTypes.object,
  stagedDaysMap: PropTypes.object,
  onDayClick: PropTypes.func,
  onEmployeeClick: PropTypes.func,
  selectedEmpId: PropTypes.any,
  selectedDate: PropTypes.string,
  height: PropTypes.number,
  dayWidth: PropTypes.number,
  dayHeight: PropTypes.number,
  dipWidth: PropTypes.number,
  azWidth: PropTypes.number,
  sx: PropTypes.object,
};

EmployeeMonthGrid.displayName = 'EmployeeMonthGrid';

export default React.memo(EmployeeMonthGrid);