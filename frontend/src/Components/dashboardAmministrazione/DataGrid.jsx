import * as React from "react";
import Box from "@mui/material/Box";
import { DataGrid } from "@mui/x-data-grid";



export default function DataGridDemo() {
  return (
    <Box sx={{ height: 400, width: "100%" }}>
      
      <DataGrid
        rows={rows}
        columns={columns}
        pageSize={5}
        rowsPerPageOptions={[5]}
        showToolbar
        slotProps={{
          toolbar: {
            showQuickFilter: true,
            showColumnsButton: true,
            showFiltersButton: true,
            showDensitySelector: true,
          },
        }}
      />
    </Box>
  );
}
