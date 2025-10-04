import React, { useState } from "react";
import {
  IconButton,
  Menu,
  Box,
  Divider,
  Typography,
  Stack,
} from "@mui/material";
import TextFilter from "@components/DataGridDashboard/Filters/TextFilter";
import EmployeeFilter from "@components/DataGridDashboard/Filters/EmployeeFilter";
import StatusFilter from "@components/DataGridDashboard/Filters/StatusFilter";
import DeadlineFilter from "@components/DataGridDashboard/Filters/DeadlineFilter";
import FilterAltIcon from "@mui/icons-material/FilterAlt";

const colorMap = {
  Dipendenti: "secondary.main",
  Stato: "success.main",
  "Creati da": "warning.main",
  "Chiusi entro": "warning.main",
};

const FiltersMenu = ({ activeFilters = [], filtersState }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const renderTitleWithDot = (title) => (
    <Typography variant="subtitle2">{title}</Typography>
  );

  const filterComponents = {
    Testo: ({ value, set }) => <TextFilter textFilter={value} setTextFilter={set} />,
    Dipendenti: ({ value, set, data }) => (
      <EmployeeFilter employees={data} employeeFilter={value} setEmployeeFilter={set} />
    ),
    Stato: ({ value, set, data }) => (
      <StatusFilter statusOptions={data} statusFilter={value} setStatusFilter={set} />
    ),
    "Creati da / Chiusi entro": ({ value, set }) => (
      <DeadlineFilter
        createdFrom={value.createdFrom}
        setCreatedFrom={set.setCreatedFrom}
        completedTo={value.completedTo}
        setCompletedTo={set.setCompletedTo}
      />
    ),
  };

  return (
    <>
      <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
        <FilterAltIcon />
      </IconButton>
      <Menu anchorEl={anchorEl} open={open} onClose={() => setAnchorEl(null)}>
        <Box sx={{ p: 2 }}>
          {activeFilters.map((key) => (
            <Box key={key}>
              {renderTitleWithDot(key)}
              {filterComponents[key](filtersState[key])}
            </Box>
          ))}
        </Box>
      </Menu>
    </>
  );
};


export default FiltersMenu;
