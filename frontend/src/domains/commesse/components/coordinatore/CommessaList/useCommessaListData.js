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

const getCreationDate = (commessa) =>
  parseDate(commessa?.createdAt)
  || parseDate(commessa?.dataInizio)
  || parseDate(commessa?.lastActivityAt)
  || parseDate(commessa?.updatedAt)
  || null;

const getUpdatedDate = (commessa) =>
  parseDate(commessa?.lastActivityAt)
  || parseDate(commessa?.updatedAt)
  || parseDate(commessa?.dataFine)
  || parseDate(commessa?.createdAt)
  || parseDate(commessa?.dataInizio)
  || null;

const normalizeTipo = (value) => {
  if (!value) return [];
  const list = Array.isArray(value) ? value : [value];
  return list
    .map((item) => String(item || '').toUpperCase())
    .filter((item) => item.length > 0);
};

const hasEngineeringTipo = (value) => normalizeTipo(value).includes('ENGINEERING');

export default function useCommessaListData({ commesse, filters, periodStart, recentBoundary }) {
  return React.useMemo(() => {
    const list = Array.isArray(commesse) ? commesse : [];
    const period = periodStart instanceof Date ? periodStart : null;
    const recent = recentBoundary instanceof Date ? recentBoundary : null;

    const filtered = list
      .filter((item) => hasEngineeringTipo(item?.tipo))
      .filter((item) => matchesStatus(item, filters?.status))
      .filter((item) => matchesSearch(item, filters?.search))
      .map((item) => {
        const creationDate = getCreationDate(item);
        const updatedDate = getUpdatedDate(item);
        if (period && (!updatedDate || updatedDate < period)) {
          return null;
        }
        const sortMode = filters?.sort === 'created' ? 'created' : 'updated';
        const sortDate = sortMode === 'created' ? creationDate : updatedDate;
        const sortTimestamp = sortDate ? sortDate.getTime() : 0;
        const isRecent = filters?.onlyRecent && recent ? (updatedDate ? updatedDate >= recent : false) : false;
        const creationLabel = creationDate ? dateFormatter.format(creationDate) : null;
        const updatedLabel = updatedDate ? dateFormatter.format(updatedDate) : null;
        return {
          raw: item,
          id: item.id,
          codice: item.codice || item.id,
          stato: normalize(item.stato),
          lastActivityAt: item.lastActivityAt,
          lastActivityDate: updatedDate,
          lastActivityLabel: updatedLabel || 'N/D',
          creationDate,
          creationLabel,
          updatedDate,
          updatedLabel,
          sortMode,
          sortTimestamp,
          tags: Array.isArray(item.tags) ? [...item.tags] : [],
          isRecent,
        };
      })
      .filter(Boolean)
      .filter((entry) => (!filters?.onlyRecent || !recent) ? true : entry.isRecent);

    const sorted = [...filtered].sort((a, b) => {
      return (b.sortTimestamp || 0) - (a.sortTimestamp || 0);
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
