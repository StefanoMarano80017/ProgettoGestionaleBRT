import * as React from "react";
import { Box, Typography } from "@mui/material";
import SpreadsheetFilter from "../Components/Spreedsheet/SpreadsheetFilter";
import ProjectCalendar from "../Components/Calendar/ProjectCalendar";
import NavigationBar from "../Components/MilestonePage/NavigationBar";

export default function Milestone() {
  const categories = ["Categoria 1", "Categoria 2", "Categoria 3"];
  const [selectedCategory, setSelectedCategory] = React.useState(categories[0]);
  const [tabIndex, setTabIndex] = React.useState(0);

  const [selectedDate, setSelectedDate] = React.useState(new Date());
  const [currentMonth, setCurrentMonth] = React.useState(new Date().getMonth());

  const employees = [
    { id: 1, name: "Mario Rossi" },
    { id: 2, name: "Luca Bianchi" },
    { id: 3, name: "Giulia Verdi" },
    { id: 4, name: "Luca Bianchi" },
    { id: 5, name: "Giulia Verdi" },
  ];

  const projects = [
    {
      id: 1,
      title: "Progetto Alpha",
      description: "Implementazione piattaforma",
      tasks: [
        {
          id: 1,
          title: "Task 1",
          description: "UI principale",
          progress: 3,
          total: 10,
          assigned: [1, 3, 5],
          createdAt: new Date("2025-09-01"),
          deadline: new Date("2025-09-30"),
          tag: "In corso",
        },
        {
          id: 2,
          title: "Task 2",
          description: "Bug fix",
          progress: 7,
          total: 10,
          assigned: [2],
          createdAt: new Date("2025-09-05"),
          deadline: new Date("2025-10-05"),
          tag: "Urgente",
        },
      ],
    },
    {
      id: 2,
      title: "Progetto Beta",
      description: "Modulo API",
      tasks: [
        {
          id: 3,
          title: "Task A",
          description: "Definizione specifiche",
          progress: 2,
          total: 5,
          assigned: [3],
          createdAt: new Date("2025-09-02"),
          deadline: new Date("2025-09-20"),
          tag: "In corso",
        },
      ],
    },
    {
      id: 3,
      title: "Progetto Alpha",
      description: "Implementazione piattaforma",
      tasks: [
        {
          id: 1,
          title: "Task 1",
          description: "UI principale",
          progress: 3,
          total: 10,
          assigned: [1, 3, 5],
          createdAt: new Date("2025-09-01"),
          deadline: new Date("2025-09-30"),
          tag: "In corso",
        },
        {
          id: 2,
          title: "Task 2",
          description: "Bug fix",
          progress: 7,
          total: 10,
          assigned: [2],
          createdAt: new Date("2025-09-05"),
          deadline: new Date("2025-10-05"),
          tag: "Urgente",
        },
      ],
    },
  ];

  return (
    <Box sx={{ m: 2 }}>
      <NavigationBar
        categories={categories}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        tabIndex={tabIndex}
        setTabIndex={setTabIndex}
      />

      {/* Contenitore dei tab sempre montato */}
      <Box
        sx={{
          position: "relative",
          width: "100%",
        }}
      >
        <Box
          sx={{
            position: tabIndex === 0 ? "relative" : "absolute",
            top: 0,
            left: 0,
            width: "100%",
            transition: "opacity 0.3s",
            opacity: tabIndex === 0 ? 1 : 0,
            pointerEvents: tabIndex === 0 ? "auto" : "none",
          }}
        >
          <SpreadsheetFilter projects={projects} employees={employees} />
        </Box>

        <Box
          sx={{
            position: tabIndex === 1 ? "relative" : "absolute",
            top: 0,
            left: 0,
            width: "100%",
            transition: "opacity 0.3s",
            opacity: tabIndex === 1 ? 1 : 0,
            pointerEvents: tabIndex === 1 ? "auto" : "none",
          }}
        >
          <ProjectCalendar
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            currentMonth={currentMonth}
            setCurrentMonth={setCurrentMonth}
            projects={projects} 
            employees={employees}
          />
        </Box>
      </Box>
    </Box>
  );
}
