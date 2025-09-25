import * as React from "react";
import { Box, Paper, Typography, Pagination } from "@mui/material";
import TaskDetailCard from "./TaskDetailCard";

export default function ProjectSidePanel({ tasks }) {
  const pageSize = 2; // due card per pagina
  const safeTasks = Array.isArray(tasks) ? tasks : [];

  const totalPages = Math.ceil(safeTasks.length / pageSize);
  const [page, setPage] = React.useState(1); // Pagination è 1-based

  const handleChange = (event, value) => {
    setPage(value);
  };

  const currentTasks = safeTasks.slice(
    (page - 1) * pageSize,
    (page - 1) * pageSize + pageSize
  );

  if (safeTasks.length === 0) {
    return (
      <Box sx={{ width: "100%", height: "100%" }}>
        <Paper
          sx={{
            p: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography>Seleziona un giorno con task</Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      {/* Area delle card scrollabile */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
          },
          gap: 2,
          flexGrow: 1, // prende tutto lo spazio disponibile
          maxHeight: "calc(100% - 60px)",
        }}
      >
        {currentTasks.map((task) => (
          <TaskDetailCard key={task.id} task={task} />
        ))}
      </Box>

      {/* Pagination sempre in fondo */}
      <Box sx={{ display: "flex", justifyContent: "center"}}>
        <Pagination
          count={totalPages}
          page={page}
          onChange={handleChange}
          color="primary"
        />
      </Box>
    </Box>
  );
}
