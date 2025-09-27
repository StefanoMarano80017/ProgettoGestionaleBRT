import * as React from "react";
import { PickersDay } from "@mui/x-date-pickers";
import { isSameDay } from "date-fns";
import CalendarWithSidePanel from "./CalendarWithSidePanel";
import ProjectSidePanel from "./ProjectSidePanel";
import { Badge, Box, Typography } from "@mui/material";

// Formatta la data in YYYY-MM-DD in modo sicuro
function formatDateLocal(dateInput) {
  if (!dateInput) return ""; // protezione se undefined o null
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(date)) return ""; // protezione se la data non è valida
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Genera mappa { "YYYY-MM-DD": task[] }
function generateTasksMap(projects) {
  const map = {};
  projects.forEach((project) =>
    project.tasks.forEach((task) => {
      const key = formatDateLocal(task.deadline);
      if (!map[key]) map[key] = [];
      map[key].push({ ...task, projectTitle: project.title });
    })
  );
  return map;
}

export default function ProjectCalendar({
  selectedDate,
  setSelectedDate,
  currentMonth,
  setCurrentMonth,
  projects = [],
  employees = [],
  cellSize = 40,
  calendarFlex = 1,
  sidePanelFlex = 2,
}) {
  const tasksMap = React.useMemo(() => generateTasksMap(projects), [projects]);

  // Rendering dei giorni
  const renderDay = (day, _value, DayComponentProps) => {
    const key = formatDateLocal(day);
    const tasks = tasksMap[key] || [];

    return (
      <PickersDay
        {...DayComponentProps} 
        sx={{
          p: 0.5,
          width: cellSize,
          height: cellSize,
          ...DayComponentProps.sx,
        }}
      >
        <Box
          sx={{
            position: "relative",
            width: cellSize,
            height: cellSize,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {tasks.length > 0 && (
            <Badge
              badgeContent={tasks.length}
              color="primary"
              sx={{
                position: "absolute",
                top: 2,
                right: 2,
                "& .MuiBadge-badge": {
                  fontSize: Math.round(cellSize / 3.5),
                  height: Math.round(cellSize / 2.5),
                  minWidth: Math.round(cellSize / 2.5),
                  mt: 1,
                },
              }}
            />
          )}
          <Typography
            sx={{ fontWeight: 600, fontSize: Math.round(cellSize / 2.5) }}
          >
            {day.getDate()}
          </Typography>
        </Box>
      </PickersDay>
    );
  };

  const selectedKey = formatDateLocal(selectedDate);
  const selectedTasks = tasksMap[selectedKey] || null;

  return (
    <CalendarWithSidePanel
      selectedDate={selectedDate}
      setSelectedDate={setSelectedDate}
      currentMonth={currentMonth}
      setCurrentMonth={setCurrentMonth}
      renderDay={renderDay}
      sidePanel={
        <ProjectSidePanel
          tasks={selectedTasks} // array di task per il giorno selezionato
          employees={employees}
        />
      }
      calendarFlex={calendarFlex}
      sidePanelFlex={sidePanelFlex}
    />
  );
}
