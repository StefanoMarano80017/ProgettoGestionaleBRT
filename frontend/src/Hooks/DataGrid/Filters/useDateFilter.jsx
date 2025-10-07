// LEGACY: moved to @shared/hooks/filters/useDateFilter
import React, { useState, useMemo, useEffect } from "react";
import { MenuItem, TextField, Chip, Grid } from "@mui/material";

function generateWeeks(year, month) {
  const weeks = [];
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  let currentStart = firstDay;

  while (currentStart <= lastDay) {
    const currentEnd = new Date(currentStart);
    currentEnd.setDate(currentStart.getDate() + (6 - currentStart.getDay()));
    const end = currentEnd <= lastDay ? currentEnd : lastDay;
    weeks.push({
      label: `${currentStart.getDate()}/${currentStart.getMonth() + 1} - ${end.getDate()}/${end.getMonth() + 1}`,
      value: `${currentStart.toISOString()}_${end.toISOString()}`,
    });
    currentStart = new Date(end);
    currentStart.setDate(currentStart.getDate() + 1);
  }
  return weeks;
}

export function useDateFilter(tasks) {
  const [selectedYear, setSelectedYear] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [selectedWeek, setSelectedWeek] = useState("all");

  const yearOptions = useMemo(() => {
    const years = Array.from(new Set(tasks.map((t) => new Date(t.createdAt).getFullYear()))).sort();
    return ["all", ...years];
  }, [tasks]);

  const monthOptions = useMemo(() => {
    if (selectedYear === "all") return ["all", ...Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, "0"))];
    const months = Array.from(new Set(tasks
      .filter((t) => new Date(t.createdAt).getFullYear().toString() === selectedYear)
      .map((t) => (new Date(t.createdAt).getMonth() + 1).toString().padStart(2, "0"))
    )).sort();
    return ["all", ...months];
  }, [tasks, selectedYear]);

  const weekOptions = useMemo(() => {
    if (selectedMonth === "all" || selectedYear === "all") return [{ label: "Tutto il mese", value: "all" }];
    return [{ label: "Tutto il mese", value: "all" }, ...generateWeeks(parseInt(selectedYear), parseInt(selectedMonth))];
  }, [selectedYear, selectedMonth]);

  useEffect(() => setSelectedWeek("all"), [selectedYear, selectedMonth]);

  const filterFn = React.useCallback(
    (items) => {
      return items.filter((t) => {
        const date = new Date(t.createdAt);
        const year = date.getFullYear().toString();
        const month = (date.getMonth() + 1).toString().padStart(2, "0");

        let include = true;
        if (selectedYear !== "all" && year !== selectedYear) include = false;
        if (selectedMonth !== "all" && month !== selectedMonth) include = false;
        if (selectedWeek !== "all") {
          const [wStartStr, wEndStr] = selectedWeek.split("_");
          const wStart = new Date(wStartStr);
          const wEnd = new Date(wEndStr);
          include = date >= wStart && date <= wEnd;
        }
        return include;
      });
    },
    [selectedYear, selectedMonth, selectedWeek]
  );

  const clear = () => {
    setSelectedYear("all");
    setSelectedMonth("all");
    setSelectedWeek("all");
  };

  const render = () => (
    <Grid container spacing={1} alignItems="center">
      <Grid item>
        <TextField select size="small" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
          {yearOptions.map((y) => (
            <MenuItem key={y} value={y}>
              {y}
            </MenuItem>
          ))}
        </TextField>
      </Grid>
      <Grid item>
        <TextField select size="small" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
          {monthOptions.map((m) => (
            <MenuItem key={m} value={m}>
              {m}
            </MenuItem>
          ))}
        </TextField>
      </Grid>
      <Grid item>
        <TextField select size="small" value={selectedWeek} onChange={(e) => setSelectedWeek(e.target.value)}>
          {weekOptions.map((w) => (
            <MenuItem key={w.value} value={w.value}>
              {w.label}
            </MenuItem>
          ))}
        </TextField>
      </Grid>
    </Grid>
  );

  const renderChip = () => {
    if (selectedYear === "all" && selectedMonth === "all" && selectedWeek === "all") return null;
    let label = "Periodo: ";
    if (selectedYear !== "all") label += selectedYear;
    if (selectedMonth !== "all") label += `/${selectedMonth}`;
    if (selectedWeek !== "all") label += ` (${weekOptions.find((w) => w.value === selectedWeek)?.label})`;
    return <Chip label={label} onDelete={clear} />;
  };

  return { selectedYear, selectedMonth, selectedWeek, setSelectedYear, setSelectedMonth, setSelectedWeek, filterFn, render, renderChip, clear, label: "Periodo" };
}
