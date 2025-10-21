// src/App.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "@/app/layouts/MainLayout";
import Login from "@/Pages/Login";
import RequireAuth from "@/Routes/RequireAuth";
import TimesheetRouter from "@domains/timesheet/pages/TimesheetRouter";
import DipendenteTimesheet from "@domains/timesheet/pages/DipendenteTimesheet";
import Home from "@/Pages/Home";
import Commesse from "@/Pages/Commesse";
import CoordinatoreDashboard from "@domains/commesse/pages/CoordinatoreDashboard";
import { AuthProvider } from "@/auth/AuthProvider"; 
import { UserProvider } from "@/context/UserContext"; 

export default function App() {
  return (
    //fornisce tutti i dati dell'utente tramite const { user, loading } = useUser();
    <UserProvider>
      {/* Gestisce in automatico il login e relativo token JWT*/}
      <AuthProvider>
        <Routes>
          {/* Public route: login */}
          <Route path="/login" element={<Login />} />
          <Route index element={<Navigate to="/login" replace />} />
          {/* Protected routes */}
          <Route element={<MainLayout />}>
            <Route element={<RequireAuth />}>
              <Route path="/home" element={<Home />} />
              <Route path="/Home" element={<Navigate to="/home" replace />} />
              <Route path="/timesheet" element={<TimesheetRouter />} />
              <Route path="/commesse" element={<Commesse />} />
              <Route path="/commesse/coordinatore" element={<CoordinatoreDashboard />} />
              <Route path="/dipendente" element={<DipendenteTimesheet />} />
              <Route path="/app" element={<Home />} />
            </Route>
          </Route>
          {/* Catch-all → redirect al login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </UserProvider>
  );
}
