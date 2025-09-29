import React, { useState, useMemo, useEffect } from "react";
import DataGridDashboardLayout from "../Layouts/DataGridDashboardLayout";
import CustomDataGrid from "../Components/dashboardCoordinatore/CustomDataGrid";
import ProjectCalendar from "../Components/Calendar/ProjectCalendar";
import { useProjects } from "../Hooks/useProject";

// Hook dei filtri
import { useTextFilter } from "../Components/DataGridDashboard/FiltersHooks/useTextFilter";
import { useStatusFilter } from "../Components/DataGridDashboard/FiltersHooks/useStatusFilter";
import { useEmployeeFilter } from "../Components/DataGridDashboard/FiltersHooks/useEmployeeFilter";

export default function DashboardCoordinatore() {
  const { data: projects } = useProjects();

  const employees = [
    { id: 1, name: "Mario Rossi" },
    { id: 2, name: "Luca Bianchi" },
    { id: 3, name: "Giulia Verdi" },
    { id: 4, name: "Luca Bianchi" },
    { id: 5, name: "Giulia Verdi" },
  ];

  const [tabIndex, setTabIndex] = useState(0);
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Seleziona tutti i progetti inizialmente
  useEffect(() => {
    if (projects?.length) {
      setSelectedProjects(projects.map((p) => p.title));
    }
  }, [projects]);

  // --- Inizializza hook dei filtri ---
  const textFilter = useTextFilter();
  const employeeFilter = useEmployeeFilter(employees);
  const statusFilter = useStatusFilter(["In corso", "Urgente", "Completato"]);
  const filters = [textFilter, employeeFilter, statusFilter];
  const activeFilters = filters.map((f) => f.label);

  // --- Tasks filtrate per progetti selezionati ---
  const tasks = useMemo(
    () =>
      (projects || [])
        .filter(
          (p) =>
            selectedProjects.includes("Tutti") ||
            selectedProjects.includes(p.title)
        )
        .flatMap((project) =>
          (project.tasks || []).map((task) => ({
            ...task,
            assignedEmployees: (task.assigned || [])
              .map((id) => employees.find((e) => e.id === id))
              .filter(Boolean),
            projectTitle: project.title,
          }))
        ),
    [projects, employees, selectedProjects]
  );

  // --- Applica tutti i filtri ai task ---
  const filteredTasks = useMemo(
    () => filters.reduce((acc, f) => f.filterFn(acc), tasks),
    [tasks, filters]
  );

  // --- Views ---
  const views = {
    0: <CustomDataGrid tasks={filteredTasks} employees={employees} />,
    1: (
      <ProjectCalendar
        tasks={filteredTasks}      // array filtrato di task
        employees={employees}      // lista dipendenti per side panel
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        currentMonth={currentMonth}
        setCurrentMonth={setCurrentMonth}
        cellSize={40}              // dimensione dei giorni
        calendarFlex={1}           // proporzione calendario
        sidePanelFlex={2}          // proporzione side panel
      />
    ),
  };

  return (
    <DataGridDashboardLayout
      tabIndex={tabIndex}
      setTabIndex={setTabIndex}
      projects={projects}
      selectedProjects={selectedProjects}
      setSelectedProjects={setSelectedProjects}
      filtersProps={{ filters, activeFilters }}
      employees={employees}
      statusOptions={["In corso", "Urgente", "Completato"]}
      views={views}
    />
  );
}
