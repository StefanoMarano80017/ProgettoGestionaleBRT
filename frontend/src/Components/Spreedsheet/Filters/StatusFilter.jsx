import React from "react";
import { MenuItem, Checkbox, ListItemIcon, ListItemText } from "@mui/material";

const StatusFilter = ({ statusOptions, statusFilter, setStatusFilter }) => {
  const toggleStatus = (status) => {
    setStatusFilter((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

  return statusOptions.map((status) => (
    <MenuItem key={status} onClick={() => toggleStatus(status)}>
      <ListItemIcon>
        <Checkbox checked={statusFilter.includes(status)} />
      </ListItemIcon>
      <ListItemText primary={status} />
    </MenuItem>
  ));
};

export default StatusFilter;
