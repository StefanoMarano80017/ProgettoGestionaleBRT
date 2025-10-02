// src/App.jsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import MainLayout from "./Layouts/MainLayout";
import Login from "./Pages/Login";
import RequireAuth from "./Routes/RequireAuth";
import TimesheetRouter from "./Pages/TimesheetRouter";
import DipendenteHome from "./Pages/DipendenteHome";
import DashboardAmministrazioneTimesheet from "./Pages/DashboardAmministrazioneTimesheet";
import Home from "./Pages/Home"; // <-- aggiunto
import DashboardCoordinatore from "./Pages/DashboardCoordinatore";

export default function App() {
  return (
    <>
      {/* Router definito in main.jsx */}
      <Routes>
        {/* Login fuori dal layout principale */}
        <Route path="/login" element={<Login />} />

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
                <DipendenteHome />
              </RequireAuth>
            }
          />
          <Route
            path="amministrazione"
            element={
              <RequireAuth>
                <DashboardAmministrazioneTimesheet />
              </RequireAuth>
            }
          />

          {/* Default -> Home */}
          <Route
            index
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
