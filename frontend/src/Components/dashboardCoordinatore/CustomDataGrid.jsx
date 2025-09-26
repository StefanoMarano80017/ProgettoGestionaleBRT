import React from "react";
import { Box, Chip, IconButton } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import CustomAvatarGroup from "../Avatar/CustomAvatarGroup";
import CustomProgressBar from "../ProgressBar/CustomProgressBar";

export default function ProjectTasksDataGrid({ tasks, employees }) {
  const columns = [
    { field: "id", headerName: "id"},
    { field: "title", headerName: "Titolo"},
    { field: "description", headerName: "Descrizione"},
    {
      field: "assignedEmployees",
      headerName: "Assegnati",
      flex: 1,
      renderCell: (params) => <CustomAvatarGroup data={params.value} max={4} />,
    },
    {
      field: "completed",
      headerName: "Data Scadenza",
      width: 150,
      renderCell: (params) =>
        params.value ? new Date(params.value).toLocaleDateString() : "",
    },
    {
      field: "tag",
      headerName: "Stato",
      width: 120,
      renderCell: (params) => {
        const color =
          params.value === "Completato"
            ? "success"
            : params.value === "Urgente"
            ? "error"
            : "warning";
        return <Chip label={params.value} color={color} size="small" />;
      },
    },
    {
      field: "progress",
      headerName: "Progresso",
      width: 150,
      renderCell: (params) => <CustomProgressBar value={params.value} />,
    },
    {
      field: "actions",
      headerName: "Azioni",
      width: 80,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <IconButton
          size="small"
          onClick={() => alert(`Azione sul task: ${params.row.title}`)}
        >
          <MoreVertIcon />
        </IconButton>
      ),
    },
  ];

  return (
    <Box sx={{ flex: 1, minHeight: 0 }}>
      <DataGrid
        rows={tasks}
        columns={columns}
        pageSize={5}
        rowsPerPageOptions={[5]}
        sx={{
          height: "100%",
          "& .MuiDataGrid-virtualScroller": { overflow: "auto" },
          "& .MuiDataGrid-main": { minHeight: 0 },
          "& .MuiDataGrid-columnHeaders": { flex: "0 0 auto" },
        }}
        autoHeight={false}
        disableSelectionOnClick
      />
    </Box>
  );
}
