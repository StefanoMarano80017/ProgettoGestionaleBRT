import React from "react";
import { Box, MenuItem, Checkbox, ListItemIcon, ListItemText, Typography } from "@mui/material";
import ColorDot from "../ColorDot";

const StatusFilter = ({ statusOptions = [], statusFilter = [], setStatusFilter }) => {
  const toggleStatus = (status) => {
    setStatusFilter((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
  };

  return (
    <Box sx={{ px: 2, py: 1 }}>
      {/* Header con titolo */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 1,
        }}
      >
        <Typography variant="subtitle2">
          <ColorDot color="primary" /> Status
        </Typography>
      </Box>

      {/* Lista status */}
      {statusOptions.map((status) => (
        <MenuItem key={status} onClick={() => toggleStatus(status)}>
          <ListItemIcon>
            <Checkbox checked={statusFilter.includes(status)} />
          </ListItemIcon>
          <ListItemText primary={status} />
        </MenuItem>
      ))}
    </Box>
  );
};

export default StatusFilter;
