import * as React from "react";
import { Badge, Box } from "@mui/material";
import { useProjects } from "../Hooks/useProject";

import CustomDataGridFiltred from "../Components/dashboardCoordinatore/CustomDataGridFiltred";

export default function DashboardCoordinatore() {
  const { data: projects, isLoading, error } = useProjects();

  const employees = [
    { id: 1, name: "Mario Rossi" },
    { id: 2, name: "Luca Bianchi" },
    { id: 3, name: "Giulia Verdi" },
    { id: 4, name: "Luca Bianchi" },
    { id: 5, name: "Giulia Verdi" },
  ];

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  // Prepara tutte le task in formato "arricchito"
  const allTasks = (projects || []).flatMap((project) => {
    return (project.tasks || []).map((task) => {
      // Prepara gli oggetti assegnati per CustomAvatarGroup
      const assignedEmployees = (task.assigned || [])
        .map((id) => employees.find((e) => e.id === id))
        .filter(Boolean);

      return {
        ...task,
        assignedEmployees, // array pronto da passare a CustomAvatarGroup
        projectTitle: project.title, // opzionale: se vuoi mostrare il progetto
      };
    });
  });

  return (
    <Box
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
      }}
    >
      <CustomDataGridFiltred tasks={allTasks}  employees={employees} />
    </Box>
  );
}
