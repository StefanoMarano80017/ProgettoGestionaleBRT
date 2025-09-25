import { Box, Typography } from "@mui/material";
import TaskCard from "./TaskCard";

export default function KanBanColumn({ title, tasks, onDelete, onAssign }) {
  return (
    <Box sx={{ width: 300, p: 2 }}>
      <Typography variant="h6">{title}</Typography>
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          onDelete={onDelete}
          onAssign={onAssign} // passa la funzione di assegnazione
        />
      ))}
    </Box>
  );
}
