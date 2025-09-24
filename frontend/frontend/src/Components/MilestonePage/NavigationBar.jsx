import * as React from "react";
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab
} from "@mui/material";

import TableChartIcon from '@mui/icons-material/TableChart';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

export default function NavigationBar({ 
  categories, 
  selectedCategory, 
  setSelectedCategory,
  tabIndex,
  setTabIndex
}) {
  const handleTabChange = (event, newIndex) => {
    setTabIndex(newIndex);
  };

  return (
    <Box 
      display="flex" 
      alignItems="center" 
      justifyContent="space-between" 
      p={1} 
      borderBottom={1} 
      borderColor="divider"
      bgcolor="background.paper"
    >
      {/* Sinistra: selezione categoria */}
      <FormControl size="small" sx={{ minWidth: 150 }}>
        <InputLabel id="category-select-label">Categoria</InputLabel>
        <Select
          labelId="category-select-label"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          label="Categoria"
        >
          {categories.map((cat) => (
            <MenuItem key={cat} value={cat}>{cat}</MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Destra: Tab per Tipo A / Tipo B */}
      <Tabs
        value={tabIndex}
        onChange={handleTabChange}
        textColor="primary"
        indicatorColor="primary"
      >
        <Tab icon={<TableChartIcon/>}    label="Spreadsheet"  iconPosition="start"/>
        <Tab icon={<CalendarMonthIcon/>} label="Calendar"  iconPosition="start" />
      </Tabs>

    </Box>
  );
}