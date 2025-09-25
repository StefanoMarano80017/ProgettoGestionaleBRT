import React, { useState } from "react";
import {
  Box,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
} from "@mui/material";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";

const TopBar = ({ onTabChange }) => {
  const [selectedTab, setSelectedTab] = useState("tab1");

  const handleTabChange = (event, newTab) => {
    if (newTab !== null) {
      setSelectedTab(newTab);
      if (onTabChange) {
        onTabChange(newTab); // Notifica il layout padre
      }
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        py: 1,
        width: "100%",
      }}
    >
      <Box sx={{ flexGrow: 1 }}>
        <Typography variant="body2">Dashboard Commesse</Typography>
      </Box>

      {/* Toggle a destra */}
      <ToggleButtonGroup
        value={selectedTab}
        exclusive
        onChange={handleTabChange}
        size="small"
      >
        <ToggleButton value="tab1">
          <CalendarMonthIcon /> Timesheet
        </ToggleButton>
        <ToggleButton value="tab2">
          <FormatListBulletedIcon /> Incarichi
        </ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
};

export default TopBar;
