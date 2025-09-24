import { Box, Typography } from "@mui/material";
import Card from "./Card";

export default function Column({ title, tasks, onDelete }) {
  return (
    <Box sx={{ width: 300, p: 2 }}>
      <Typography variant="h6">{title}</Typography>
      {tasks.map((task) => (
        <Card key={task.id} task={task} onDelete={onDelete} />
      ))}
    </Box>
  );
}
