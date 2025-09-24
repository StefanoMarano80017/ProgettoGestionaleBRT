import * as React from "react";
import { Card, CardContent, Box, Grid } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import CalendarBase from "./CalendarBase";

export default function CalendarWithSidePanel({
  selectedDate,
  setSelectedDate,
  currentMonth,
  setCurrentMonth,
  renderDay,
  sidePanel,
  footerExtra,
}) {
  return (
    <Card sx={{ width: "100%", height: "100%", display: "flex" }}>
      {/* Colonna Calendario */}
      <CardContent
        sx={{
          borderRight: 1,
          borderColor: "divider",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          p: 1,
          width: "100%",
        }}
      >
        <Grid container spacing={2}>
          <Grid item xs={6} sx={{ borderRight: 1, borderColor: "divider" }} p={2}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <Box flexGrow={1} minHeight={0} overflow="auto">  
                <CalendarBase
                  selectedDate={selectedDate}
                  setSelectedDate={setSelectedDate}
                  currentMonth={currentMonth}
                  setCurrentMonth={setCurrentMonth}
                  renderDay={renderDay}
                />
              </Box>
              {/* Footer extra fisso */}
              {footerExtra && <Box sx={{ mt: 1 }}>{footerExtra}</Box>}
            </LocalizationProvider>
          </Grid>
          <Grid item xs={6}>
            {/* Colonna pannello custom */}
            {sidePanel}
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
