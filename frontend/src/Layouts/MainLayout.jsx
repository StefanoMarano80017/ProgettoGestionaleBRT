// src/layouts/MainLayout.jsx
import { Outlet } from "react-router-dom";
import { Box } from "@mui/material";
import Sidebar from "../Components/Bars/Sidebar";
import Header from "../Components/Bars/Header";
import { useState } from "react";

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const handleToggleSidebar = () => {
    setCollapsed((prev) => !prev);
  };

  return (
    <Box sx={{ display: "flex", height: "100vh", width: "100vw" }}>
      {/* Sidebar verticale */}
      <Sidebar sx={{ height: "100vh" }} collapsed={collapsed} />

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden", // previene scroll orizzontale
        }}
      >
        <Header
          breadcrumbItems={[
            { label: "Commesse" , href: "/commesse"},
            { label: "Commesse" , href: "/commesse"},
            { label: "Commesse" , href: "/commesse"},
            { label: "Commesse" , href: "/commesse"},
          ]}
          onToggleSidebar={handleToggleSidebar}
        />

        {/* Contenuto scrollabile sotto l'AppBar */}
        <Box
          sx={{
            flexGrow: 1,
            overflowY: "auto", // scroll verticale
            overflowX: "hidden",
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
