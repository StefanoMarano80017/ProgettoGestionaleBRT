import React, { useState, useMemo } from "react";
import {
  Box,
  Card,
  CardContent,
  Stack,
  Chip,
  Divider,
  Select,
  MenuItem,
  Typography,
  Pagination,
} from "@mui/material";
import CustomDataGrid from "./CustomDataGrid";
import FiltersMenu from "./Spreedsheet/Filters/FiltersMenu"; // riusa il tuo componente esistente
import CustomAvatarGroup from "../Avatar/CustomAvatarGroup";

export default function DataGridWithFilters({ tasks, employees }) {
  const [textFilter, setTextFilter] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState([]);
  const [statusFilter, setStatusFilter] = useState([]);
  const [createdFrom, setCreatedFrom] = useState("");
  const [completedTo, setCompletedTo] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const statusOptions = ["In corso", "Urgente", "Completato"];

  // Filtraggio dei task
  const filteredTasks = useMemo(() => {
    return (tasks || []).filter((task) => {
      const matchesText =
        !textFilter ||
        task.title.toLowerCase().includes(textFilter.toLowerCase());

      const matchesEmployee =
        employeeFilter.length === 0 ||
        employeeFilter.some((empId) => task.assigned.includes(empId));

      const matchesStatus =
        statusFilter.length === 0 || statusFilter.includes(task.tag);

      const matchesCreated =
        !createdFrom ||
        (task.createdAt && new Date(task.createdAt) >= new Date(createdFrom));

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
  }, [
    tasks,
    textFilter,
    employeeFilter,
    statusFilter,
    createdFrom,
    completedTo,
  ]);

  const pageCount = Math.ceil(filteredTasks.length / rowsPerPage);
  const displayedTasks = filteredTasks.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

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
    <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <CardContent
        sx={{
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

      {/* DataGrid */}
      <Box sx={{ flex: 1, overflow: "auto" }}>
        <CustomDataGrid tasks={displayedTasks} />
      </Box>

    </Card>
  );
}
