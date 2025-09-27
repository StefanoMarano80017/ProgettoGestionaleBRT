import React, { useState } from "react";
import { IconButton, Menu, Box, Divider, Typography } from "@mui/material";
import FilterAltIcon from "@mui/icons-material/FilterAlt";

export default function FiltersMenu({ filters = [], activeFilters = [] }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const renderFilter = (filter) => {
    if (!filter.render) return null;
    return (
      <Box key={filter.label} sx={{ mb: 1 }}>
        {filter.render()}
      </Box>
    );
  };

  return (
    <>
      <IconButton aria-label="Filters" onClick={(e) => setAnchorEl(e.currentTarget)}>
        <FilterAltIcon />
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        PaperProps={{ sx: { width: 320, maxHeight: 500, p: 2 } }}
      >
        {filters
          .filter((f) => activeFilters.includes(f.label))
          .map((f, idx) => (
            <Box key={idx}>
              {renderFilter(f)}
              {idx < filters.length - 1 && <Divider sx={{ my: 1 }} />}
            </Box>
          ))}
      </Menu>
    </>
  );
}
