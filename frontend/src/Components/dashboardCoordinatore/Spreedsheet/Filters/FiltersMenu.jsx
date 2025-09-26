import React, { useState } from "react";
import {
  IconButton,
  Menu,
  Box,
  Divider,
  Typography,
  Stack,
} from "@mui/material";
import TextFilter from "./TextFilter";
import EmployeeFilter from "./EmployeeFilter";
import StatusFilter from "./StatusFilter";
import DeadlineFilter from "./DeadlineFilter";
import FilterAltIcon from "@mui/icons-material/FilterAlt";

const colorMap = {
  Dipendenti: "secondary.main",
  Stato: "success.main",
  "Creati da": "warning.main",
  "Chiusi entro": "warning.main",
};

const FiltersMenu = ({
  textFilter,
  setTextFilter,
  employees,
  employeeFilter,
  setEmployeeFilter,
  statusOptions,
  statusFilter,
  setStatusFilter,
  createdFrom,
  setCreatedFrom,
  completedTo,
  setCompletedTo,
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const renderTitleWithDot = (title) => (
    <Stack direction="row" spacing={1} alignItems="center" mb={1}>
      <Box
        sx={{
          width: 12,
          height: 12,
          bgcolor: colorMap[title],
          borderRadius: "50%",
        }}
      />
      <Typography variant="subtitle2">{title}</Typography>
    </Stack>
  );

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
          {renderTitleWithDot("Dipendenti")}
          <EmployeeFilter
            employees={employees}
            employeeFilter={employeeFilter}
            setEmployeeFilter={setEmployeeFilter}
          />

          <Divider sx={{ my: 1 }} />
          {renderTitleWithDot("Stato")}
          <StatusFilter
            statusOptions={statusOptions}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
          />

          <Divider sx={{ my: 1 }} />
          {renderTitleWithDot("Creati da / Chiusi entro")}
          <DeadlineFilter
            createdFrom={createdFrom}
            setCreatedFrom={setCreatedFrom}
            completedTo={completedTo}
            setCompletedTo={setCompletedTo}
          />
        </Box>
      </Menu>
    </>
  );
};

export default FiltersMenu;
