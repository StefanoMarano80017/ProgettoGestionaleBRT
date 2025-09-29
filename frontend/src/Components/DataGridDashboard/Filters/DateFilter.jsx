import React from "react";
import { TextField, Box } from "@mui/material";

const DateFilter = ({
    selectedYear, setSelectedYear, yearOptions,
    selectedMonth, setSelectedMonth, monthOptions,
    selectedWeek, setSelectedWeek, weekOptions
}) => {
  return (
    <Box>
      <TextField
        select
        value={selectedYear}
        onChange={(e) => setSelectedYear(e.target.value)}
      >
        {yearOptions.map((y) => (
          <MenuItem key={y} value={y}>
            {y}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        select
        value={selectedMonth}
        onChange={(e) => setSelectedMonth(e.target.value)}
      >
        {monthOptions.map((m) => (
          <MenuItem key={m} value={m}>
            {m}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        select
        value={selectedWeek}
        onChange={(e) => setSelectedWeek(e.target.value)}
      >
        {weekOptions.map((w) => (
          <MenuItem key={w.value} value={w.value}>
            {w.label}
          </MenuItem>
        ))}
      </TextField>
    </Box>
  );
};

export default DateFilter;
