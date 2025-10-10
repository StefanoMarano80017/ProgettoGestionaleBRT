import React from 'react';
import PropTypes from 'prop-types';
import WorkCalendarContainer from './WorkCalendarContainer';

/**
 * WorkCalendar
 * Simple wrapper that delegates to WorkCalendarContainer for Single Responsibility.
 * Maintains the same public API for backward compatibility.
 */
export function WorkCalendar(props) {
  return <WorkCalendarContainer {...props} />;
}

WorkCalendar.displayName = 'WorkCalendar';

WorkCalendar.propTypes = {
  data: PropTypes.object,
  selectedDay: PropTypes.string,
  onDaySelect: PropTypes.func,
  onDayDoubleClick: PropTypes.func,
  renderDayTooltip: PropTypes.func,
  highlightedDays: PropTypes.oneOfType([PropTypes.instanceOf(Set), PropTypes.array]),
  // TODO(Assistant, 2025-10-10): stagedDays prop removed - replaced by stagedMeta for Container/View architecture
  fixedDayWidth: PropTypes.bool,
  gap: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  distributeGaps: PropTypes.bool,
  variant: PropTypes.string,
  selectorVariant: PropTypes.string,
  selectorLabels: PropTypes.string,
  stagedMeta: PropTypes.object,
};

export default React.memo(WorkCalendar);
