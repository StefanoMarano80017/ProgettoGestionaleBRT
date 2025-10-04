// src/App.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "@layouts/MainLayout";
import Login from "@pages/Login";
import RequireAuth from "@routes/RequireAuth";
import TimesheetRouter from "@pages/Timesheet/TimesheetRouter";
import DipendenteTimesheet from "@pages/Timesheet/DipendenteTimesheet";
// import DashboardAmministrazioneTimesheet from "./Pages/DashboardAmministrazioneTimesheet";
import Home from "@pages/Home"; // <-- aggiunto

export default function App() {
  return (
    <>
      {/* Router definito in main.jsx */}
      <Routes>
  {/* Public login route (first page) */}
  <Route path="/login" element={<Login />} />

  {/* Root index: show Login as the first page */}
  <Route index element={<Login />} />

        {/* App protetta */}
        <Route path="/" element={<MainLayout />}>
          {/* Supporto al path "/Home" della Sidebar */}
          <Route
            path="Home"
            element={
              <RequireAuth>
                <Home />
              </RequireAuth>
            }
          />

          {/* Rotta timesheet che instrada per ruolo */}
          <Route
            path="timesheet"
            element={
              <RequireAuth>
                <TimesheetRouter />
              </RequireAuth>
            }
          />

          {/* Esempi altre pagine protette (opzionali) */}
          <Route
            path="dipendente"
            element={
              <RequireAuth>
                <DipendenteTimesheet />
              </RequireAuth>
            }
          />
          { /* Rimosso collegamento diretto a /amministrazione (si usa TimesheetRouter per ruolo) */ }

          {/* Default protected index moved to /app (optional) - keep explicit /Home route */}
          <Route
            path="app"
            element={
              <RequireAuth>
                <Home />
              </RequireAuth>
            }
          />
        </Route>
      </Routes>
    </>
  );
}
