import * as React from "react";
import {
  Box,
  Autocomplete,
  TextField,
  Tabs,
  Tab,
} from "@mui/material";

import TableChartIcon from "@mui/icons-material/TableChart";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";

export default function NavigationBar({
  tabIndex,
  setTabIndex,
  projects,             // lista progetti
  selectedProject,      // progetto selezionato
  setSelectedProject,   // setter progetto selezionato
}) {
  // Lista dei progetti con "Tutti" come prima opzione
  const projectOptions = ["Tutti", ...projects.map((p) => p.title)];

  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="space-between"
      px={1}
      pt={1}
      borderBottom={1}
      borderColor="divider"
      bgcolor="background.paper"
    >
      {/* Autocomplete Progetto */}
      <Autocomplete
        size="small"
        sx={{ minWidth: 250, mr: 2 }}
        options={projectOptions}
        value={selectedProject}
        onChange={(_, newValue) => setSelectedProject(newValue || "Tutti")}
        clearOnEscape
        renderInput={(params) => (
          <TextField {...params} label="Progetto" variant="outlined" />
        )}
      />

      {/* Tabs */}
      <Tabs
        value={tabIndex}
        onChange={(_, i) => setTabIndex(i)}
        textColor="primary"
        indicatorColor="primary"
        sx={{ minHeight: 32, height: 32 }}
      >
        <Tab
          icon={<TableChartIcon fontSize="small" />}
          label="Spreadsheet"
          iconPosition="start"
          sx={{ minHeight: 32, height: 32, py: 0 }}
        />
        <Tab
          icon={<CalendarMonthIcon fontSize="small" />}
          label="Calendar"
          iconPosition="start"
          sx={{ minHeight: 32, height: 32, py: 0 }}
        />
      </Tabs>
    </Box>
  );
}
