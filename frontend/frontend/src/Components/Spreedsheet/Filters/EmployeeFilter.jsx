import React from "react";
import { MenuItem, Checkbox, ListItemIcon, ListItemText, Avatar, Box } from "@mui/material";

const EmployeeFilter = ({ employees, employeeFilter, setEmployeeFilter }) => {
  const toggleEmployee = (id) => {
    setEmployeeFilter((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return employees.map((emp) => (
    <MenuItem key={emp.id} onClick={() => toggleEmployee(emp.id)}>
      <ListItemIcon>
        <Checkbox checked={employeeFilter.includes(emp.id)} />
      </ListItemIcon>
      <ListItemText
        primary={
          <Box display="flex" alignItems="center" gap={1}>
            <Avatar sx={{ width: 24, height: 24 }}>{emp.name[0]}</Avatar>
            {emp.name}
          </Box>
        }
      />
    </MenuItem>
  ));
};

export default EmployeeFilter;
