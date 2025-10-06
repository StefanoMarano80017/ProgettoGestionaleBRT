import React from "react";
import { Box }          from "@mui/material";
import FiltersBar       from "@shared/components/DataGridDashboard/FiltersBar";
import NavigationBar    from "@shared/components/DataGridDashboard/NavigationBar";

export default function DataGridDashboardLayout({
  tabIndex,
  setTabIndex,
  projects,
  selectedProjects,
  setSelectedProjects,
  filtersProps,      // stato e funzioni dei filtri
  employees,
  statusOptions,
  views,             // oggetto { tabIndex: componente } da renderizzare
}) {
  return (
    <Box display="flex" flexDirection="column" height="100%" width="100%" >
      {/* Navigation bar */}
      <NavigationBar
        tabIndex={tabIndex}
        setTabIndex={setTabIndex}
        projects={projects}
        selectedProjects={selectedProjects}
        setSelectedProjects={setSelectedProjects}
      />

      {/* Barra filtri */}
      {filtersProps && (
        <FiltersBar
          {...filtersProps}
          employees={employees}
          statusOptions={statusOptions}
        />
      )}

      {/* Views */}
      <Box flex={1} display="flex" flexDirection="column">
        {views[tabIndex]}
      </Box>
    </Box>
  );
}
