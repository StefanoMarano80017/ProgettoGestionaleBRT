import * as React from "react";
import { Card, CardContent, Box, Grid } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import CalendarBase from "./CalendarBase";
import itLocale from "date-fns/locale/it";

export default function CalendarWithSidePanel({
  selectedDate,
  setSelectedDate,
  currentMonth,
  setCurrentMonth,
  renderDay,
  sidePanel,
  footerExtra,
  calendarFlex = 1,       // rapporto di spazio calendario (default 1)
  sidePanelFlex = 1,      // rapporto di spazio sidepanel (default 1)
  calendarWidth = "100%", // larghezza interna del CalendarBase
}) {
  return (
    <Card sx={{ width: "100%", height: "100%", display: "flex" }}>
      <CardContent
        sx={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          p: 1,
          width: "100%",
        }}
      >
        <Grid container spacing={2} sx={{ height: "100%" }}>
          {/* Colonna Calendario */}
          <Grid
            item
            sx={{
              flex: calendarFlex,
              display: "flex",
              flexDirection: "column",
              borderRight: 1,
              borderColor: "divider",
              p: 2,
              minHeight: 0,
            }}
          >
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={itLocale}>
              <Box
                flexGrow={1}
                minHeight={0}
                overflow="auto"
              >
                <CalendarBase
                  selectedDate={selectedDate}
                  setSelectedDate={setSelectedDate}
                  currentMonth={currentMonth}
                  setCurrentMonth={setCurrentMonth}
                  renderDay={renderDay}
                  width = {calendarWidth}
                />
                 {footerExtra && <Box sx={{ mt: 1 }}>{footerExtra}</Box>}
              </Box>
            </LocalizationProvider>
          </Grid>

          {/* Colonna SidePanel */}
          <Grid
            item
            sx={{
              flex: sidePanelFlex,
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
            }}
          >
            {sidePanel}
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
