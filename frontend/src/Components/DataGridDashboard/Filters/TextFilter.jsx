import React from "react";
import { TextField } from "@mui/material";

const TextFilter = ({ textFilter, setTextFilter }) => (
  <TextField
    label="Cerca Progetti/Task"
    size="small"
    value={textFilter}
    onChange={(e) => setTextFilter(e.target.value)}
    fullWidth
  />
);

export default TextFilter;
