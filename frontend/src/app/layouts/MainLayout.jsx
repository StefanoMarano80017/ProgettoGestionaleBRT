// src/layouts/MainLayout.jsx
import { Outlet } from "react-router-dom";
import { Box } from "@mui/material";
import Sidebar from "@/Components/Bars/Sidebar";
import Header from "@/Components/Bars/Header";

export default function MainLayout() {
  // Removed unused collapsed state/handler (sidebar currently handles its own internal state)

  return (
    <Box sx={{ display: "flex", height: "100vh", width: "100vw" }}>
      <Sidebar sx={{ height: "100%" }} />
      <Box sx={{ display: "flex", height: "100vh", width: "100vw", flexDirection: "column" }}>
        <Header />
          <Box sx={{ flexGrow: 1, overflowY: "auto", overflowX: "hidden" }}>
            <Outlet />
          </Box>
      </Box>
    </Box>
  );
}
