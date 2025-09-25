import { Box } from "@mui/material";
import KanBanColumn from "./KanBanColumns";

export default function Board({ columns, onDelete, onAssign }) {
  return (
    <Box sx={{ display: "flex", gap: 2 }}>
      {columns.map((column) => (
        <KanBanColumn
          key={column.id}
          title={column.title}
          tasks={column.tasks}
          onDelete={onDelete}
          onAssign={onAssign} // passa la funzione di assegnazione
        />
      ))}
    </Box>
  );
}
