import React from "react";
import { Chip } from "@mui/material";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export default function SortableChip({ tab, active, onClick, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: tab.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Chip
      ref={setNodeRef}
      label={tab.label}
      color={active ? "primary" : "default"}
      onClick={onClick}
      onDelete={onDelete}
      icon={
        <DragIndicatorIcon
          {...attributes}
          {...listeners}
          sx={{
            cursor: "grab",
            "&:active": { cursor: "grabbing" },
          }}
        />
      }
      sx={{
        ...style,
        cursor: "pointer",
      }}
    />
  );
}
