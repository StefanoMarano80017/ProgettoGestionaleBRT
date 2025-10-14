import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import usePeopleWorkloadData from '../usePeopleWorkloadData.js';

const employees = [
  { id: 'emp-1', nome: 'Mario', cognome: 'Rossi', discipline: 'MECH' },
  { id: 'emp-2', nome: 'Luigi', cognome: 'Bianchi', discipline: 'ELEC' },
];

const timesheetMap = {
  'emp-1': {
    '2025-09-02': [
      { commessa: 'VS-25-01', ore: 6 },
      { commessa: 'PERMESSO', ore: 2 },
    ],
    '2025-09-03': [
      { commessa: 'VS-25-01', ore: 8 },
    ],
    '2025-09-04_segnalazione': { descrizione: 'Note' },
  },
  'emp-2': {
    '2025-09-02': [
      { commessa: 'FERIE', ore: 8 },
    ],
  },
};

describe('usePeopleWorkloadData', () => {
  it('computes workload metrics per employee', () => {
    const { result } = renderHook(() => usePeopleWorkloadData({
      timesheetMap,
      employees,
      periodStart: new Date('2025-09-01'),
      periodEnd: new Date('2025-09-05'),
    }));

    const mario = result.current.rows.find((row) => row.employeeId === 'emp-1');
    expect(mario.workHours).toBeCloseTo(14);
    expect(mario.nonWorkHours).toBeCloseTo(2);
    expect(mario.distinctDays).toBe(2);
    expect(mario.utilizationPercent).toBe(35);

    const luigi = result.current.rows.find((row) => row.employeeId === 'emp-2');
    expect(luigi.workHours).toBe(0);
    expect(luigi.nonWorkHours).toBe(8);
    expect(luigi.utilizationPercent).toBe(0);
  });
});
