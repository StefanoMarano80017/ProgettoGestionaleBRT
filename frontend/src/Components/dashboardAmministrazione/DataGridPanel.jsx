import React from "react";
import { DataGrid } from "@mui/x-data-grid";
import { Box } from "@mui/material";

export default function DataGridPanel({ data }) {
  const columns = data.length
    ? Object.keys(data[0]).map((key) => ({ field: key, headerName: key, flex: 1 }))
    : [];

  return (
    <Box  height="100%" width="100%">
      <DataGrid
        rows={data}
        columns={columns}
        pageSize={10}
        rowsPerPageOptions={[10]}
      />
    </Box>
  );
}