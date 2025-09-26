import React, { useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { Tabs, Tab, Box, Typography } from "@mui/material";
import ResizableLayout from "../Layouts/ResizableLayout";
import DynamicTabDataGrid from "../Components/dashboardAmministrazione/DynamicTabDataGrid";

// TabPanel
function TabPanel({ children, value, index }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      style={{ height: "100%", overflow: "auto" }}
    >
      {value === index && (
        <Box sx={{ p: 2 }}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

// Custom Tabs
function CustomTabs() {
  const [tabValue, setTabValue] = useState(0);
  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Tabs value={tabValue} onChange={(e, val) => setTabValue(val)}>
        <Tab label="Tab 1" />
        <Tab label="Tab 2" />
      </Tabs>
      <Box sx={{ flex: 1 }}>
        <TabPanel value={tabValue} index={0}>
          Contenuto Tab 1
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          Contenuto Tab 2
        </TabPanel>
      </Box>
    </Box>
  );
}

// Uso del layout modulare
export default function App() {
  return (
    <ResizableLayout
      bottomComponent={
        <div style={{ padding: 16 }}>
          <h3>Componente Bottom</h3>
          <p>Puoi mettere qualsiasi contenuto qui.</p>
        </div>
      }
      topComponent={
        // Il DataGrid ora occuperà tutto lo spazio disponibile nel bottom
        <div
          style={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
          }}
        >
          <DynamicTabDataGrid />
        </div>
      }
      defaultSize={200}
      minSize={100}
    />
  );
}
