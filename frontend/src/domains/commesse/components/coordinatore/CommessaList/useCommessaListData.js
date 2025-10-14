import React from 'react';

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

const parseDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export default function useCommessaListData({ commesse, filters, periodStart, recentBoundary }) {
  return React.useMemo(() => {
    const list = Array.isArray(commesse) ? commesse : [];
    const period = periodStart instanceof Date ? periodStart : null;
    const recent = recentBoundary instanceof Date ? recentBoundary : null;

    const filtered = list
      .filter((item) => matchesStatus(item, filters?.status))
      .filter((item) => matchesSearch(item, filters?.search))
      .map((item) => {
        const lastDate = parseDate(item.lastActivityAt);
        const withinPeriod = period ? (lastDate ? lastDate >= period : false) : false;
        const isRecent = filters?.onlyRecent && recent ? (lastDate ? lastDate >= recent : false) : false;
        return {
          raw: item,
          id: item.id,
          codice: item.codice || item.id,
          stato: normalize(item.stato),
          lastActivityAt: item.lastActivityAt,
          lastActivityDate: lastDate,
          lastActivityLabel: lastDate ? dateFormatter.format(lastDate) : 'N/D',
          tags: Array.isArray(item.tags) ? [...item.tags] : [],
          withinPeriod,
          isRecent,
        };
      })
      .filter((entry) => (!filters?.onlyRecent || !recent) ? true : entry.isRecent);

    const sorted = filtered.sort((a, b) => {
      const timeA = a.lastActivityDate ? a.lastActivityDate.getTime() : 0;
      const timeB = b.lastActivityDate ? b.lastActivityDate.getTime() : 0;
      return timeB - timeA;
    });

    const indexById = new Map();
    sorted.forEach((entry, index) => indexById.set(entry.id, index));

    const summary = {
      total: sorted.length,
      attive: sorted.filter((entry) => entry.stato === 'attiva').length,
      chiuse: sorted.filter((entry) => entry.stato === 'chiusa').length,
    };

    return {
      rows: sorted,
      indexById,
      summary,
    };
  }, [commesse, filters, periodStart, recentBoundary]);
}
