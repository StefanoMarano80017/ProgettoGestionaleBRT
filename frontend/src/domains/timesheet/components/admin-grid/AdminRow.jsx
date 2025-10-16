import React, { useMemo, memo } from 'react';
import PropTypes from 'prop-types';
import { Box, Avatar, Typography, Chip, Stack } from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import { computeDayStatus } from '@domains/timesheet/components/calendar/utils/dayStatus';
import DayEntryTile from '@domains/timesheet/components/calendar/DayEntryTile';
import { getCommessaColor } from '@shared/utils/commessaColors';
import formatDayTooltip from '@domains/timesheet/components/calendar/formatDayTooltip';

/**
 * AdminRow
 * Single employee row in admin timesheet grid
 * Memoized for performance with virtualization
 */
const AdminRow = memo(function AdminRow({
  employee,
  year,
  month,
  dataMap,
  stagedMetaForEmp,
  stagingEntries,
  isSelected,
  onSelectEmployee,
  onDayDoubleClick,
  daysInMonth,
  isWeekendMap,
  totalWidth,
  onDaySelect,
  selectedDay,
  highlightedDates,
  rowIndex,
  shouldBlockClickRef
}) {
  const theme = useTheme();
  const employeeData = dataMap?.[employee.id] || {};
  const stagedEntriesForEmployee = stagingEntries?.[employee.id] || {};
  const today = useMemo(() => new Date(), []);

  const evenRowBg = theme.palette.mode === 'dark'
    ? alpha(theme.palette.background.paper, 0.42)
    : theme.palette.common.white;
  const oddRowBg = theme.palette.mode === 'dark'
    ? alpha(theme.palette.background.paper, 0.32)
    : alpha(theme.palette.grey[100], 0.95);
  const selectedRowBg = alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.08 : 0.03);
  const selectedRowHoverBg = alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.12 : 0.05);
  const rowBgColor = isSelected ? selectedRowBg : (rowIndex % 2 === 0 ? evenRowBg : oddRowBg);

  const selectedHighlightColor = alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.22 : 0.12);
  const employeeColumnBaseBg = theme.palette.mode === 'dark'
    ? alpha(theme.palette.customBackground?.main || theme.palette.primary.dark, 1)
    : theme.palette.customBlue3?.main || theme.palette.primary.dark;
  const employeeColumnHighlightOverlay = isSelected
    ? alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.22 : 0.16)
    : 'transparent';
  const employeeColumnBoxShadowBase = theme.palette.mode === 'dark'
    ? '2px 0 8px rgba(3, 8, 20, 0.5)'
    : '2px 0 10px rgba(0, 19, 40, 0.48)';
  const employeeColumnTextColor = theme.palette.common.white;
  const dayColumnEvenBg = theme.palette.mode === 'dark'
    ? alpha(theme.palette.background.paper, 0.28)
    : alpha(theme.palette.grey[50], 0.9);
  const dayColumnOddBg = theme.palette.mode === 'dark'
    ? alpha(theme.palette.background.paper, 0.2)
    : alpha(theme.palette.common.white, 0.95);

  // Generate days for current month
  const days = useMemo(() => {
    const daysArray = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayOfWeek = new Date(year, month, d).getDay();
      daysArray.push({
        day: d,
        dateStr,
        dayOfWeek,
        isWeekend: isWeekendMap?.[dateStr] || dayOfWeek === 0 || dayOfWeek === 6
      });
    }
    return daysArray;
  }, [year, month, daysInMonth, isWeekendMap]);

  const avatarSeed = useMemo(() => {
    if (!employee) return 'dipendente';
    const fullName = `${employee.nome || ''} ${employee.cognome || ''}`.trim();
    return fullName || employee.username || employee.id || 'dipendente';
  }, [employee]);

  const avatarBackground = useMemo(() => getCommessaColor(avatarSeed), [avatarSeed]);
  const avatarTextColor = useMemo(() => theme.palette.getContrastText(avatarBackground), [theme, avatarBackground]);
  return (
    <Box
      sx={{
        display: 'flex',
        borderBottom: '1px solid',
        borderColor: 'divider',
        minHeight: 70,
        alignItems: 'center',
        cursor: 'pointer',
        position: 'relative',
        bgcolor: rowBgColor,
        transition: 'background-color 160ms ease-in-out',
        '&:hover': {
          bgcolor: isSelected
            ? selectedRowHoverBg
            : alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.14 : 0.08)
        }
      }}
      role="button"
      tabIndex={0}
      onClick={() => {
        if (shouldBlockClickRef?.current) return;
        onSelectEmployee?.(employee.id);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelectEmployee?.(employee.id);
        }
      }}
    >
      {isSelected && (
        <Box
          sx={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 3,
            bgcolor: 'primary.main',
            pointerEvents: 'none',
            opacity: 0.5
          }}
        />
      )}
      {/* Fixed Left Column - Employee Info */}
      <Box
        sx={{
          width: 240,
          flexShrink: 0,
          p: 1.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          borderRight: '1px solid',
          borderColor: alpha(theme.palette.common.white, theme.palette.mode === 'dark' ? 0.12 : 0.18),
          bgcolor: employeeColumnBaseBg,
          position: 'sticky',
          left: 0,
          zIndex: 2,
          height: '100%',
          boxShadow: isSelected
            ? `${employeeColumnBoxShadowBase}, inset 0 0 0 999px ${employeeColumnHighlightOverlay}`
            : employeeColumnBoxShadowBase,
          color: employeeColumnTextColor
        }}
      >
        <Avatar
          sx={{
            bgcolor: avatarBackground,
            color: avatarTextColor,
            width: 36,
            height: 36,
            fontSize: '0.9rem',
            fontWeight: 600,
            border: '2px solid rgba(0,0,0,0.14)'
          }}
        >
          {employee.nome?.[0]}{employee.cognome?.[0]}
        </Avatar>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              color: employeeColumnTextColor
            }}
          >
            {employee.nome} {employee.cognome}
          </Typography>
          <Stack direction="row" spacing={0.5} sx={{ mt: 1 }}>
            {employee.roles?.map((role) => (
              <Chip
                key={role}
                label={role}
                size="small"
                sx={{
                  height: 18,
                  fontSize: '0.65rem',
                  color: employeeColumnTextColor,
                  borderColor: alpha(theme.palette.common.white, 0.24),
                  borderWidth: 1,
                  borderStyle: 'solid',
                  backgroundColor: alpha(theme.palette.common.white, 0.12),
                  '& .MuiChip-label': {
                    px: 0.75
                  }
                }}
              />
            ))}
          </Stack>
        </Box>
      </Box>

      {/* Days Grid - No individual scrolling, controlled by parent */}
      <Box
        sx={{
          display: 'flex',
          minWidth: totalWidth - 240, // Fixed width minus employee column
          overflow: 'visible' // Let parent control scrolling
        }}
      >
        {days.map(({ day, dateStr, dayOfWeek, isWeekend }) => {
          const committedEntries = employeeData[dateStr] || [];
          const segnalazione = employeeData[`${dateStr}_segnalazione`] || null;
          const stagedEntry = stagedEntriesForEmployee?.[dateStr] || null;
          const mergedEntries = stagedEntry
            ? (stagedEntry.draft === null ? [] : stagedEntry.draft)
            : committedEntries;

          const statusResult = computeDayStatus({
            dayData: mergedEntries,
            dayOfWeek,
            segnalazione,
            dateStr,
            isHoliday: false,
            today
          });

          const totalHours = mergedEntries.reduce((sum, rec) => sum + (Number(rec?.ore) || 0), 0);

          const baseHours = committedEntries.reduce((sum, rec) => sum + (Number(rec?.ore) || 0), 0);

          const stagedOp = stagedMetaForEmp?.[dateStr] || null;
          let stagedStatus = null;
          if (stagedOp === 'create') stagedStatus = 'staged-insert';
          else if (stagedOp === 'delete') stagedStatus = 'staged-delete';
          else if (stagedOp === 'update') stagedStatus = 'staged-update';

          const effectiveStatus = stagedStatus || statusResult.status;

          const stagedLabels = {
            create: 'Nuova giornata',
            update: 'Modifica in sospeso',
            delete: 'Eliminazione programmata'
          };

          let tooltipContent;
          if (isSelected) {
            const baseTooltip = formatDayTooltip(mergedEntries, segnalazione, totalHours);
            if (stagedOp) {
              tooltipContent = (
                <Stack spacing={1} sx={{ maxWidth: 360 }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: theme.palette.warning.light }}>
                    {`${stagedLabels[stagedOp] || 'Modifica in sospeso'} — ${totalHours}h${totalHours !== baseHours ? ` (da ${baseHours}h)` : ''}`}
                  </Typography>
                  {baseTooltip}
                </Stack>
              );
            } else {
              tooltipContent = baseTooltip;
            }
          }

          const isSelectedDay = isSelected && selectedDay === dateStr;
          const isHighlighted = isSelected && highlightedDates?.has?.(dateStr);
          const isEvenColumn = day % 2 === 0;
          const columnBaseBg = isSelected
            ? alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.12 : 0.06)
            : (isEvenColumn ? dayColumnEvenBg : dayColumnOddBg);

          const applySelectionStyle = isSelected && (isSelectedDay || isHighlighted);
          const tileBackground = applySelectionStyle ? selectedHighlightColor : 'transparent';

          return (
            <Box
              key={dateStr}
              sx={{
                minWidth: 60,
                height: 60,
                p: 0.5,
                backgroundColor: tileBackground === 'transparent' ? columnBaseBg : tileBackground,
                transition: 'all 160ms ease-in-out'
              }}
            >
              <DayEntryTile
                dateStr={dateStr}
                day={day}
                isWeekend={isWeekend}
                status={effectiveStatus}
                totalHours={totalHours}
                showHours={statusResult.showHours}
                isSelected={applySelectionStyle}
                bgcolor={tileBackground}
                onClick={() => {
                  if (isSelected) {
                    onDaySelect?.(employee.id, dateStr);
                  }
                }}
                onDoubleClick={() => onDayDoubleClick(employee.id, dateStr)}
                stagedOp={stagedOp}
                stagedStatus={stagedStatus}
                tooltipContent={tooltipContent}
                variant="compact"
              />
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}, (prevProps, nextProps) => {
  // Shallow comparison for memoization
  return (
    prevProps.employee.id === nextProps.employee.id &&
    prevProps.year === nextProps.year &&
    prevProps.month === nextProps.month &&
    prevProps.dataMap === nextProps.dataMap &&
    prevProps.stagedMetaForEmp === nextProps.stagedMetaForEmp &&
  prevProps.stagingEntries === nextProps.stagingEntries &&
    prevProps.onSelectEmployee === nextProps.onSelectEmployee &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.daysInMonth === nextProps.daysInMonth &&
    prevProps.totalWidth === nextProps.totalWidth &&
    prevProps.onDaySelect === nextProps.onDaySelect &&
    prevProps.selectedDay === nextProps.selectedDay &&
    prevProps.highlightedDates === nextProps.highlightedDates &&
    prevProps.rowIndex === nextProps.rowIndex &&
    prevProps.shouldBlockClickRef === nextProps.shouldBlockClickRef
  );
});

AdminRow.propTypes = {
  employee: PropTypes.shape({
    id: PropTypes.string.isRequired,
    nome: PropTypes.string.isRequired,
    cognome: PropTypes.string.isRequired,
    roles: PropTypes.arrayOf(PropTypes.string),
    azienda: PropTypes.string
  }).isRequired,
  year: PropTypes.number.isRequired,
  month: PropTypes.number.isRequired,
  dataMap: PropTypes.object,
  stagedMetaForEmp: PropTypes.object,
  stagingEntries: PropTypes.object,
  isSelected: PropTypes.bool,
  onSelectEmployee: PropTypes.func,
  onDayDoubleClick: PropTypes.func.isRequired,
  daysInMonth: PropTypes.number.isRequired,
  isWeekendMap: PropTypes.object,
  totalWidth: PropTypes.number.isRequired,
  onDaySelect: PropTypes.func,
  selectedDay: PropTypes.string,
  highlightedDates: PropTypes.instanceOf(Set),
  rowIndex: PropTypes.number,
  shouldBlockClickRef: PropTypes.shape({ current: PropTypes.bool })
};

AdminRow.displayName = 'AdminRow';

export default AdminRow;
