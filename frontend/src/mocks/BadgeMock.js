/**
 * Badge Mock Data
 * Simulates badge system data for employees
 * Excludes administrative roles
 */

import { listAllUsers } from './UsersMock';

/**
 * Badge Types
 * Different types of badge events
 */
export const BadgeType = Object.freeze({
  ENTRATA: 'ENTRATA',                    // Morning entrance
  USCITA: 'USCITA',                      // Evening exit
  TRASFERTA_IN: 'TRASFERTA_IN',         // Travel start
  TRASFERTA_OUT: 'TRASFERTA_OUT',       // Travel end
  PAUSA_PRANZO_INIZIO: 'PAUSA_PRANZO_INIZIO',  // Lunch break start
  PAUSA_PRANZO_FINE: 'PAUSA_PRANZO_FINE',      // Lunch break end
  BREAK_INIZIO: 'BREAK_INIZIO',         // Break start
  BREAK_FINE: 'BREAK_FINE'              // Break end
});

/**
 * Badge type display labels
 */
export const BadgeTypeLabel = Object.freeze({
  [BadgeType.ENTRATA]: 'Entrata',
  [BadgeType.USCITA]: 'Uscita',
  [BadgeType.TRASFERTA_IN]: 'Trasferta In',
  [BadgeType.TRASFERTA_OUT]: 'Trasferta Out',
  [BadgeType.PAUSA_PRANZO_INIZIO]: 'Pausa Pranzo Inizio',
  [BadgeType.PAUSA_PRANZO_FINE]: 'Pausa Pranzo Fine',
  [BadgeType.BREAK_INIZIO]: 'Break Inizio',
  [BadgeType.BREAK_FINE]: 'Break Fine'
});

/**
 * Generate a daily badge sequence for an employee
 * @param {Date} date - The date for badges
 * @param {boolean} includeBreaks - Include break badges
 * @returns {Array} Array of badge events for the day
 */
function generateDailyBadgeSequence(date, includeBreaks = true) {
  const badges = [];
  const baseDate = new Date(date);
  
  // 1. ENTRATA (8:00-9:00)
  const entrataTime = new Date(baseDate);
  const entrataHour = 8 + Math.floor(Math.random() * 60) / 60;
  entrataTime.setHours(Math.floor(entrataHour), Math.floor((entrataHour % 1) * 60), 0, 0);
  badges.push({
    timestamp: new Date(entrataTime),
    type: BadgeType.ENTRATA,
    label: BadgeTypeLabel[BadgeType.ENTRATA]
  });

  // 2. Optional: BREAK_INIZIO (10:00-10:30)
  if (includeBreaks && Math.random() > 0.5) {
    const breakInizioTime = new Date(baseDate);
    breakInizioTime.setHours(10, Math.floor(Math.random() * 30), 0, 0);
    badges.push({
      timestamp: new Date(breakInizioTime),
      type: BadgeType.BREAK_INIZIO,
      label: BadgeTypeLabel[BadgeType.BREAK_INIZIO]
    });

    // 3. BREAK_FINE (10-15 minutes after break start)
    const breakFineTime = new Date(breakInizioTime);
    breakFineTime.setMinutes(breakFineTime.getMinutes() + 10 + Math.floor(Math.random() * 5));
    badges.push({
      timestamp: new Date(breakFineTime),
      type: BadgeType.BREAK_FINE,
      label: BadgeTypeLabel[BadgeType.BREAK_FINE]
    });
  }

  // 4. PAUSA_PRANZO_INIZIO (12:30-13:30)
  const pranzoInizioTime = new Date(baseDate);
  pranzoInizioTime.setHours(12, 30 + Math.floor(Math.random() * 60), 0, 0);
  badges.push({
    timestamp: new Date(pranzoInizioTime),
    type: BadgeType.PAUSA_PRANZO_INIZIO,
    label: BadgeTypeLabel[BadgeType.PAUSA_PRANZO_INIZIO]
  });

  // 5. PAUSA_PRANZO_FINE (30-60 minutes after lunch start)
  const pranzoFineTime = new Date(pranzoInizioTime);
  pranzoFineTime.setMinutes(pranzoFineTime.getMinutes() + 30 + Math.floor(Math.random() * 30));
  badges.push({
    timestamp: new Date(pranzoFineTime),
    type: BadgeType.PAUSA_PRANZO_FINE,
    label: BadgeTypeLabel[BadgeType.PAUSA_PRANZO_FINE]
  });

  // 6. Optional: TRASFERTA (20% chance)
  if (Math.random() > 0.8) {
    const trasfertaInTime = new Date(baseDate);
    trasfertaInTime.setHours(14, Math.floor(Math.random() * 30), 0, 0);
    badges.push({
      timestamp: new Date(trasfertaInTime),
      type: BadgeType.TRASFERTA_IN,
      label: BadgeTypeLabel[BadgeType.TRASFERTA_IN]
    });

    // TRASFERTA_OUT (2-3 hours after trasferta in)
    const trasfertaOutTime = new Date(trasfertaInTime);
    trasfertaOutTime.setHours(trasfertaOutTime.getHours() + 2 + Math.floor(Math.random() * 2));
    badges.push({
      timestamp: new Date(trasfertaOutTime),
      type: BadgeType.TRASFERTA_OUT,
      label: BadgeTypeLabel[BadgeType.TRASFERTA_OUT]
    });
  }

  // 7. USCITA (17:00-19:00)
  const uscitaTime = new Date(baseDate);
  const uscitaHour = 17 + Math.floor(Math.random() * 120) / 60;
  uscitaTime.setHours(Math.floor(uscitaHour), Math.floor((uscitaHour % 1) * 60), 0, 0);
  badges.push({
    timestamp: new Date(uscitaTime),
    type: BadgeType.USCITA,
    label: BadgeTypeLabel[BadgeType.USCITA]
  });

  return badges;
}

/**
 * Generate mock badge data for a specific employee
 * @param {string} employeeId - The employee ID
 * @param {boolean} isBadgiatoToday - Whether employee has badged today
 * @returns {Object} Badge data with number, last badge time and type
 */
export function getBadgeDataForEmployee(employeeId, isBadgiatoToday = false) {
  const USERS = listAllUsers();
  const user = USERS.find(u => u.id === employeeId);
  
  // Don't generate badge data for admin roles
  const isAdmin = user?.roles?.some(role => 
    role === 'AMMINISTRATORE' || 
    role === 'DIRETTORE_GENERALE' || 
    role === 'DIRETTORE_TECNICO'
  );
  
  if (!user || isAdmin) {
    return {
      badgeNumber: null,
      lastBadgeTime: null,
      lastBadgeType: null,
      hasBadge: false
    };
  }

  const now = new Date();
  let lastBadge = null;

  if (isBadgiatoToday) {
    // Generate today's badges and get the most recent
    const todayBadges = generateDailyBadgeSequence(now, true);
    // Get last badge that happened before now
    const validBadges = todayBadges.filter(b => b.timestamp <= now);
    lastBadge = validBadges.length > 0 ? validBadges[validBadges.length - 1] : todayBadges[0];
  } else {
    // Get yesterday's last badge (USCITA)
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayBadges = generateDailyBadgeSequence(yesterday, true);
    lastBadge = yesterdayBadges[yesterdayBadges.length - 1]; // Last badge is USCITA
  }

  return {
    badgeNumber: employeeId,
    lastBadgeTime: lastBadge?.timestamp || null,
    lastBadgeType: lastBadge?.type || null,
    lastBadgeLabel: lastBadge?.label || null,
    hasBadge: true
  };
}

/**
 * Get all badge records for a specific day
 * @param {string} employeeId - The employee ID
 * @param {Date} date - The date to get badges for
 * @returns {Array} Array of badge records for the day
 */
export function getDailyBadgeRecords(employeeId, date = new Date()) {
  const USERS = listAllUsers();
  const user = USERS.find(u => u.id === employeeId);
  
  // No badge records for admin
  const isAdmin = user?.roles?.some(role => 
    role === 'AMMINISTRATORE' || 
    role === 'DIRETTORE_GENERALE' || 
    role === 'DIRETTORE_TECNICO'
  );
  
  if (!user || isAdmin) {
    return [];
  }

  const badges = generateDailyBadgeSequence(date, true);
  
  return badges.map(badge => ({
    employeeId,
    date: date.toISOString().slice(0, 10),
    timestamp: badge.timestamp,
    type: badge.type,
    label: badge.label
  }));
}

/**
 * Get all badge records for the week
 * @param {string} employeeId - The employee ID
 * @param {Date} weekStart - Start of the week
 * @returns {Array} Array of badge records with types
 */
export function getWeeklyBadgeRecords(employeeId, weekStart = new Date()) {
  const USERS = listAllUsers();
  const user = USERS.find(u => u.id === employeeId);
  
  // No badge records for admin
  const isAdmin = user?.roles?.some(role => 
    role === 'AMMINISTRATORE' || 
    role === 'DIRETTORE_GENERALE' || 
    role === 'DIRETTORE_TECNICO'
  );
  
  if (!user || isAdmin) {
    return [];
  }

  const records = [];
  const start = new Date(weekStart);
  start.setHours(0, 0, 0, 0);

  // Generate badge records for working days (Mon-Fri)
  for (let i = 0; i < 7; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    
    const dayOfWeek = date.getDay();
    // Skip weekends (0 = Sunday, 6 = Saturday)
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    // 90% chance of badge on working days
    if (Math.random() > 0.1) {
      const dayBadges = generateDailyBadgeSequence(date, true);
      
      dayBadges.forEach(badge => {
        records.push({
          employeeId,
          date: date.toISOString().slice(0, 10),
          timestamp: badge.timestamp,
          type: badge.type,
          label: badge.label
        });
      });
    }
  }

  return records;
}

/**
 * Check if employee has badged today
 * @param {string} employeeId - The employee ID
 * @returns {boolean} True if employee has badged today
 */
export function hasBadgedToday(employeeId) {
  const USERS = listAllUsers();
  const user = USERS.find(u => u.id === employeeId);
  
  // Admins don't badge
  const isAdmin = user?.roles?.some(role => 
    role === 'AMMINISTRATORE' || 
    role === 'DIRETTORE_GENERALE' || 
    role === 'DIRETTORE_TECNICO'
  );
  
  if (!user || isAdmin) {
    return false;
  }

  // For mock purposes, return random but consistent value based on ID
  const hash = employeeId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  
  return (hash + dayOfYear) % 3 !== 0; // ~66% chance of being badged
}

export default {
  BadgeType,
  BadgeTypeLabel,
  getBadgeDataForEmployee,
  getDailyBadgeRecords,
  getWeeklyBadgeRecords,
  hasBadgedToday
};
