import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Table,
  Typography,
  Pagination,
  Select,
  MenuItem,
  Stack,
  Divider,
  Button
} from "@mui/material";

import Spreadsheet from "./Spreadsheet";
import FiltersMenu from "./Filters/FiltersMenu";
import NoteAddIcon from '@mui/icons-material/NoteAdd';

const SpreadsheetWithFiltersAndPagination = ({ projects, employees }) => {
  const [textFilter, setTextFilter] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState([]);
  const [statusFilter, setStatusFilter] = useState([]);
  const [deadlineFilter, setDeadlineFilter] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const statusOptions = ["In corso", "Urgente", "Completato"];

  const filteredProjects = projects.map((project) => {
      const filteredTasks = project.tasks.filter((task) => {
        const matchesText =
          !textFilter ||
          task.title.toLowerCase().includes(textFilter.toLowerCase()) ||
          project.title.toLowerCase().includes(textFilter.toLowerCase());
        const matchesEmployee =
          employeeFilter.length === 0 ||
          employeeFilter.some((empId) => task.assigned.includes(empId));
        const matchesStatus =
          statusFilter.length === 0 || statusFilter.includes(task.tag);
        const matchesDeadline =
          !deadlineFilter ||
          new Date(task.deadline) <= new Date(deadlineFilter);
        return (
          matchesText && matchesEmployee && matchesStatus && matchesDeadline
        );
      });
      return { ...project, tasks: filteredTasks };
  }).filter((project) => project.tasks.length > 0);

  const pageCount = Math.ceil(filteredProjects.length / rowsPerPage);
  const displayedProjects = filteredProjects.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  return (
    <Card sx={{ height: 600, display: "flex", flexDirection: "column" }}>
      {/* Barra filtri */}
      <CardContent 
        sx={{ 
              borderBottom: "1px solid #ccc",  
              display: "flex", 
              flexDirection: "row",
              gap:2, 
              justifyContent: "space-between",
            }}>
        <Button variant="outlined" startIcon={<NoteAddIcon />}>
          Nuovo Progetto
        </Button>
        <Stack direction="row" spacing={2}>
          <FiltersMenu
            textFilter={textFilter}
            setTextFilter={setTextFilter}
            employees={employees}
            employeeFilter={employeeFilter}
            setEmployeeFilter={setEmployeeFilter}
            statusOptions={statusOptions}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            deadlineFilter={deadlineFilter}
            setDeadlineFilter={setDeadlineFilter}
          />
        </Stack>
      </CardContent>

      {/* Tabella scrollabile */}
      <Box sx={{ flex: 1, overflow: "auto" }}>
        <Table stickyHeader>
          <Spreadsheet projects={displayedProjects} employees={employees} />
        </Table>
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
