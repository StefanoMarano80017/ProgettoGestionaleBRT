import { useState } from "react";
import Board from "./Board";

export default function KanbanBoard() {
  const [columns, setColumns] = useState([
    {
      id: "todo",
      title: "Da fare",
      tasks: [
        { id: "1", title: "Task 1", assignees: [] },
        { id: "2", title: "Task 2", assignees: [] },
      ],
    },
    {
      id: "inProgress",
      title: "In corso",
      tasks: [{ id: "3", title: "Task 3", assignees: [] }],
    },
  ]);

  // Rimuove un task
  const handleDelete = (taskId) => {
    setColumns((prevColumns) =>
      prevColumns.map((column) => ({
        ...column,
        tasks: column.tasks.filter((task) => task.id !== taskId),
      }))
    );
  };

  // Assegna un task a un dipendente
  const handleAssign = (taskId, assignees) => {
    setColumns((prevColumns) =>
      prevColumns.map((column) => ({
        ...column,
        tasks: column.tasks.map((task) =>
          task.id === taskId ? { ...task, assignees } : task
        ),
      }))
    );
  };

  return (
    <Board columns={columns} onDelete={handleDelete} onAssign={handleAssign} />
  );
}
