import React from "react";
import { MenuItem, Checkbox, ListItemIcon, ListItemText, Box } from "@mui/material";
import { AvatarInitials } from "../../Avatar/AvatarInitials"; 

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
            <AvatarInitials
              name={emp.name.split(" ")[0] || ""}
              surname={emp.name.split(" ")[1] || ""}
              size={24} // dimensione dell'avatar
            />
            {emp.name}
          </Box>
        }
      />
    </MenuItem>
  ));
};

export default EmployeeFilter;
