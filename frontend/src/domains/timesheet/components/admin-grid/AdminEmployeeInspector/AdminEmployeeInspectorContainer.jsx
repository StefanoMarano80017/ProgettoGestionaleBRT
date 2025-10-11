import React, { useEffect, useMemo, useState } from 'react';
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
  formatRangeLabel,
  enumerateDateKeys,
  isWithinRange,
  isWorkDay
} from '../utils/periodUtils';
import AdminEmployeeInspectorView from './AdminEmployeeInspectorView';

function AdminEmployeeInspectorContainer({
  employee,
  month,
  year,
  mergedData,
  baseData,
  selectedDay,
  onSelectDay,
  selectedPeriod,
  onPeriodChange
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
  const [internalPeriod, setInternalPeriod] = useState(derivedSelectedPeriod || DEFAULT_PERIOD);
  const effectivePeriod = derivedSelectedPeriod || internalPeriod;

  useEffect(() => {
    if (derivedSelectedPeriod && derivedSelectedPeriod !== internalPeriod) {
      setInternalPeriod(derivedSelectedPeriod);
    }
  }, [derivedSelectedPeriod, internalPeriod]);

  const handlePeriodChange = (_event, value) => {
    if (!value) return;
    if (!selectedPeriod) {
      setInternalPeriod(value);
    }
    if (typeof onPeriodChange === 'function') {
      onPeriodChange(value);
    }
  };

  const handleDaySelect = (event) => {
    const value = event.target.value;
    if (!employee) return;
    if (!value) {
      onSelectDay?.(employee.id, null);
      return;
    }
    onSelectDay?.(employee.id, value);
  };

  const monthLabel = useMemo(() => {
    const date = new Date(year, month, 1);
    return date.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
  }, [month, year]);

  const referenceDate = useMemo(() => {
    if (selectedDay) {
      const parsed = parseDateKey(selectedDay);
      if (parsed) return parsed;
    }
    return new Date(year, month, 1);
  }, [selectedDay, month, year]);

  const periodRange = useMemo(
    () => getRangeForPeriod(effectivePeriod, referenceDate),
    [effectivePeriod, referenceDate]
  );

  const periodLabel = useMemo(() => {
    if (!periodRange) return '';
    const rangeLabel = formatRangeLabel(periodRange, effectivePeriod);
    const option = PERIOD_OPTIONS.find((opt) => opt.value === effectivePeriod);
    return option ? `${option.label}: ${rangeLabel}` : rangeLabel;
  }, [periodRange, effectivePeriod]);

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
      const item = {
        id: commessa.id,
        nome: commessa.nome,
        stato: commessa.stato,
        periodo:
          commessa.dataInizio && commessa.dataFine
            ? `${new Date(commessa.dataInizio).toLocaleDateString('it-IT')} → ${new Date(commessa.dataFine).toLocaleDateString('it-IT')}`
            : 'Periodo non disponibile',
        responsabile:
          commessa.sottocommesse?.[0]?.responsabile || commessa.responsabile || '—',
        cliente: commessa.cliente || '—',
        sottocommesse: commessa.sottocommesse || []
      };
      if (commessa.stato === 'CHIUSA') archived.push(item);
      else active.push(item);
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

  const dayOptions = useMemo(
    () =>
      rangeEntries.map(({ dateKey, date }) => ({
        value: dateKey,
        label: formatDateLabel(date)
      })),
    [rangeEntries]
  );

  const selectedDayOption = useMemo(
    () => (selectedDay ? dayOptions.find((option) => option.value === selectedDay) : null),
    [dayOptions, selectedDay]
  );

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

  const selectedDayRecords = selectedDay ? effectiveMerged[selectedDay] || [] : [];
  const selectedDaySegnalazione = selectedDay
    ? effectiveBase[`${selectedDay}_segnalazione`] || null
    : null;

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

    if (!workingKeys.length) {
      return {
        label: prevRange.start.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' }),
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
      label: prevRange.start.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' }),
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
      },
      {
        id: 'archived',
        title: 'Commesse archiviate',
        value: analytics.archivedCommessaCount,
        description: 'Commesse chiuse ancora consultate'
      }
    ],
    [analytics]
  );

  return (
    <AdminEmployeeInspectorView
      employee={employee}
      monthLabel={monthLabel}
      heroAvatarColor={heroAvatarColor}
      periodLabel={periodLabel}
      periodOptions={PERIOD_OPTIONS}
      effectivePeriod={effectivePeriod}
      onPeriodChange={handlePeriodChange}
      dayOptions={dayOptions}
      selectedDayOption={selectedDayOption}
      onDaySelect={handleDaySelect}
      summaryCards={summaryCards}
      analytics={analytics}
      hasCommessaData={hasCommessaData}
      hasAbsenceData={hasAbsenceData}
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
  onSelectDay: PropTypes.func,
  selectedPeriod: PropTypes.oneOf(PERIOD_OPTIONS.map((option) => option.value)),
  onPeriodChange: PropTypes.func
};

export default AdminEmployeeInspectorContainer;
