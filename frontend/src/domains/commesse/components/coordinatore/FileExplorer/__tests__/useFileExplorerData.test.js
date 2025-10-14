import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import useFileExplorerData from '../useFileExplorerData.js';

const sampleCommesse = [
  {
    id: 'VS-25-01',
    codice: 'VS-25-01',
    nome: 'Infrastrutture',
    stato: 'attiva',
    lastActivityAt: '2025-09-18',
    tags: ['A'],
  },
  {
    id: 'VS-25-02',
    codice: 'VS-25-02',
    nome: 'Manutenzione',
    stato: 'chiusa',
    lastActivityAt: '2025-09-01',
  },
  {
    id: 'VS-24-04',
    codice: 'VS-24-04',
    nome: 'Rilievi',
    stato: 'chiusa',
    lastActivityAt: '2024-05-15',
  },
];

const recentBoundary = new Date('2025-09-05');
const periodStart = new Date('2025-08-01');

describe('useFileExplorerData', () => {
  it('groups commesse by year and month', () => {
    const { result } = renderHook(() => useFileExplorerData({
      commesse: sampleCommesse,
      onlyRecent: false,
      recentBoundary,
      periodStart,
      statusFilter: 'all',
      searchText: '',
    }));

    expect(result.current.yearGroups.length).toBe(2);
    const latestYear = result.current.yearGroups[0];
    expect(latestYear.year).toBe(2025);
    expect(latestYear.months[0].commesse[0].id).toBe('VS-25-01');
  });

  it('filters when onlyRecent is true', () => {
    const { result } = renderHook(() => useFileExplorerData({
      commesse: sampleCommesse,
      onlyRecent: true,
      recentBoundary,
      periodStart,
      statusFilter: 'all',
      searchText: '',
    }));

    expect(result.current.yearGroups.length).toBe(1);
    expect(result.current.yearGroups[0].months[0].commesse).toHaveLength(2);
  });

  it('applies status and search filters', () => {
    const { result } = renderHook(() => useFileExplorerData({
      commesse: sampleCommesse,
      onlyRecent: false,
      recentBoundary,
      periodStart,
      statusFilter: 'attiva',
      searchText: 'infra',
    }));

    expect(result.current.yearGroups.length).toBe(1);
    const nodes = result.current.yearGroups[0].months[0].commesse;
    expect(nodes).toHaveLength(1);
    expect(nodes[0].id).toBe('VS-25-01');
  });
});
