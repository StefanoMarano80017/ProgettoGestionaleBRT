import { Box, Typography, IconButton } from "@mui/material";
import { Delete as DeleteIcon } from "@mui/icons-material";

export default function Card({ task, onDelete }) {
  return (
    <Box sx={{ border: 1, borderRadius: 1, p: 1, mb: 1 }}>
      <Typography variant="body2">{task.title}</Typography>
      <Typography variant="caption" color="textSecondary">
        Assegnato a: {task.assignee}
      </Typography>
      <IconButton size="small" onClick={() => onDelete(task.id)}>
        <DeleteIcon fontSize="small" />
      </IconButton>
    </Box>
  );
}
