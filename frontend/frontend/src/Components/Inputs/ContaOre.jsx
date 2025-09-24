import * as React from "react";
import { Grid } from "@mui/material";

import CalendarioCard from "./CalendarioCard";
import CardSetOreGiorno from "./CardSetOreGiorno";

export default function ContaOre() {
  const [selectedDate, setSelectedDate] = React.useState(new Date());
  const [currentMonth, setCurrentMonth] = React.useState(new Date().getMonth());

  const hoursPerMonth = {
    0: 168, 1: 160, 2: 176, 3: 168,
    4: 184, 5: 176, 6: 184, 7: 176,
    8: 168, 9: 184, 10: 176, 11: 168,
  };

  const daysInfo = {
    "2025-09-01": "worked",
    "2025-09-05": "vacation",
    "2025-09-07": "not_worked",
  };

  return (
      <Grid container spacing={2} sx={{justifyContent: "space-around"}}>
        <Grid item xs={12} sm={6} >
          <CalendarioCard
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            currentMonth={currentMonth}
            setCurrentMonth={setCurrentMonth}
            hoursPerMonth={hoursPerMonth}
            daysInfo = {daysInfo}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <CardSetOreGiorno selectedDate={selectedDate} />
        </Grid>
      </Grid>
  );
}
