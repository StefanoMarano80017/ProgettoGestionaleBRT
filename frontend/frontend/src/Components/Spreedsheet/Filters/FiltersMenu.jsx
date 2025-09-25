import React, { useState } from "react";
import {
  Button,
  Menu,
  Box,
  Divider,
  Typography,
  IconButton,
} from "@mui/material";
import TextFilter from "./TextFilter";
import EmployeeFilter from "./EmployeeFilter";
import StatusFilter from "./StatusFilter";
import DeadlineFilter from "./DeadlineFilter";
import FilterAltIcon from "@mui/icons-material/FilterAlt";

const FiltersMenu = ({
  textFilter,
  setTextFilter,
  employees,
  employeeFilter,
  setEmployeeFilter,
  statusOptions,
  statusFilter,
  setStatusFilter,
  deadlineFilter,
  setDeadlineFilter,
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  return (
    <>
      <TextFilter textFilter={textFilter} setTextFilter={setTextFilter} />

      <IconButton
        aria-label="Filters"
        onClick={(e) => setAnchorEl(e.currentTarget)}
      >
        <FilterAltIcon />
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        PaperProps={{ sx: { width: 320, maxHeight: 500 } }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle2">Dipendenti</Typography>
          <EmployeeFilter
            employees={employees}
            employeeFilter={employeeFilter}
            setEmployeeFilter={setEmployeeFilter}
          />

          <Divider sx={{ my: 1 }} />
          <Typography variant="subtitle2">Stato</Typography>
          <StatusFilter
            statusOptions={statusOptions}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
          />

          <Divider sx={{ my: 1 }} />
          <Typography variant="subtitle2">Scadenza</Typography>
          <DeadlineFilter
            deadlineFilter={deadlineFilter}
            setDeadlineFilter={setDeadlineFilter}
          />
        </Box>
      </Menu>
    </>
  );
};

export default FiltersMenu;
