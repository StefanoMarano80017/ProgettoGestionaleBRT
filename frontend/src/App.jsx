// src/App.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "@/app/layouts/MainLayout";
import Login from "@/Pages/Login";
import RequireAuth from "@/Routes/RequireAuth";
import TimesheetRouter from "@domains/timesheet/pages/TimesheetRouter";
import DipendenteTimesheet from "@domains/timesheet/pages/DipendenteTimesheet";
// import DashboardAmministrazioneTimesheet from "./Pages/DashboardAmministrazioneTimesheet";
import Home from "@/Pages/Home"; // <-- aggiunto
import Commesse from "@/Pages/Commesse";
import CoordinatoreDashboard from "@domains/commesse/pages/CoordinatoreDashboard";

export default function App() {
  return (
    <Routes>
      {/* Public login route (first page) */}
      <Route path="/login" element={<Login />} />

      {/* Root index: show Login as the first page */}
      <Route index element={<Login />} />

      {/* Protected routes wrapped in RequireAuth + MainLayout */}
      <Route
        element={
          <RequireAuth>
            <MainLayout />
          </RequireAuth>
        }
      >
        {/* All protected routes as children - rendered via <Outlet /> in MainLayout */}
        <Route path="/home" element={<Home />} />
        <Route path="/Home" element={<Home />} />
        <Route path="/timesheet" element={<TimesheetRouter />} />
    <Route path="/commesse" element={<Commesse />} />
    <Route path="/commesse/coordinatore" element={<CoordinatoreDashboard />} />
        <Route path="/dipendente" element={<DipendenteTimesheet />} />
        <Route path="/app" element={<Home />} />
      </Route>
    </Routes>
  );
}
