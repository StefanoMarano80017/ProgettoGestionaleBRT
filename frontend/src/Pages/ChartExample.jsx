// src/pages/Home.jsx
import React, { useState, useMemo, useEffect } from "react";
import { Typography, Container } from "@mui/material";
import CoordinatorTaskChart from "../Components/charts/CoordinatorTaskChart";
import EmployeeTaskChart from "../Components/charts/EmployeeTaskChart";
import { employeeTasksMock } from "../mocks/employeeTasksMock";
import { useProjects } from "../Hooks/useProject";

export default function Home() {

  const { data: projects } = useProjects();
  console.log(projects);

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" gutterBottom>
        Benvenuto!
      </Typography>


      <EmployeeTaskChart tasks={employeeTasksMock}/>
      <CoordinatorTaskChart projects={projects} />

    </Container>
  );
}
