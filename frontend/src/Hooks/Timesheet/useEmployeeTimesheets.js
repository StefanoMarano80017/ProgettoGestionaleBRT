import { useTimesheetData } from './data/useTimesheetData';

/**
 * @deprecated usare useTimesheetData({ scope: 'all' })
 */
export function useEmployeeTimesheets({ autoLoad = true } = {}) {
  const { employees, dataMap, setDataMap, loading, error, load, companies } = useTimesheetData({ scope: 'all', autoLoad });
  return { employees, tsMap: dataMap, setTsMap: setDataMap, loading, error, load, companies };
}
export default useEmployeeTimesheets;
