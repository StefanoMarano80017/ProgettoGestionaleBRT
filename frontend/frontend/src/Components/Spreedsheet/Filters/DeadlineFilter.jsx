import React from "react";
import { TextField } from "@mui/material";

const DeadlineFilter = ({ deadlineFilter, setDeadlineFilter }) => (
  <TextField
    type="date"
    size="small"
    InputLabelProps={{ shrink: true }}
    value={deadlineFilter}
    onChange={(e) => setDeadlineFilter(e.target.value)}
    fullWidth
  />
);

export default DeadlineFilter;
