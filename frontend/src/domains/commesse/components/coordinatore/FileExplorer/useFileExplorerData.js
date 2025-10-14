import React from 'react';

const monthFormatter = new Intl.DateTimeFormat('it-IT', { month: 'long' });
const dateFormatter = new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });

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

const getLastActivityDate = (commessa) => {
  if (!commessa?.lastActivityAt) return null;
  const date = new Date(commessa.lastActivityAt);
  return Number.isNaN(date.getTime()) ? null : date;
};

const buildNode = (commessa, date, withinPeriod) => ({
  id: commessa.id,
  codice: commessa.codice || commessa.id,
  nome: commessa.nome || commessa.codice || commessa.id,
  stato: normalize(commessa.stato),
  lastActivityAt: commessa.lastActivityAt,
  lastActivityLabel: date ? dateFormatter.format(date) : 'N/D',
  tags: Array.isArray(commessa.tags) ? [...commessa.tags] : [],
  withinPeriod,
});

export default function useFileExplorerData({
  commesse,
  onlyRecent,
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
        const date = getLastActivityDate(commessa);
        const year = date ? date.getFullYear() : null;
        const month = date ? date.getMonth() + 1 : null;
        const monthLabel = date ? monthFormatter.format(date) : 'N/D';
        const withinPeriod = period ? (date ? date >= period : false) : false;
        return {
          raw: commessa,
          date,
          year,
          month,
          monthLabel,
          withinPeriod,
        };
      })
      .filter(({ raw }) => matchesStatus(raw, statusFilter))
      .filter(({ raw }) => matchesSearch(raw, searchText));

    const visible = onlyRecent && boundary
      ? enriched.filter(({ date }) => (date ? date >= boundary : false))
      : enriched;

    const sorted = visible.sort((a, b) => {
      const timeA = a.date ? a.date.getTime() : 0;
      const timeB = b.date ? b.date.getTime() : 0;
      return timeB - timeA;
    });

    const recentNodes = sorted
      .filter(({ date }) => (boundary ? (date ? date >= boundary : false) : false))
      .slice(0, 20)
      .map(({ raw, date, withinPeriod }) => buildNode(raw, date, withinPeriod));

    const groupsMap = new Map();
    sorted.forEach(({ raw, date, year, month, monthLabel, withinPeriod }) => {
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
      target.nodes.push(buildNode(raw, date, withinPeriod));
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
  }, [commesse, onlyRecent, recentBoundary, periodStart, statusFilter, searchText]);
}
