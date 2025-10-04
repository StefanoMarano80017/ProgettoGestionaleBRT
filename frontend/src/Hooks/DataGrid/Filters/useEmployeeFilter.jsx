import { useState } from "react";
import EmployeeFilter from "@components/DataGridDashboard/Filters/EmployeeFilter";
import CustomAvatarGroup from "@components/Avatar/CustomAvatarGroup";
import { Chip, Box } from "@mui/material";
import { JoinLeft, JoinInner } from "@mui/icons-material";

export function useEmployeeFilter(employeesList = []) {
  const [value, setValue] = useState([]);
  const [mode, setMode] = useState("some");

  const filterFn = (items) => {
    if (!value || value.length === 0) return items;

    if (mode === "some") {
      return items.filter((item) =>
        value.some((empId) => item.assigned.includes(empId))
      );
    }
    if (mode === "every") {
      return items.filter((item) =>
        value.every((empId) => item.assigned.includes(empId))
      );
    }
    return items;
  };

  const clear = () => setValue([]);

  const render = () => (
    <EmployeeFilter
      employees={employeesList}
      employeeFilter={value}
      setEmployeeFilter={setValue}
      mode={mode}
      setMode={setMode}
    />
  );

  const renderChip = () => {
    if (!value || value.length === 0) return null;

    const selectedEmployees = employeesList.filter((e) => value.includes(e.id));

    return (
      <Chip
        color="secondary"
        onDelete={clear}
        label={
          <Box display="flex" alignItems="center" gap={0.5}>
            {mode === "some" && <JoinLeft fontSize="small" />}
            {mode === "every" && <JoinInner fontSize="small" />}
            <CustomAvatarGroup data={selectedEmployees} max={2} />
          </Box>
        }
      />
    );
  };

  return {
    value,
    set: setValue,
    filterFn,
    render,
    renderChip,
    clear,
    label: "Dipendenti",
  };
}
