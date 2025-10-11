import React from 'react';
import PropTypes from 'prop-types';
import DayEntryTile from '@domains/timesheet/components/calendar/DayEntryTile';
import formatDayTooltip from '@domains/timesheet/components/calendar/formatDayTooltip';

/**
 * DayCell
 * Pure, memoizable component for rendering a single calendar day cell.
 * Receives all data as props - no context or hooks usage.
 * Designed to prevent unnecessary re-renders when context changes.
 */
export function DayCell({
  dateKey,
  day,
  entries = [],
  status,
  isSelected = false,
  isHoliday = false,
  isOutOfMonth = false,
  segnalazione,
  onClick,
  onDoubleClick,
  variant = 'default',
  iconSize = 14,
  showDayNumber = true
}) {
  // Calculate total hours from entries
  const totalHours = entries.reduce((sum, entry) => sum + (Number(entry?.ore) || 0), 0);
  
  // Determine if hours should be shown
  const showHours = totalHours > 0 && status !== 'ferie' && status !== 'malattia' && status !== 'non-work-full';
  
  // Determine icon position
  const iconTopRight = status === 'complete' || status === 'partial' || status === 'permesso' || status === 'rol';
  
  // Generate tooltip content
  const tooltipContent = formatDayTooltip(entries, segnalazione, totalHours);
  
  // Stable handlers for dateKey
  const onClickDate = React.useCallback(() => onClick?.(dateKey), [onClick, dateKey]);
  const onDoubleClickDate = React.useCallback(() => onDoubleClick?.(dateKey), [onDoubleClick, dateKey]);

  return (
    <DayEntryTile
      dateStr={dateKey}
      day={day}
      isSelected={isSelected}
      isHoliday={isHoliday}
      isOutOfMonth={isOutOfMonth}
      totalHours={totalHours}
      status={status}
      showHours={showHours}
      showDayNumber={showDayNumber}
      iconTopRight={iconTopRight}
      tooltipContent={tooltipContent}
      variant={variant}
      iconSize={iconSize}
      onClickDate={onClickDate}
      onDoubleClickDate={onDoubleClickDate}
    />
  );
}

DayCell.displayName = 'DayCell';

DayCell.propTypes = {
  dateKey: PropTypes.string.isRequired,
  day: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  entries: PropTypes.array.isRequired,
  status: PropTypes.string,
  isSelected: PropTypes.bool,
  isHoliday: PropTypes.bool,
  isOutOfMonth: PropTypes.bool,
  segnalazione: PropTypes.any,
  onClick: PropTypes.func,
  onDoubleClick: PropTypes.func,
  variant: PropTypes.oneOf(['default', 'wide', 'compact']),
  iconSize: PropTypes.number,
  showDayNumber: PropTypes.bool,
};

export default React.memo(DayCell);