// src/Routes/RequireAuth.jsx
import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useUser } from "../context/UserContext";

const RequireAuth = () => {
  const { user, loading } = useUser();

  if (loading) {
    return <div>Loading...</div>; // oppure uno spinner
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default RequireAuth;
