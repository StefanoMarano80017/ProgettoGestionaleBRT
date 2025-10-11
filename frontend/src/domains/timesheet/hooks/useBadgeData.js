import { useMemo } from 'react';
import { getBadgeDataForEmployee } from '@mocks/BadgeMock';

/**
 * useBadgeData
 * Custom hook to get badge data for an employee
 * 
 * @param {string} employeeId - The employee ID
 * @param {boolean} isBadgiatoToday - Whether the employee has badged today
 * @returns {Object} Badge data including number, last time, and badge status
 */
export function useBadgeData(employeeId, isBadgiatoToday = false) {
  const badgeData = useMemo(() => {
    const data = getBadgeDataForEmployee(employeeId, isBadgiatoToday);
    
    return {
      ...data,
      isBadgiato: isBadgiatoToday
    };
  }, [employeeId, isBadgiatoToday]);

  return badgeData;
}

export default useBadgeData;
