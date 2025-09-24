import React, { useState } from "react";
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Collapse,
  Box,
  IconButton,
  Avatar,
  Chip,
  LinearProgress,
  Typography,
} from "@mui/material";
import CustomAvatarGroup from "../Avatar/CustomAvatarGroup";
import { useTheme } from "@mui/material/styles";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import SwapVertIcon from "@mui/icons-material/SwapVert";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

// TaskRow aggiornata
const TaskRow = ({ task, employees, isTask }) => {
  const progressPercent = Math.round((task.progress / task.total) * 100);
  const handleNavigate = () => console.log("Vai a task:", task.id);
  const assignedEmployees = task.assigned
    .map((id) => employees.find((e) => e.id === id))
    .filter(Boolean);

  return (
    <TableRow hover>
      <TableCell sx={{ pl: isTask ? 5 : 2 }}>{task.title}</TableCell>
      <TableCell>{task.description}</TableCell>
      <TableCell>
        <CustomAvatarGroup data={assignedEmployees} max={4} />
      </TableCell>
      <TableCell>
        {new Date(task.createdAt).toLocaleDateString()} →{" "}
        {new Date(task.deadline).toLocaleDateString()}
      </TableCell>
      <TableCell>
        <Chip label={task.tag} size="small" />
      </TableCell>
      <TableCell>
        <LinearProgress variant="determinate" value={progressPercent} />
        <Typography variant="caption" display="block" align="right">
          {progressPercent}%
        </Typography>
      </TableCell>
      <TableCell>
        <IconButton size="small" onClick={handleNavigate}>
          <OpenInNewIcon />
        </IconButton>
      </TableCell>
    </TableRow>
  );
};

// ProjectRow aggiornata
const ProjectRow = ({ project, employees, isOpen, onToggle }) => {
  const totalProgress = Math.round(
    (project.tasks.reduce((sum, t) => sum + t.progress, 0) /
      project.tasks.reduce((sum, t) => sum + t.total, 0)) *
      100
  );
  const handleNavigate = () => console.log("Vai a progetto:", project.id);
  const assignedEmployees = Array.from(
    new Set(project.tasks.flatMap((t) => t.assigned))
  )
    .map((id) => employees.find((e) => e.id === id))
    .filter(Boolean);

  return (
    <>
      <TableRow hover>
        <TableCell>
          <Box display="flex" alignItems="center">
            <IconButton size="small" onClick={onToggle}>
              {isOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
            <Typography>{project.title}</Typography>
          </Box>
        </TableCell>
        <TableCell style={{ opacity: isOpen ? 0 : 1 }}>
          {project.description}
        </TableCell>
        <TableCell style={{ opacity: isOpen ? 0 : 1 }}>
          <CustomAvatarGroup data={assignedEmployees} max={3} />
        </TableCell>
        <TableCell style={{ opacity: isOpen ? 0 : 1 }}>
          {new Date(Math.min(...project.tasks.map((t) => t.createdAt))).toLocaleDateString()}{" "}
          →{" "}
          {new Date(Math.max(...project.tasks.map((t) => t.deadline))).toLocaleDateString()}
        </TableCell>
        <TableCell style={{ opacity: isOpen ? 0 : 1 }}>
          <Chip label="Progetto" size="small" />
        </TableCell>
        <TableCell style={{ opacity: isOpen ? 0 : 1 }}>
          <LinearProgress variant="determinate" value={totalProgress} />
          <Typography variant="caption" display="block" align="right">
            {totalProgress}%
          </Typography>
        </TableCell>
        <TableCell>
          <IconButton size="small" onClick={handleNavigate}>
            <OpenInNewIcon />
          </IconButton>
        </TableCell>
      </TableRow>

      {/* Task rows */}
      {isOpen &&
        project.tasks.map((task) => (
          <TaskRow key={task.id} task={task} employees={employees} isTask />
        ))}
    </>
  );
};

// Header ordinabile
const TableHeader = ({ sortConfig, requestSort }) => {
  const theme = useTheme();
  const renderSortIcon = (field) => {
    if (sortConfig.field === field) {
      return sortConfig.direction === "asc" ? (
        <ArrowUpwardIcon fontSize="small" />
      ) : (
        <ArrowDownwardIcon fontSize="small" />
      );
    }
    return <SwapVertIcon fontSize="small" />;
  };

  const SortableHeaderCell = ({ label, field }) => (
    <TableCell
      sx={{
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.primary.contrastText,
        cursor: "pointer",
        userSelect: "none",
      }}
    >
      <Box display="flex" alignItems="center" onClick={() => requestSort(field)}>
        <Typography variant="subtitle2" sx={{ mr: 0.5 }}>
          {label}
        </Typography>
        <IconButton size="small" sx={{ color: theme.palette.primary.contrastText }}>
          {renderSortIcon(field)}
        </IconButton>
      </Box>
    </TableCell>
  );

  return (
    <TableHead>
      <TableRow>
        <TableCell sx={{ backgroundColor: theme.palette.primary.main, color: theme.palette.primary.contrastText }}>
          Titolo
        </TableCell>
        <TableCell sx={{ backgroundColor: theme.palette.primary.main, color: theme.palette.primary.contrastText }}>
          Descrizione
        </TableCell>
        <TableCell sx={{ backgroundColor: theme.palette.primary.main, color: theme.palette.primary.contrastText }}>
          Assegnati
        </TableCell>
        <SortableHeaderCell label="Date" field="deadline" />
        <SortableHeaderCell label="Tag" field="tag" />
        <SortableHeaderCell label="Progresso" field="progress" />
        <TableCell sx={{ backgroundColor: theme.palette.primary.main, color: theme.palette.primary.contrastText }}>
          Azioni
        </TableCell>
      </TableRow>
    </TableHead>
  );
};

// Tabella principale
const ProjectTable = ({ projects, employees }) => {
  const [openProjects, setOpenProjects] = useState({});
  const [sortConfig, setSortConfig] = useState({ field: null, direction: "asc" });

  const toggleProject = (id) => setOpenProjects((prev) => ({ ...prev, [id]: !prev[id] }));
  const requestSort = (field) => {
    let direction = "asc";
    if (sortConfig.field === field && sortConfig.direction === "asc") direction = "desc";
    setSortConfig({ field, direction });
  };

  const sortedProjects = [...projects].sort((a, b) => {
    if (!sortConfig.field) return 0;
    if (sortConfig.field === "deadline") {
      const aDate = Math.max(...a.tasks.map((t) => t.deadline));
      const bDate = Math.max(...b.tasks.map((t) => t.deadline));
      return sortConfig.direction === "asc" ? aDate - bDate : bDate - aDate;
    } else if (sortConfig.field === "tag") {
      const aTag = a.tasks[0]?.tag || "";
      const bTag = b.tasks[0]?.tag || "";
      return sortConfig.direction === "asc" ? aTag.localeCompare(bTag) : bTag.localeCompare(aTag);
    } else if (sortConfig.field === "progress") {
      const aProg = (a.tasks.reduce((sum, t) => sum + t.progress, 0) /
        a.tasks.reduce((sum, t) => sum + t.total, 0)) * 100;
      const bProg = (b.tasks.reduce((sum, t) => sum + t.progress, 0) /
        b.tasks.reduce((sum, t) => sum + t.total, 0)) * 100;
      return sortConfig.direction === "asc" ? aProg - bProg : bProg - aProg;
    }
    return 0;
  });

  return (
    <Table>
      <TableHeader sortConfig={sortConfig} requestSort={requestSort} />
      <TableBody>
        {sortedProjects.map((project) => (
          <ProjectRow
            key={project.id}
            project={project}
            employees={employees}
            isOpen={!!openProjects[project.id]}
            onToggle={() => toggleProject(project.id)}
          />
        ))}
      </TableBody>
    </Table>
  );
};

export default ProjectTable;
