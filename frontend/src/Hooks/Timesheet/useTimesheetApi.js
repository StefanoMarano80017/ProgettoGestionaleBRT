import { useMemo } from 'react';
// Wrapper centralizzato per passare in futuro da mock a real API
import * as ProjectMock from '../../mocks/ProjectMock';
import * as TimesheetAggregatesMock from '../../mocks/TimesheetAggregatesMock';

export function useTimesheetApi() {
  // In futuro qui si possono mettere fetch reali + caching/react-query ecc.
  const api = useMemo(() => ({
    getEmployees: ProjectMock.getEmployees,
    getAllEmployeeTimesheets: ProjectMock.getAllEmployeeTimesheets,
    sendSegnalazione: ProjectMock.sendSegnalazione,
    getEmployeeMonthSummary: TimesheetAggregatesMock.getEmployeeMonthSummary,
    getGlobalMonthByCommessa: TimesheetAggregatesMock.getGlobalMonthByCommessa,
    // PM Campo / Operai
    getOperaiByAzienda: ProjectMock.getOperaiByAzienda,
    createPmGroup: ProjectMock.createPmGroup,
    listPmGroups: ProjectMock.listPmGroups,
    updatePmGroup: ProjectMock.updatePmGroup,
    deletePmGroup: ProjectMock.deletePmGroup,
    assignHoursToGroup: ProjectMock.assignHoursToGroup,
    getActiveCommesseForEmployee: ProjectMock.getActiveCommesseForEmployee,
    getOperaioPersonalMap: ProjectMock.getOperaioPersonalMap,
    updateGroupDayEntries: async (...args) => {
      const mod = await import('../../mocks/ProjectMock');
      return mod.updateGroupDayEntries(...args);
    }
  }), []);
  return { api };
}
export default useTimesheetApi;
