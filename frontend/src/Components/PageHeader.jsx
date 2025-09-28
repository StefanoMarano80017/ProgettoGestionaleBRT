import React from "react";
import { Box, Typography, Stack } from "@mui/material";

const PageHeader = ({ title, description, icon, extraContent }) => {
  return (
    <Box sx={{ mb: 4 }}>
      {/* Title + Icon */}
      <Stack direction="row" alignItems="center" spacing={1}>
        {icon && <Box sx={{ fontSize: 32, color: "primary.main" }}>{icon}</Box>}
        <Typography variant="h4" component="h1" fontWeight={600}>
          {title}
        </Typography>
      </Stack>

      {/* Description */}
      {description && (
        <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
          {description}
        </Typography>
      )}

      {/* Extra Section */}
      {extraContent && <Box sx={{ mt: 2 }}>{extraContent}</Box>}
    </Box>
  );
};

export default PageHeader;
