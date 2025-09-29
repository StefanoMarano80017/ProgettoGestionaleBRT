import React, { useState, useMemo, useEffect } from "react";
import {
  Box,
  MenuItem,
  Typography,
  Grid,
  Card,
  CardHeader,
  CardContent,
  TextField,
} from "@mui/material";
import { BarChart } from "@mui/x-charts/BarChart";
import {
  parseISO,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addDays,
  format,
  isWithinInterval,
} from "date-fns";

// Funzione hash per generare colori diversi
function hashString(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return hash >>> 0;
}

function stringToHslColor(str, s = 80, l = 50) {
  const hash = hashString(str);
  const h = hash % 360;
  return `hsl(${h}, ${s}%, ${l}%)`;
}

// Genera le settimane di un mese
function generateWeeks(year, month) {
  const weeks = [];
  const firstDay = startOfMonth(new Date(year, month - 1));
  const lastDay = endOfMonth(firstDay);
  let currentStart = firstDay;

  while (currentStart <= lastDay) {
    const currentEnd = endOfWeek(currentStart);
    const end = currentEnd <= lastDay ? currentEnd : lastDay;
    weeks.push({
      label: `${format(currentStart, "dd/MM")} - ${format(end, "dd/MM")}`,
      value: `${format(currentStart, "yyyy-MM-dd")}_${format(
        end,
        "yyyy-MM-dd"
      )}`,
    });
    currentStart = addDays(end, 1);
  }
  return weeks;
}

export default function EmployeeTaskChart({ tasks }) {
  const [selectedYear, setSelectedYear] = useState("2025");
  const [selectedMonth, setSelectedMonth] = useState("09");
  const [selectedWeek, setSelectedWeek] = useState("all");

  const weeksOptions = useMemo(() => {
    if (selectedMonth === "all")
      return [{ label: "Tutti i mesi", value: "all" }];
    return [
      { label: "Tutto il mese", value: "all" },
      ...generateWeeks(selectedYear, parseInt(selectedMonth)),
    ];
  }, [selectedYear, selectedMonth]);

  useEffect(() => {
    setSelectedWeek("all");
  }, [selectedMonth, selectedYear]);

  const chartData = useMemo(() => {
    const taskMap = {};
    tasks.forEach((task) => {
      const taskKey = task.taskTitle;
      if (!taskMap[taskKey]) taskMap[taskKey] = 0;

      task.dailyHours.forEach((d) => {
        const date = parseISO(d.date);
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, "0");

        let include = true;

        if (selectedYear !== "all" && year.toString() !== selectedYear)
          include = false;
        if (selectedMonth !== "all" && month !== selectedMonth) include = false;

        if (selectedWeek !== "all") {
          const [wStartStr, wEndStr] = selectedWeek.split("_");
          const wStart = parseISO(wStartStr);
          const wEnd = parseISO(wEndStr);
          include = isWithinInterval(date, { start: wStart, end: wEnd });
        }

        if (include) taskMap[taskKey] += d.hours;
      });
    });

    const taskTitles = Object.keys(taskMap);
    const hours = taskTitles.map((t) => taskMap[t]);
    return { taskTitles, hours };
  }, [tasks, selectedYear, selectedMonth, selectedWeek]);

  const taskColors = chartData.taskTitles.map((title) =>
    stringToHslColor(title)
  );

  const barChartsParams = useMemo(
    () => ({
      series: [
        {
          id: "hours",
          data: chartData.hours,
          label: "Ore dedicate",
        },
      ],
      xAxis: [
        {
          data: chartData.taskTitles,
          colorMap: {
            type: "ordinal",
            colors: taskColors,
          },
        },
      ],
      height: 400,
      margin: { left: 50 },
    }),
    [chartData]
  );

  return (
    <Box sx={{ width: "100%" }}>
      <Card>
        <CardHeader
          title={<Typography variant="h6">Ore per commessa</Typography>}
          action={
            <Grid container spacing={2} alignItems="center">
              <Grid item>
                <TextField
                  select
                  label="Anno"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  size="small"
                >
                  <MenuItem value="all">Tutti</MenuItem>
                  <MenuItem value="2025">2025</MenuItem>
                </TextField>
              </Grid>
              <Grid item>
                <TextField
                  select
                  label="Mese"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  size="small"
                >
                  <MenuItem value="all">Tutti</MenuItem>
                  {Array.from({ length: 12 }, (_, i) => {
                    const m = (i + 1).toString().padStart(2, "0");
                    return (
                      <MenuItem key={m} value={m}>
                        {m}
                      </MenuItem>
                    );
                  })}
                </TextField>
              </Grid>
              <Grid item>
                <TextField
                  select
                  label="Settimana"
                  value={selectedWeek}
                  onChange={(e) => setSelectedWeek(e.target.value)}
                  size="small"
                >
                  {weeksOptions.map((w) => (
                    <MenuItem key={w.value} value={w.value}>
                      {w.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
          }
        />
        <CardContent>
          <BarChart {...barChartsParams} />
        </CardContent>
      </Card>
    </Box>
  );
}
