import React, { useState, useMemo, useEffect } from "react";
import {
  Box,
  MenuItem,
  Typography,
  Grid,
  Card,
  CardHeader,
  CardContent,
  Autocomplete,
  TextField,
  Checkbox,
  ListItemText,
  Stack,
} from "@mui/material";
import { BarChart } from "@mui/x-charts/BarChart";
import FiltersBar from "../DataGridDashboard/FiltersBar";

// Hook per filtri
import { useTextFilter } from "../DataGridDashboard/FiltersHooks/useTextFilter";
import { useStatusFilter } from "../DataGridDashboard/FiltersHooks/useStatusFilter";
import { useDateFilter } from "../DataGridDashboard/FiltersHooks/useDateFilter";

function hashString(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return hash >>> 0;
}

function stringToHslColor(str, s = 80, l = 50) {
  const hash = hashString(str.trim());
  const h = hash % 360;
  return `hsl(${h}, ${s}%, ${l}%)`;
}

export default function CoordinatorTaskChart({ projects }) {
  const [selectedTaskData, setSelectedTaskData] = useState(null);
  // Stato per progetti selezionati
  const [selectedProjectTitles, setSelectedProjectTitles] = useState([]);

  // Quando arrivano i progetti inizializza selezione
  useEffect(() => {
    if (projects?.length) {
      setSelectedProjectTitles(projects.map((p) => p.title)); // inizialmente tutti selezionati
    }
  }, [projects]);

  // Funzione di update come nella NavigationBar
  const handleProjectChange = (newSelected) => {
    const projectOptions = projects.map((p) => p.title);
    if (!newSelected || newSelected.length === 0) {
      setSelectedProjectTitles(projectOptions); // se vuoto, seleziona tutti
    } else {
      setSelectedProjectTitles(newSelected);
    }
  };

  // Filtra i task basandosi sui progetti selezionati
  const tasks = useMemo(
    () =>
      (projects || [])
        .filter(
          (p) =>
            selectedProjectTitles.includes("Tutti") ||
            selectedProjectTitles.includes(p.title)
        )
        .flatMap((project) =>
          (project.tasks || []).map((task) => ({
            ...task,
            projectTitle: project.title,
          }))
        ),
    [projects, selectedProjectTitles]
  );

  // --- Hook filtri ---
  const textFilter = useTextFilter();
  const statusFilter = useStatusFilter(["In corso", "Urgente", "Completato"]);
  const dateFilter = useDateFilter(tasks);
  const filters = [textFilter, statusFilter, dateFilter];
  const activeFilters = filters.map((f) => f.label);

  const filteredTasks = useMemo(
    () => filters.reduce((acc, f) => f.filterFn(acc), tasks),
    [tasks, filters]
  );

  const taskColors = filteredTasks.map((t) => stringToHslColor(t.title));
  const taskTitles = filteredTasks.map((t) => t.title);
  const taskHours = filteredTasks.map((t) => t.hours);

  const barChartsParams = useMemo(
    () => ({
      series: [{ id: "hours", data: taskHours, label: "Ore per task" }],
      xAxis: [
        {
          data: taskTitles,
          colorMap: { type: "ordinal", colors: taskColors },
          tickLabelStyle: { angle: -45, textAnchor: "middle", fontSize: 10 },
        },
      ],
      height: 400,
    }),
    [taskTitles, taskHours, taskColors]
  );

  // Selezione di default primo task
  useEffect(() => {
    if (filteredTasks.length > 0 && !selectedTaskData) {
      setSelectedTaskData({ taskTitle: filteredTasks[0].title, index: 0 });
    }
  }, [filteredTasks, selectedTaskData]);

  return (
    <Box sx={{ width: "100%" }}>
      <Stack direction="row" spacing={2} alignContent="center">
        {/* Barra filtri */}
        <FiltersBar
          filters={filters}
          activeFilters={activeFilters}
          employees={null}
        />

        <Autocomplete
          multiple
          size="small"
          limitTags={2}
          options={projects.map((p) => p.title)}
          value={selectedProjectTitles}
          onChange={(_, newValue) => handleProjectChange(newValue)}
          clearOnEscape
          disableCloseOnSelect
          renderOption={(props, option, { selected }) => (
            <li {...props}>
              <Checkbox style={{ marginRight: 8 }} checked={selected} />
              <ListItemText primary={option} />
            </li>
          )}
          renderInput={(params) => (
            <TextField {...params} label="Progetti" variant="outlined" />
          )}
        />
      </Stack>

      <Card>
        <CardHeader
          title={<Typography variant="h6">Ore per Task</Typography>}
        />
        <CardContent>
          <BarChart
            {...barChartsParams}
            highlightedItem={
              selectedTaskData
                ? { seriesId: "hours", dataIndex: selectedTaskData.index }
                : null
            }
            onItemClick={(e, d) =>
              setSelectedTaskData({
                taskTitle: taskTitles[d.dataIndex],
                index: d.dataIndex,
              })
            }
          />
        </CardContent>
      </Card>
    </Box>
  );
}
