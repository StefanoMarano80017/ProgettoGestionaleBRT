import React from 'react';
import { NON_WORK_CODES, isWorkCode } from '@domains/timesheet/hooks/utils/timesheetModel.js';

const NON_WORK = new Set(NON_WORK_CODES.map((code) => String(code || '').toUpperCase()));
const dateFormatter = new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });

const extractCommessaId = (code) => {
  if (!code) return null;
  const parts = String(code).split('-');
  if (parts.length >= 3) {
    return parts.slice(0, 3).join('-');
  }
  return code;
};

const toDate = (value) => {
  if (value instanceof Date) return value;
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const addDays = (date, amount) => {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
};

const toKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getFixedHolidays = (year) => {
  const base = [
    [1, 1],
    [1, 6],
    [4, 25],
    [5, 1],
    [6, 2],
    [8, 15],
    [11, 1],
    [12, 8],
    [12, 25],
    [12, 26],
  ];
  return new Set(base.map(([month, day]) => `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`));
};

const buildHolidaySet = (from, to) => {
  if (!from || !to) return new Set();
  const set = new Set();
  for (let year = from.getFullYear(); year <= to.getFullYear(); year += 1) {
    const yearHolidays = getFixedHolidays(year);
    yearHolidays.forEach((key) => set.add(key));
  }
  return set;
};

const isWeekend = (date) => {
  const day = date.getDay();
  return day === 0 || day === 6;
};

const countWorkingDays = (from, to, holidays) => {
  if (!from || !to) return 0;
  let cursor = new Date(from);
  let total = 0;
  while (cursor <= to) {
    if (!isWeekend(cursor)) {
      const key = toKey(cursor);
      if (!holidays.has(key)) {
        total += 1;
      }
    }
    cursor = addDays(cursor, 1);
  }
  return total;
};

const normalizeEntries = (entries) => (Array.isArray(entries) ? entries : []);

const toFullName = (employee) => `${employee?.nome ?? ''} ${employee?.cognome ?? ''}`.trim() || employee?.id;

export default function usePeopleWorkloadData({ timesheetMap, employees, periodStart, periodEnd, commessaMeta }) {
  return React.useMemo(() => {
    const start = toDate(periodStart) || addDays(new Date(), -30);
    const end = toDate(periodEnd) || new Date();
    if (start > end) {
      return { rows: [], summary: { total: 0, withTimesheet: 0 } };
    }

    const holidays = buildHolidaySet(start, end);
    const workingDays = countWorkingDays(start, end, holidays);

    const employeeList = Array.isArray(employees) ? employees : [];
    const timesheets = timesheetMap && typeof timesheetMap === 'object' ? timesheetMap : {};
    const commessaMap = commessaMeta instanceof Map ? commessaMeta : new Map();

    const rows = employeeList.map((employee) => {
      const sheet = timesheets[employee.id] || {};
      let workHours = 0;
      let nonWorkHours = 0;
      const distinctDays = new Set();
      let lastActivityDate = null;
      const workByCommessa = new Map();

      Object.entries(sheet).forEach(([key, value]) => {
        if (key.endsWith('_segnalazione')) return;
        const date = toDate(key);
        if (!date || date < start || date > end) return;
        const dayEntries = normalizeEntries(value);
        if (dayEntries.length === 0) return;
        distinctDays.add(key);
        dayEntries.forEach((entry) => {
          const hours = Number(entry?.ore) || 0;
          const code = String(entry?.commessa || '').toUpperCase();
          if (!hours) return;
          if (NON_WORK.has(code)) {
            nonWorkHours += hours;
          } else if (isWorkCode(code)) {
            workHours += hours;
            const commessaId = extractCommessaId(code);
            if (commessaId) {
              workByCommessa.set(commessaId, (workByCommessa.get(commessaId) || 0) + hours);
            }
          } else {
            workHours += hours;
            const commessaId = extractCommessaId(code);
            if (commessaId) {
              workByCommessa.set(commessaId, (workByCommessa.get(commessaId) || 0) + hours);
            }
          }
        });

        if (dayEntries.some((entry) => isWorkCode(entry?.commessa))) {
          if (!lastActivityDate || date > lastActivityDate) {
            lastActivityDate = date;
          }
        }
      });

      const capacity = Math.max(workingDays * 8, 1);
      const utilization = Math.min(workHours / capacity, 1);
      const assigned = Array.from(workByCommessa.entries())
        .filter(([, hours]) => hours > 0)
        .map(([commessaId, hours]) => {
          const meta = commessaMap.get(commessaId);
          const types = Array.isArray(meta?.types)
            ? meta.types.map((value) => String(value || '').toUpperCase()).filter(Boolean)
            : Array.isArray(meta?.tipo)
              ? meta.tipo.map((value) => String(value || '').toUpperCase()).filter(Boolean)
              : meta?.tipo
                ? [String(meta.tipo).toUpperCase()]
                : ['ENGINEERING'];
          const normalizedTypes = types.length ? Array.from(new Set(types)) : ['ENGINEERING'];
          if (meta && !normalizedTypes.includes('ENGINEERING')) {
            return null;
          }
          const label = meta ? `${meta.codice} · ${meta.nome}` : commessaId;
          return {
            id: commessaId,
            code: meta?.codice || commessaId,
            name: meta?.nome || commessaId,
            label,
            hours: Number((hours || 0).toFixed(1)),
            types: normalizedTypes,
          };
        })
        .filter(Boolean)
        .sort((a, b) => b.hours - a.hours);

      const firstName = employee?.nome || '';
      const lastName = employee?.cognome || '';

      return {
        employeeId: employee.id,
        name: toFullName(employee),
        firstName,
        lastName,
        company: employee.azienda || 'N/D',
        assigned,
        workHours: Number(workHours.toFixed(1)),
        nonWorkHours: Number(nonWorkHours.toFixed(1)),
        utilization,
        utilizationPercent: Math.round(utilization * 100),
        workingDays,
        distinctDays: distinctDays.size,
        isActive: distinctDays.size > 0,
  activeAssignments: assigned.length,
  totalAssignments: assigned.length,
        lastActivity: lastActivityDate,
        lastActivityLabel: lastActivityDate ? dateFormatter.format(lastActivityDate) : null,
        periodStart: start,
        periodEnd: end,
      };
    });

    const summary = {
      total: rows.length,
      withTimesheet: rows.filter((row) => row.isActive).length,
    };

    return { rows, summary };
  }, [timesheetMap, employees, periodStart, periodEnd, commessaMeta]);
}
