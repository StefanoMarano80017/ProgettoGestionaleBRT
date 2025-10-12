import React, { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import useReferenceData from '@domains/timesheet/hooks/useReferenceData';
import { getCommessaColor } from '@shared/utils/commessaColors';
import {
  PERIOD_OPTIONS,
  ABSENCE_TYPES,
  NON_WORK_CODES,
  DEFAULT_PERIOD,
  UNKNOWN_COMMESSA_CODE,
  HOURS_PER_FULL_DAY,
  ensurePeriod,
  formatHours,
  formatDateLabel,
  normalizeCommessa,
  sumWorkHours
} from './utils';
import {
  parseDateKey,
  getRangeForPeriod,
  enumerateDateKeys,
  isWithinRange,
  isWorkDay,
  toDateKey,
  startOfWeek,
  startOfMonth,
  startOfYear
} from '../utils/periodUtils';
import AdminEmployeeInspectorView from './AdminEmployeeInspectorView';

function AdminEmployeeInspectorContainer({
  employee,
  month,
  year,
  mergedData,
  baseData,
  selectedDay,
  selectedPeriod,
  onPeriodChange,
  periodReferenceDate,
  onPeriodReferenceChange,
  insightTab,
  onInsightTabChange
}) {
  const avatarSeed = useMemo(() => {
    if (!employee) return 'dipendente';
    const base = `${employee.nome || ''} ${employee.cognome || ''}`.trim();
    return base || employee.username || employee.id || 'dipendente';
  }, [employee]);

  const heroAvatarColor = useMemo(() => getCommessaColor(avatarSeed), [avatarSeed]);
  const effectiveMerged = useMemo(() => mergedData || {}, [mergedData]);
  const effectiveBase = useMemo(() => baseData || {}, [baseData]);

  const derivedSelectedPeriod = selectedPeriod ? ensurePeriod(selectedPeriod) : null;
  const derivedInsightTab = insightTab && ['daily', 'period'].includes(insightTab) ? insightTab : null;
  const [internalPeriod, setInternalPeriod] = useState(derivedSelectedPeriod || DEFAULT_PERIOD);
  const [internalInsightTab, setInternalInsightTab] = useState(derivedInsightTab || 'daily');
  const effectivePeriod = derivedSelectedPeriod || internalPeriod;
  const effectiveInsightTab = derivedInsightTab || internalInsightTab;

  const derivedReferenceKey = useMemo(() => {
    if (!periodReferenceDate) return null;
    if (periodReferenceDate instanceof Date) {
      if (Number.isNaN(periodReferenceDate.getTime())) return null;
      return toDateKey(periodReferenceDate);
    }
    if (typeof periodReferenceDate === 'string') {
      const parsed = parseDateKey(periodReferenceDate);
      return parsed ? toDateKey(parsed) : null;
    }
    return null;
  }, [periodReferenceDate]);

  const fallbackReferenceKey = useMemo(() => {
    if (selectedDay) return selectedDay;
    return toDateKey(new Date(year, month, 1));
  }, [selectedDay, month, year]);

  const [internalReferenceKey, setInternalReferenceKey] = useState(() => derivedReferenceKey || fallbackReferenceKey);

  useEffect(() => {
    if (!derivedReferenceKey) return;
    setInternalReferenceKey((prev) => (prev === derivedReferenceKey ? prev : derivedReferenceKey));
  }, [derivedReferenceKey]);

  useEffect(() => {
    if (derivedReferenceKey) return;
    if (!fallbackReferenceKey) return;
    setInternalReferenceKey((prev) => (prev === fallbackReferenceKey ? prev : fallbackReferenceKey));
  }, [derivedReferenceKey, fallbackReferenceKey]);

  useEffect(() => {
    if (derivedSelectedPeriod && derivedSelectedPeriod !== internalPeriod) {
      setInternalPeriod(derivedSelectedPeriod);
    }
  }, [derivedSelectedPeriod, internalPeriod]);

  useEffect(() => {
    if (derivedInsightTab && derivedInsightTab !== internalInsightTab) {
      setInternalInsightTab(derivedInsightTab);
    }
  }, [derivedInsightTab, internalInsightTab]);

  const handlePeriodChange = (_event, value) => {
    if (!value || value === effectivePeriod) return;
    if (!selectedPeriod) {
      setInternalPeriod(value);
    }
    const currentReference = referenceDate || new Date(year, month, 1);
    handleReferenceChange(currentReference, value);
    if (typeof onPeriodChange === 'function') {
      onPeriodChange(value);
    }
  };

  const handleInsightTabChange = (value) => {
    if (!value) return;
    if (!derivedInsightTab) {
      setInternalInsightTab(value);
    }
    if (typeof onInsightTabChange === 'function') {
      onInsightTabChange(value);
    }
  };

  const monthLabel = useMemo(() => {
    const date = new Date(year, month, 1);
    return date.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
  }, [month, year]);

  const referenceDate = useMemo(() => {
    const parsed = parseDateKey(internalReferenceKey);
    if (parsed) return parsed;
    return new Date(year, month, 1);
  }, [internalReferenceKey, month, year]);

  const alignReferenceToPeriod = useCallback((date, period) => {
    if (!date) return null;
    const base = new Date(date);
    if (Number.isNaN(base.getTime())) return null;
    base.setHours(0, 0, 0, 0);
    switch (period) {
      case 'week':
        return startOfWeek(base);
      case 'year':
        return startOfYear(base);
      case 'month':
      default:
        return startOfMonth(base);
    }
  }, []);

  const handleReferenceChange = useCallback(
    (nextDate, periodOverride = effectivePeriod) => {
      if (!nextDate) return;
      const candidate = nextDate instanceof Date ? nextDate : parseDateKey(nextDate);
      if (!candidate) return;
      const normalized = alignReferenceToPeriod(candidate, periodOverride);
      if (!normalized) return;
      const nextKey = toDateKey(normalized);
      if (!derivedReferenceKey) {
        setInternalReferenceKey((prev) => (prev === nextKey ? prev : nextKey));
      }
      onPeriodReferenceChange?.(normalized);
    },
    [alignReferenceToPeriod, derivedReferenceKey, effectivePeriod, onPeriodReferenceChange]
  );

  const periodRange = useMemo(
    () => getRangeForPeriod(effectivePeriod, referenceDate),
    [effectivePeriod, referenceDate]
  );

  const { commesseConChiuse = [], loading: referenceLoading } = useReferenceData({
    commesse: true,
    personale: false,
    pmGroups: false,
    employeeId: employee?.id
  });

  const commesseLookup = useMemo(() => {
    const map = {};
    (commesseConChiuse || []).forEach((commessa) => {
      if (!commessa?.id) return;
      const key = commessa.id.toUpperCase();
      map[key] = commessa;
      (commessa.sottocommesse || []).forEach((sotto) => {
        if (!sotto?.id) return;
        map[sotto.id.toUpperCase()] = { ...sotto, stato: commessa.stato, parent: commessa };
      });
    });
    return map;
  }, [commesseConChiuse]);

  const commesseDetails = useMemo(() => {
    const active = [];
    const archived = [];
    (commesseConChiuse || []).forEach((commessa) => {
      if (!commessa) return;
      
      // Add sottocommesse as individual items
      if (commessa.sottocommesse && commessa.sottocommesse.length > 0) {
        commessa.sottocommesse.forEach((sotto) => {
          const sottoItem = {
            id: sotto.id,
            nome: sotto.nome || sotto.id,
            stato: commessa.stato,
            periodo:
              sotto.dataInizio && sotto.dataFine
                ? `${new Date(sotto.dataInizio).toLocaleDateString('it-IT')} → ${new Date(sotto.dataFine).toLocaleDateString('it-IT')}`
                : commessa.dataInizio && commessa.dataFine
                ? `${new Date(commessa.dataInizio).toLocaleDateString('it-IT')} → ${new Date(commessa.dataFine).toLocaleDateString('it-IT')}`
                : 'Periodo non disponibile',
            responsabile: sotto.responsabile || commessa.responsabile || '—',
            cliente: commessa.cliente || '—',
            parent: commessa.nome || commessa.id
          };
          if (commessa.stato === 'CHIUSA') archived.push(sottoItem);
          else active.push(sottoItem);
        });
      } else {
        // If no sottocommesse, add the main commessa
        const item = {
          id: commessa.id,
          nome: commessa.nome,
          stato: commessa.stato,
          periodo:
            commessa.dataInizio && commessa.dataFine
              ? `${new Date(commessa.dataInizio).toLocaleDateString('it-IT')} → ${new Date(commessa.dataFine).toLocaleDateString('it-IT')}`
              : 'Periodo non disponibile',
          responsabile: commessa.responsabile || '—',
          cliente: commessa.cliente || '—'
        };
        if (commessa.stato === 'CHIUSA') archived.push(item);
        else active.push(item);
      }
    });
    return { active, archived };
  }, [commesseConChiuse]);

  const entriesByDay = useMemo(
    () => Object.entries(effectiveMerged).filter(([key]) => !key.endsWith('_segnalazione')),
    [effectiveMerged]
  );

  const rangeEntries = useMemo(() => {
    if (!periodRange) return [];
    return entriesByDay
      .map(([dateKey, records]) => {
        const date = parseDateKey(dateKey);
        if (!date || !isWithinRange(date, periodRange)) return null;
        return { dateKey, date, records };
      })
      .filter(Boolean)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [entriesByDay, periodRange]);

  const analytics = useMemo(() => {
    if (!periodRange) {
      return {
        totalWorkHours: 0,
        totalEntries: 0,
        recordedDays: 0,
        activeCommessaCount: 0,
        archivedCommessaCount: 0,
        totalAbsenceHours: 0,
        pieData: [],
        commessaRows: [],
        absenceRows: ABSENCE_TYPES.map(({ code, label }) => ({ code, label, hours: 0, days: 0 }))
      };
    }

    const absenceSummary = ABSENCE_TYPES.reduce((acc, { code }) => {
      acc[code] = { hours: 0, days: new Set() };
      return acc;
    }, {});

    const commessaHours = {};
    const recordedDays = new Set();
    const activeSet = new Set();
    const archivedSet = new Set();
    let totalWorkHours = 0;
    let totalEntries = 0;

    rangeEntries.forEach(({ dateKey, records }) => {
      recordedDays.add(dateKey);
      records.forEach((record) => {
        const ore = Number(record?.ore) || 0;
        if (!ore) return;
        totalEntries += 1;

        const normalized = normalizeCommessa(record?.commessa);
        if (NON_WORK_CODES.has(normalized)) {
          const absence = absenceSummary[normalized];
          if (absence) {
            absence.hours += ore;
            absence.days.add(dateKey);
          }
          return;
        }

        totalWorkHours += ore;
        const key = normalized || UNKNOWN_COMMESSA_CODE;
        commessaHours[key] = (commessaHours[key] || 0) + ore;
        const meta = commesseLookup[key];
        if (meta?.stato === 'CHIUSA') {
          archivedSet.add(key);
        } else if (meta) {
          activeSet.add(key);
        } else {
          activeSet.add(key);
        }
      });
    });

    const pieData = Object.entries(commessaHours)
      .sort((a, b) => b[1] - a[1])
      .map(([code, hours]) => {
        const meta = commesseLookup[code];
        const label = meta?.nome || (code === UNKNOWN_COMMESSA_CODE ? 'Senza codice' : code);
        const value = Math.round(hours * 10) / 10;
        return {
          id: code,
          label,
          value,
          color: getCommessaColor(label || code)
        };
      });

    const commessaRows = pieData.map(({ id, label, value }) => ({
      code: id,
      label,
      hours: value
    }));

    const absenceRows = ABSENCE_TYPES.map(({ code, label }) => {
      const summary = absenceSummary[code];
      return {
        code,
        label,
        hours: summary ? Math.round(summary.hours * 10) / 10 : 0,
        days: summary ? summary.days.size : 0
      };
    });

    const totalAbsenceHours = absenceRows.reduce((sum, row) => sum + row.hours, 0);

    return {
      totalWorkHours: Math.round(totalWorkHours * 10) / 10,
      totalEntries,
      recordedDays: recordedDays.size,
      activeCommessaCount: activeSet.size,
      archivedCommessaCount: archivedSet.size,
      totalAbsenceHours: Math.round(totalAbsenceHours * 10) / 10,
      pieData,
      commessaRows,
      absenceRows
    };
  }, [rangeEntries, commesseLookup, periodRange]);

  const hasCommessaData = analytics.commessaRows.length > 0;
  const hasAbsenceData = analytics.absenceRows.some((row) => row.hours > 0);
  const hasActiveCommesse = commesseDetails.active.length > 0;
  const hasArchivedCommesse = commesseDetails.archived.length > 0;
  const [commessaTab, setCommessaTab] = useState(hasActiveCommesse ? 'active' : 'archived');

  useEffect(() => {
    if (commessaTab === 'active' && !hasActiveCommesse && hasArchivedCommesse) {
      setCommessaTab('archived');
    } else if (commessaTab === 'archived' && !hasArchivedCommesse && hasActiveCommesse) {
      setCommessaTab('active');
    }
  }, [commessaTab, hasActiveCommesse, hasArchivedCommesse]);

  const selectedDayRecords = useMemo(() => {
    if (!selectedDay) return [];
    return effectiveMerged[selectedDay] || [];
  }, [selectedDay, effectiveMerged]);

  const selectedDaySegnalazione = useMemo(() => {
    if (!selectedDay) return null;
    return effectiveBase[`${selectedDay}_segnalazione`] || null;
  }, [selectedDay, effectiveBase]);

  const previousMonthStatus = useMemo(() => {
    if (!referenceDate) return null;
    const previous = new Date(referenceDate);
    previous.setDate(1);
    previous.setMonth(previous.getMonth() - 1);
    const prevRange = getRangeForPeriod('month', previous);
    if (!prevRange) return null;

    const workingKeys = enumerateDateKeys(prevRange).filter((key) => {
      const date = parseDateKey(key);
      return date && isWorkDay(date);
    });

    const capitalizeFirstLetter = (str) => str.charAt(0).toUpperCase() + str.slice(1);

    if (!workingKeys.length) {
      return {
        label: capitalizeFirstLetter(prevRange.start.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })),
        isComplete: true,
        ratio: 1,
        missingCount: 0,
        missingSamples: []
      };
    }

    const missing = [];
    workingKeys.forEach((key) => {
      const hours = sumWorkHours(effectiveMerged[key] || []);
      if (hours < HOURS_PER_FULL_DAY) {
        missing.push(key);
      }
    });

    const ratio = (workingKeys.length - missing.length) / workingKeys.length;

    return {
      label: capitalizeFirstLetter(prevRange.start.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })),
      isComplete: missing.length === 0,
      ratio,
      missingCount: missing.length,
      missingSamples: missing.slice(0, 3).map((key) => formatDateLabel(key))
    };
  }, [referenceDate, effectiveMerged]);

  const summaryCards = useMemo(
    () => [
      {
        id: 'hours',
        title: 'Ore lavorate',
        value: formatHours(analytics.totalWorkHours),
        description: 'Ore complessive registrate nel periodo'
      },
      {
        id: 'days',
        title: 'Giorni registrati',
        value: analytics.recordedDays,
        description: 'Giorni con almeno una voce'
      },
      {
        id: 'active',
        title: 'Commesse attive',
        value: analytics.activeCommessaCount,
        description: 'Con ore nel periodo'
      }
    ],
    [analytics]
  );

  const dailyAnalytics = useMemo(() => {
    const baseAbsenceRows = ABSENCE_TYPES.map(({ code, label }) => ({ code, label, hours: 0, days: 0 }));

    if (!selectedDay || !selectedDayRecords?.length) {
      return {
        totalWorkHours: 0,
        totalEntries: 0,
        recordedDays: selectedDay ? 1 : 0,
        activeCommessaCount: 0,
        archivedCommessaCount: 0,
        totalAbsenceHours: 0,
        pieData: [],
        commessaRows: [],
        absenceRows: baseAbsenceRows
      };
    }

    const absenceSummary = ABSENCE_TYPES.reduce((acc, { code }) => {
      acc[code] = { hours: 0 };
      return acc;
    }, {});

    const commessaHours = {};
    const activeSet = new Set();
    const archivedSet = new Set();
    let totalWorkHours = 0;
    let totalEntries = 0;

    selectedDayRecords.forEach((record) => {
      const ore = Number(record?.ore) || 0;
      if (!ore) return;
      totalEntries += 1;

      const normalized = normalizeCommessa(record?.commessa);
      if (NON_WORK_CODES.has(normalized)) {
        const absence = absenceSummary[normalized];
        if (absence) {
          absence.hours += ore;
        }
        return;
      }

      totalWorkHours += ore;
      const key = normalized || UNKNOWN_COMMESSA_CODE;
      commessaHours[key] = (commessaHours[key] || 0) + ore;
      const meta = commesseLookup[key];
      if (meta?.stato === 'CHIUSA') {
        archivedSet.add(key);
      } else if (meta) {
        activeSet.add(key);
      } else {
        activeSet.add(key);
      }
    });

    const pieData = Object.entries(commessaHours)
      .sort((a, b) => b[1] - a[1])
      .map(([code, hours]) => {
        const meta = commesseLookup[code];
        const label = meta?.nome || (code === UNKNOWN_COMMESSA_CODE ? 'Senza codice' : code);
        const value = Math.round(hours * 10) / 10;
        return {
          id: code,
          label,
          value,
          color: getCommessaColor(label || code)
        };
      });

    const commessaRows = pieData.map(({ id, label, value }) => ({
      code: id,
      label,
      hours: value
    }));

    const absenceRows = ABSENCE_TYPES.map(({ code, label }) => {
      const summary = absenceSummary[code];
      return {
        code,
        label,
        hours: summary ? Math.round(summary.hours * 10) / 10 : 0,
        days: summary && summary.hours > 0 ? 1 : 0
      };
    });

    const totalAbsenceHours = absenceRows.reduce((sum, row) => sum + row.hours, 0);

    return {
      totalWorkHours: Math.round(totalWorkHours * 10) / 10,
      totalEntries,
      recordedDays: totalEntries > 0 ? 1 : 0,
      activeCommessaCount: activeSet.size,
      archivedCommessaCount: archivedSet.size,
      totalAbsenceHours: Math.round(totalAbsenceHours * 10) / 10,
      pieData,
      commessaRows,
      absenceRows
    };
  }, [selectedDay, selectedDayRecords, commesseLookup]);

  const hasDailyCommessaData = dailyAnalytics.commessaRows.length > 0;
  const hasDailyAbsenceData = dailyAnalytics.absenceRows.some((row) => row.hours > 0);

  return (
    <AdminEmployeeInspectorView
      employee={employee}
      monthLabel={monthLabel}
      heroAvatarColor={heroAvatarColor}
      periodOptions={PERIOD_OPTIONS}
      effectivePeriod={effectivePeriod}
      onPeriodChange={handlePeriodChange}
      summaryCards={summaryCards}
      analytics={analytics}
      dailyAnalytics={dailyAnalytics}
      hasCommessaData={hasCommessaData}
      hasAbsenceData={hasAbsenceData}
      hasDailyCommessaData={hasDailyCommessaData}
      hasDailyAbsenceData={hasDailyAbsenceData}
      commesseDetails={commesseDetails}
      hasActiveCommesse={hasActiveCommesse}
      hasArchivedCommesse={hasArchivedCommesse}
      commessaTab={commessaTab}
      onCommessaTabChange={setCommessaTab}
      referenceLoading={referenceLoading}
      selectedDayRecords={selectedDayRecords}
      selectedDaySegnalazione={selectedDaySegnalazione}
      previousMonthStatus={previousMonthStatus}
      formatHours={formatHours}
      formatDateLabel={formatDateLabel}
      selectedDay={selectedDay}
      periodReferenceDate={referenceDate}
      onPeriodReferenceChange={handleReferenceChange}
      insightTab={effectiveInsightTab}
      onInsightTabChange={handleInsightTabChange}
    />
  );
}

AdminEmployeeInspectorContainer.propTypes = {
  employee: PropTypes.shape({
    id: PropTypes.string.isRequired,
    nome: PropTypes.string,
    cognome: PropTypes.string,
    azienda: PropTypes.string,
    username: PropTypes.string,
    roles: PropTypes.arrayOf(PropTypes.string)
  }),
  month: PropTypes.number.isRequired,
  year: PropTypes.number.isRequired,
  mergedData: PropTypes.object,
  baseData: PropTypes.object,
  selectedDay: PropTypes.string,
  selectedPeriod: PropTypes.oneOf(PERIOD_OPTIONS.map((option) => option.value)),
  onPeriodChange: PropTypes.func,
  periodReferenceDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
  onPeriodReferenceChange: PropTypes.func,
  insightTab: PropTypes.oneOf(['daily', 'period']),
  onInsightTabChange: PropTypes.func
};

export default AdminEmployeeInspectorContainer;
