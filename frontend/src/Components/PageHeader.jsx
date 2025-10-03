import React from "react";
import { Box, Typography, Stack } from "@mui/material";
import { useLocation } from "react-router-dom";

// Uniform icon rendering like the top Header: accepts either a JSX element or an Icon component
const renderIcon = (IconOrElement, sx) => {
  if (!IconOrElement) return null;
  if (React.isValidElement(IconOrElement)) {
    return React.cloneElement(IconOrElement, {
      sx: { ...(IconOrElement.props?.sx || {}), ...sx },
    });
  }
  const IconComp = IconOrElement;
  return IconComp ? <IconComp sx={sx} /> : null;
};

const PageHeader = ({ title, description, icon, extraContent }) => {
  // defer color decisions to the theme

  return (
    <Box sx={{ mb: 3 }}>
      {/* Title + Icon */}
      <Stack direction="row" alignItems="center" spacing={1}>
        {icon && renderIcon(icon, { fontSize: "large", color: "primary.main" })}
        <Typography
          variant="h5"
          component="h1"
          sx={{ fontWeight: 700, color: "text.primary" }}
        >
          {title}
        </Typography>
      </Stack>

      {/* Description */}
      {description && (
        <Typography variant="body2" sx={{ mt: 0.5 }}>
          {description}
        </Typography>
      )}

      {/* Extra Section */}
      {extraContent && <Box sx={{ mt: 2 }}>{extraContent}</Box>}
    </Box>
  );
};

export default PageHeader;
