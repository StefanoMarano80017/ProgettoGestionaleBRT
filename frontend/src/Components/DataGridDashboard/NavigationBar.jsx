import * as React from "react";
import { Box, Autocomplete, TextField, Tabs, Tab, Checkbox, ListItemText } from "@mui/material";
import TableChartIcon from "@mui/icons-material/TableChart";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";

export default function NavigationBar({
  tabIndex,
  setTabIndex,
  projects = [],
  selectedProjects = [],
  setSelectedProjects,
}) {
  const projectOptions = projects.map((p) => p.title);

  const handleProjectChange = (_, newValue) => {
    // Se nessun progetto è selezionato, consideriamo tutti
    if (!newValue || newValue.length === 0) {
      setSelectedProjects(projectOptions);
    } else {
      setSelectedProjects(newValue);
    }
  };

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
      {/* Autocomplete Progetti multipli con checkbox */}
      <Autocomplete
        multiple
        size="small"
        limitTags={2}
        options={projectOptions}
        value={selectedProjects}
        onChange={handleProjectChange}
        clearOnEscape
        disableCloseOnSelect
        renderOption={(props, option, { selected }) => (
          <li {...props}>
            <Checkbox
              style={{ marginRight: 8 }}
              checked={selected}
            />
            <ListItemText primary={option} />
          </li>
        )}
        renderInput={(params) => (
          <TextField {...params} label="Progetti" variant="outlined" />
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
