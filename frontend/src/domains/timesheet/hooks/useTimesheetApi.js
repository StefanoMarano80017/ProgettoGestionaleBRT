import { useMemo } from 'react';
import * as ProjectMock from '@mocks/ProjectMock';
import * as TimesheetAggregatesMock from '@mocks/TimesheetAggregatesMock';

export function useTimesheetApi() {
  const api = useMemo(() => ({
    getEmployees: ProjectMock.getEmployees,
    getAllEmployeeTimesheets: ProjectMock.getAllEmployeeTimesheets,
    sendSegnalazione: ProjectMock.sendSegnalazione,
    batchSaveTimesheetEntries: ProjectMock.batchSaveTimesheetEntries,
    getEmployeeMonthSummary: TimesheetAggregatesMock.getEmployeeMonthSummary,
    getGlobalMonthByCommessa: TimesheetAggregatesMock.getGlobalMonthByCommessa,
    getOperaiByAzienda: ProjectMock.getOperaiByAzienda,
    createPmGroup: ProjectMock.createPmGroup,
    listPmGroups: ProjectMock.listPmGroups,
    updatePmGroup: ProjectMock.updatePmGroup,
    deletePmGroup: ProjectMock.deletePmGroup,
    assignHoursToGroup: ProjectMock.assignHoursToGroup,
    getActiveCommesseForEmployee: ProjectMock.getActiveCommesseForEmployee,
    getOperaioPersonalMap: ProjectMock.getOperaioPersonalMap,
    updateGroupDayEntries: ProjectMock.updateGroupDayEntries,
  }), []);
  return { api };
}
export default useTimesheetApi;
