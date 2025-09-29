// src/pages/Home.jsx
import { Typography, Container } from "@mui/material";
import DashboardChartHour from "../Components/charts/DashboardChartHour";

import EmployeeTaskChart from "../Components/charts/EmployeeTaskChart";
import { employeeTasksMock } from "../mocks/employeeTasksMock";

export default function Home() {
  return (
    <Container maxWidth="xl">
      <Typography variant="h4" gutterBottom>
        Benvenuto!
      </Typography>

      <DashboardChartHour />

      <EmployeeTaskChart tasks={employeeTasksMock}/>
      
    </Container>
  );
}
