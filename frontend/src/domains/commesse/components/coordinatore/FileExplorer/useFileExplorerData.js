import React from 'react';

const monthFormatter = new Intl.DateTimeFormat('it-IT', { month: 'long' });
const dateFormatter = new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });

const parseDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const normalize = (value) => String(value || '').toLowerCase();

const matchesStatus = (commessa, statusFilter) => {
  if (!statusFilter || statusFilter === 'all') return true;
  return normalize(commessa.stato) === normalize(statusFilter);
};

const matchesSearch = (commessa, searchText) => {
  if (!searchText) return true;
  const haystack = `${commessa.codice || ''} ${commessa.nome || ''}`.toLowerCase();
  return haystack.includes(searchText.toLowerCase());
};

const getCreationDate = (commessa) =>
  parseDate(commessa?.createdAt)
  || parseDate(commessa?.dataInizio)
  || parseDate(commessa?.lastActivityAt)
  || parseDate(commessa?.updatedAt)
  || null;

const getActivityDate = (commessa) =>
  parseDate(commessa?.lastActivityAt)
  || parseDate(commessa?.updatedAt)
  || parseDate(commessa?.dataFine)
  || parseDate(commessa?.createdAt)
  || parseDate(commessa?.dataInizio)
  || null;

const buildNode = (commessa, creationDate, activityDate, withinPeriod) => {
  const creationLabel = creationDate ? dateFormatter.format(creationDate) : null;
  const activityLabel = activityDate ? dateFormatter.format(activityDate) : null;
  return {
    id: commessa.id,
    codice: commessa.codice || commessa.id,
    nome: commessa.nome || commessa.codice || commessa.id,
    stato: normalize(commessa.stato),
    createdAt: commessa.createdAt,
    updatedAt: commessa.updatedAt,
    lastActivityAt: commessa.lastActivityAt,
    creationLabel,
    activityLabel,
    displayLabel: commessa.nome || commessa.codice || commessa.id,
    tags: Array.isArray(commessa.tags) ? [...commessa.tags] : [],
    withinPeriod,
  };
};

export default function useFileExplorerData({
  commesse,
  recentBoundary,
  periodStart,
  statusFilter,
  searchText,
}) {
  return React.useMemo(() => {
    const list = Array.isArray(commesse) ? commesse : [];
    const boundary = recentBoundary instanceof Date ? recentBoundary : null;
    const period = periodStart instanceof Date ? periodStart : null;

    const enriched = list
      .map((commessa) => {
        const creationDate = getCreationDate(commessa);
        const activityDate = getActivityDate(commessa);
        const year = creationDate ? creationDate.getFullYear() : null;
        const month = creationDate ? creationDate.getMonth() + 1 : null;
        const monthLabel = creationDate ? monthFormatter.format(creationDate) : 'N/D';
        const withinPeriod = period ? (activityDate ? activityDate >= period : false) : false;
        return {
          raw: commessa,
          creationDate,
          activityDate,
          year,
          month,
          monthLabel,
          withinPeriod,
        };
      })
      .filter(({ raw }) => matchesStatus(raw, statusFilter))
      .filter(({ raw }) => matchesSearch(raw, searchText));

    const sorted = enriched.sort((a, b) => {
      const timeA = a.creationDate ? a.creationDate.getTime() : 0;
      const timeB = b.creationDate ? b.creationDate.getTime() : 0;
      return timeB - timeA;
    });

    const recentNodes = enriched
      .filter(({ activityDate }) => (boundary ? (activityDate ? activityDate >= boundary : false) : false))
      .sort((a, b) => {
        const timeA = a.activityDate ? a.activityDate.getTime() : 0;
        const timeB = b.activityDate ? b.activityDate.getTime() : 0;
        return timeB - timeA;
      })
      .slice(0, 20)
      .map(({ raw, creationDate, activityDate, withinPeriod }) => buildNode(raw, creationDate, activityDate, withinPeriod));

    const groupsMap = new Map();
    sorted.forEach(({ raw, creationDate, activityDate, year, month, monthLabel, withinPeriod }) => {
      if (!year || !month) return;
      if (!groupsMap.has(year)) {
        groupsMap.set(year, new Map());
      }
      const monthsMap = groupsMap.get(year);
      if (!monthsMap.has(month)) {
        monthsMap.set(month, { label: monthLabel, nodes: [] });
      }
      const target = monthsMap.get(month);
      if (!target.label && monthLabel) {
        target.label = monthLabel;
      }
      target.nodes.push(buildNode(raw, creationDate, activityDate, withinPeriod));
    });

    const yearGroups = Array.from(groupsMap.entries())
      .sort((a, b) => b[0] - a[0])
      .map(([year, monthsMap]) => ({
        year,
        months: Array.from(monthsMap.entries())
          .sort((a, b) => b[0] - a[0])
          .map(([month, payload]) => ({
            id: `${year}-${String(month).padStart(2, '0')}`,
            month,
            label: payload.label || monthFormatter.format(new Date(year, month - 1, 1)),
            commesse: payload.nodes,
          })),
      }));

    return {
      recentNodes,
      yearGroups,
    };
  }, [commesse, recentBoundary, periodStart, statusFilter, searchText]);
}
