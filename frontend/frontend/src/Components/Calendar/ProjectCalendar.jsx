import * as React from "react";
import { PickersDay } from "@mui/x-date-pickers";
import { isSameDay } from "date-fns";
import CalendarWithSidePanel from "./CalendarWithSidePanel";
import { Box, Typography, Paper, AvatarGroup, Avatar } from "@mui/material";

// Colore progresso in base alla percentuale
function completionColor(completion) {
  if (completion < 30) return "#f44336"; // rosso
  if (completion < 80) return "#ff9800"; // arancio
  return "#4caf50"; // verde
}

// Converte stringa in colore unico (utile se vuoi)
function stringToColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = "#";
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff;
    color += ("00" + value.toString(16)).slice(-2);
  }
  return color;
}

// Helper per generare projectDeadlines dai progetti
function generateProjectDeadlines(projects, employees) {
  const deadlines = {};

  projects.forEach((project) => {
    project.tasks.forEach((task) => {
      const key = task.deadline.toISOString().split("T")[0];
      const completion = Math.round((task.progress / task.total) * 100);
      const assignedAvatars = task.assigned.map(
        (id) => employees.find((e) => e.id === id)?.name?.[0] || "?"
      );

      deadlines[key] = {
        name: project.title,
        completion,
        description: task.description,
        avatars: assignedAvatars,
      };
    });
  });

  return deadlines;
}

export default function ProjectCalendar({
  selectedDate,
  setSelectedDate,
  currentMonth,
  setCurrentMonth,
  projects,
  employees,
}) {
  // genera la struttura necessaria dal props
  const projectDeadlines = React.useMemo(
    () => generateProjectDeadlines(projects, employees),
    [projects, employees]
  );

  const renderDay = (day, outsideCurrentMonth, other, selectedDate) => {
    const dayKey = day.toISOString().split("T")[0];
    const project = projectDeadlines[dayKey];
    const dayNumber = day.getDate();

    return (
      <PickersDay
        {...other}
        day={day}
        selected={isSameDay(day, selectedDate)}
        sx={{ p: 1, width: 60, height: 60 }}
      >
        <Box
          sx={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 60,
            height: 60,
          }}
        >
          {project && (
            <svg width="60" height="60">
              <circle
                cx="30"
                cy="30"
                r="26"
                stroke="#e0e0e0"
                strokeWidth="4"
                fill="none"
              />
              <circle
                cx="30"
                cy="30"
                r="26"
                stroke={completionColor(project.completion)}
                strokeWidth="4"
                fill="none"
                strokeDasharray={100}
                strokeDashoffset={100 - project.completion}
                strokeLinecap="round"
                transform="rotate(-90 30 30)"
              />
            </svg>
          )}
          <Typography
            variant="body1"
            sx={{
              position: "absolute",
              fontWeight: 600,
              fontSize: 18,
            }}
          >
            {dayNumber}
          </Typography>
        </Box>
      </PickersDay>
    );
  };

  const selectedKey = selectedDate?.toISOString().split("T")[0];
  const selectedProject = projectDeadlines[selectedKey];

  const previewPanel = selectedProject ? (
    <Paper sx={{ p: 2, display: "flex", flexDirection: "column", gap: 1 }}>
      <Typography variant="h6">{selectedProject.name}</Typography>
      <Typography variant="body2">{selectedProject.description}</Typography>
      <AvatarGroup max={4}>
        {selectedProject.avatars.map((a, idx) => (
          <Avatar key={idx}>{a}</Avatar>
        ))}
      </AvatarGroup>
    </Paper>
  ) : (
    <Box display="flex" justifyContent="center" alignItems="center" height="100%">
      <Paper sx={{ p: 2, display: "flex", alignItems: "center", gap: 1 }}>
        <Typography>Nessun progetto selezionato</Typography>
      </Paper>
    </Box>
  );

  return (
    <CalendarWithSidePanel
      title="Calendario Progetti"
      selectedDate={selectedDate}
      setSelectedDate={setSelectedDate}
      currentMonth={currentMonth}
      setCurrentMonth={setCurrentMonth}
      renderDay={renderDay}
      sidePanel={previewPanel}
    />
  );
}