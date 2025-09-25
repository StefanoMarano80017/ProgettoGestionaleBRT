import React from "react";
import { Box, Typography, IconButton, Chip, CircularProgress } from "@mui/material";
import ManageSearchIcon from "@mui/icons-material/ManageSearch";

export default function TaskItem({ task, employees, onManage }) {
  const progress = (task.progress / task.total) * 100;
  const assignedEmployees = employees.filter((emp) =>
    task.assigned?.includes(emp.id)
  );

  return (
    <Box sx={{ border: 1, borderColor: "divider", borderRadius: 1, overflow: "hidden", mb: 1 }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "primary.light",
          color: "primary.contrastText",
          px: 2,
          py: 1.25,
        }}
      >
        <Typography variant="subtitle1" fontWeight="bold" sx={{ lineHeight: 1.2 }}>
          {task.title}
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {/* Progresso circolare */}
          <Box sx={{ position: "relative", display: "inline-flex" }}>
            <CircularProgress variant="determinate" value={progress} size={32} thickness={5} />
            <Box
              sx={{
                top: 0,
                left: 0,
                bottom: 0,
                right: 0,
                position: "absolute",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography variant="caption">{`${progress}%`}</Typography>
            </Box>
          </Box>

          <IconButton onClick={() => onManage(task)} sx={{ color: "inherit", p: 0.5 }}>
            <ManageSearchIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {/* Body */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 1.5 }}>
        {/* Sinistra: date */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.25 }}>
          <Typography variant="body2">Creazione: {task.createdAt.toLocaleDateString()}</Typography>
          <Typography variant="body2">Scadenza: {task.deadline.toLocaleDateString()}</Typography>
        </Box>

        {/* Destra: chip dipendenti */}
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 0.5,
            justifyContent: "flex-end",
            flexGrow: 1,
            ml: 2,
          }}
        >
          {assignedEmployees.map((emp) => (
            <Chip key={emp.id} label={emp.name} size="small" />
          ))}
        </Box>
      </Box>
    </Box>
  );
}
