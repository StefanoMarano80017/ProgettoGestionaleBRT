import { useCallback } from 'react';

/**
 * useCalendarController
 * Centralizes day interaction logic (click, double click, keyboard) with stable callbacks.
 * 
 * @param {Object} params
 * @param {Function} params.openEditor - Function to open day editor (employeeId, dateKey)
 * @param {Function} params.setSelectedDateKey - Function to set selected date
 * @param {string|null} params.activeEmployeeId - Current active employee ID
 * @returns {Object} { onDayClick, onDayDoubleClick, onKeyDown }
 */
export default function useCalendarController({ 
  openEditor, 
  setSelectedDateKey, 
  activeEmployeeId 
}) {
  // Handle single click - just select the day
  const onDayClick = useCallback((dateKey) => {
    if (setSelectedDateKey) {
      setSelectedDateKey(dateKey);
    }
  }, [setSelectedDateKey]);

  // Handle double click - select day and open editor
  const onDayDoubleClick = useCallback((dateKey) => {
    if (setSelectedDateKey) {
      setSelectedDateKey(dateKey);
    }
    if (openEditor && activeEmployeeId) {
      openEditor(activeEmployeeId, dateKey);
    }
  }, [setSelectedDateKey, openEditor, activeEmployeeId]);

  // Handle keyboard navigation (optional enhancement)
  const onKeyDown = useCallback((event, selectedDateKey) => {
    if (!selectedDateKey) return;

    switch (event.key) {
      case 'Enter':
      case ' ': // Spacebar
        event.preventDefault();
        if (openEditor && activeEmployeeId) {
          openEditor(activeEmployeeId, selectedDateKey);
        }
        break;
      
      case 'ArrowLeft':
      case 'ArrowRight':
      case 'ArrowUp':
      case 'ArrowDown':
        // TODO: Implement arrow key navigation between days
        // This would require additional logic to calculate adjacent dates
        // and handle month boundaries
        event.preventDefault();
        break;
        
      default:
        // Let other keys pass through
        break;
    }
  }, [openEditor, activeEmployeeId]);

  return {
    onDayClick,
    onDayDoubleClick,
    onKeyDown
  };
}