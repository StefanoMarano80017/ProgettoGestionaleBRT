// src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./Layouts/ThemeContext";
import Layout from "./Layouts/MainLayout";
import Home from "./Pages/Home";
import About from "./Pages/About";
import Milestone from "./Pages/Milestone";
import DipendentiHome from "./Pages/DipendenteHome";
import DashboardAmministrazione from "./Pages/DashboardAmministrazione";
import DashboardCoordinatore from "./Pages/DashboardCoordinatore";

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />  
            <Route path="about" element={<About />} />
            <Route path="milestone" element={<Milestone/>} />
            <Route path="timesheet"                 element={<DipendentiHome/>} />
            <Route path="dashboardAmministrazione"  element={<DashboardAmministrazione/>} />
            <Route path="dashboardCoordinatore"  element={<DashboardCoordinatore/>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
