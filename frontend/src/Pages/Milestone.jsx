import * as React from "react";
import { Badge, Box } from "@mui/material";
import NavigationBar from "../Components/MilestonePage/NavigationBar";
import SpreadsheetFilter from "../Components/Spreedsheet/SpreadsheetFilter";
import ProjectCalendar from "../Components/Calendar/ProjectCalendar";
import { useProjects } from "../Hooks/useProject";
import BadgeCard from "../Components/BadgeCard/BadgeCard";

export default function Milestone() {
  // React Query
  const { data: projects, isLoading, error } = useProjects();

  // Stato locale
  const [tabIndex, setTabIndex] = React.useState(0);
  const [selectedDate, setSelectedDate] = React.useState(new Date());
  const [currentMonth, setCurrentMonth] = React.useState(new Date().getMonth());

  const [selectedProject, setSelectedProject] = React.useState("Tutti"); // progetto selezionato

  const employees = [
    { id: 1, name: "Mario Rossi" },
    { id: 2, name: "Luca Bianchi" },
    { id: 3, name: "Giulia Verdi" },
    { id: 4, name: "Luca Bianchi" },
    { id: 5, name: "Giulia Verdi" },
  ];

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <Box>
      {/* Barra di navigazione */}
      <NavigationBar
        tabIndex={tabIndex}
        setTabIndex={setTabIndex}
        projects={projects} // lista dei progetti
        selectedProject={selectedProject} // progetto selezionato
        setSelectedProject={setSelectedProject} // setter per aggiornare
      />

      {/* Tab content */}
      {tabIndex === 0 && (
        <SpreadsheetFilter
          projects={projects}
          employees={employees}
          selectedProject={selectedProject} // filtriamo in base al progetto selezionato
        />
      )}
      {tabIndex === 1 && (
        <ProjectCalendar
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          currentMonth={currentMonth}
          setCurrentMonth={setCurrentMonth}
          projects={projects}
          employees={employees}
          selectedProject={selectedProject} // anche il calendario riceve il filtro
        />
      )}
    </Box>
  );
}
