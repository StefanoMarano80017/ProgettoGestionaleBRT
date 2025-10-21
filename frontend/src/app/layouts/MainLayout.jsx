// src/layouts/MainLayout.jsx
import { Outlet } from "react-router-dom";
import { Box } from "@mui/material";
import Sidebar from "@shared/components/Bars/Sidebar";
import Header from "@shared/components/Bars/Header";
import { Footer } from '@shared/components/Footer/';

export default function MainLayout() {
  return (
    <Box sx={{ display: "flex", height: "100vh", width: "100vw" }}>
      <Sidebar />
      <Box sx={{ display: "flex", height: "100vh", width: "100vw", flexDirection: "column" }}>
        <Header />
        <Box component="main" sx={{ flexGrow: 1, overflowY: "auto", overflowX: "hidden" }}>
          <Outlet />
          <Footer />
        </Box>
      </Box>
    </Box>
  );
}
