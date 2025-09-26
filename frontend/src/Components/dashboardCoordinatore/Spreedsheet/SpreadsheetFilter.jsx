import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Pagination,
  Select,
  MenuItem,
  Stack,
  Divider,
  Chip,
} from "@mui/material";

import Spreadsheet from "./Spreadsheet";
import FiltersMenu from "./Filters/FiltersMenu";
import CustomAvatarGroup from "../../Avatar/CustomAvatarGroup";

const SpreadsheetWithFiltersAndPagination = ({
  projects,
  employees,
  selectedProject,
}) => {
  const [textFilter, setTextFilter] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState([]);
  const [statusFilter, setStatusFilter] = useState([]);
  const [createdFrom, setCreatedFrom] = useState("");
  const [completedTo, setCompletedTo] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const statusOptions = ["In corso", "Urgente", "Completato"];

  // Filtraggio progetti in base al prop selectedProject
  const filteredProjects = projects
    .filter((project) =>
      !selectedProject || selectedProject === "Tutti"
        ? true
        : project.title === selectedProject
    )
    .map((project) => {
      const filteredTasks = (project.tasks ?? []).filter((task) => {
        const matchesText =
          !textFilter ||
          task.title.toLowerCase().includes(textFilter.toLowerCase()) ||
          project.title.toLowerCase().includes(textFilter.toLowerCase());

        const matchesEmployee =
          employeeFilter.length === 0 ||
          employeeFilter.some((empId) => task.assigned.includes(empId));

        const matchesStatus =
          statusFilter.length === 0 || statusFilter.includes(task.tag);

        const matchesCreated =
          !createdFrom ||
          (task.created && new Date(task.created) >= new Date(createdFrom));

        const matchesCompleted =
          !completedTo ||
          (task.completed && new Date(task.completed) <= new Date(completedTo));

        return (
          matchesText &&
          matchesEmployee &&
          matchesStatus &&
          matchesCreated &&
          matchesCompleted
        );
      });

      return { ...project, tasks: filteredTasks };
    })
    .filter((project) => project.tasks.length > 0);

  const pageCount = Math.ceil(filteredProjects.length / rowsPerPage);
  const displayedProjects = filteredProjects.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  // Funzione per rimuovere un filtro
  const removeFilter = (type) => {
    switch (type) {
      case "text":
        setTextFilter("");
        break;
      case "employee":
        setEmployeeFilter([]);
        break;
      case "status":
        setStatusFilter([]);
        break;
      case "createdFrom":
        setCreatedFrom("");
        break;
      case "completedTo":
        setCompletedTo("");
        break;
      default:
        break;
    }
  };

  return (
    <Card sx={{ height: 600, display: "flex", flexDirection: "column" }}>
      {/* Barra filtri */}
      <CardContent
        sx={{
          borderBottom: "1px solid #ccc",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 1,
        }}
      >
        {/* Chips dei filtri attivi */}
        <Stack
          direction="row"
          spacing={1}
          gap={1}
          sx={{ flexWrap: "nowrap", flexDirection: "row-reverse", mr: 1 }}
        >
          {textFilter && (
            <Chip
              label={`Testo: ${textFilter}`}
              color="primary"
              onDelete={() => removeFilter("text")}
            />
          )}
          {employeeFilter.length > 0 && (
            <Chip
              color="secondary"
              onDelete={() => removeFilter("employee")}
              label={
                <Box display="flex" alignItems="center">
                  <CustomAvatarGroup
                    data={employees.filter((e) =>
                      employeeFilter.includes(e.id)
                    )}
                    max={2} // numero massimo di avatar visibili
                  />
                </Box>
              }
            />
          )}
          {statusFilter.length > 0 && (
            <Chip
              label={`Stato: ${statusFilter.join(", ")}`}
              color="success"
              onDelete={() => removeFilter("status")}
            />
          )}
          {createdFrom && (
            <Chip
              label={`Creati da: ${createdFrom}`}
              color="warning"
              onDelete={() => removeFilter("createdFrom")}
            />
          )}
          {completedTo && (
            <Chip
              label={`Chiusi entro: ${completedTo}`}
              color="warning"
              onDelete={() => removeFilter("completedTo")}
            />
          )}
        </Stack>

        {/* Search bar + bottone filtri */}
        <Box sx={{ display: "flex", gap: 1, minWidth: 300 }}>
          <FiltersMenu
            textFilter={textFilter}
            setTextFilter={setTextFilter}
            employees={employees}
            employeeFilter={employeeFilter}
            setEmployeeFilter={setEmployeeFilter}
            statusOptions={statusOptions}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            createdFrom={createdFrom}
            setCreatedFrom={setCreatedFrom}
            completedTo={completedTo}
            setCompletedTo={setCompletedTo}
            sx={{ flex: 1 }}
          />
        </Box>
      </CardContent>

      {/* Tabella scrollabile */}
      <Box sx={{ flex: 1, overflow: "auto" }}>
        <Spreadsheet projects={displayedProjects} employees={employees} />
      </Box>

      <Divider />
      {/* Paginazione */}
      <CardContent
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Pagination
          count={pageCount}
          page={page}
          onChange={(e, value) => setPage(value)}
          color="primary"
        />
        <Box display="flex" alignItems="center" gap={1}>
          <Typography>Righe per pagina:</Typography>
          <Select
            value={rowsPerPage}
            size="small"
            onChange={(e) => setRowsPerPage(parseInt(e.target.value))}
          >
            {[5, 10, 20, 50].map((n) => (
              <MenuItem value={n} key={n}>
                {n}
              </MenuItem>
            ))}
          </Select>
        </Box>
      </CardContent>
    </Card>
  );
};

export default SpreadsheetWithFiltersAndPagination;
