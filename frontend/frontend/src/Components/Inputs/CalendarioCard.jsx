import * as React from "react";
import { Card, CardContent, Typography, TextField } from "@mui/material";
import { DateCalendar, PickersDay } from "@mui/x-date-pickers";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { isSameDay } from "date-fns";

export default function CalendarioCard({
  selectedDate,
  setSelectedDate,
  currentMonth,
  setCurrentMonth,
  hoursPerMonth,
  daysInfo, 
  // daysInfo oggetto del tipo: { "2025-09-01": "worked", "2025-09-05": "vacation", ... }
}) {
  const monthHours = hoursPerMonth ? hoursPerMonth[currentMonth] : 0;

  // Custom Day component
  const CustomDay = (props) => {
    const { day, outsideCurrentMonth, ...other } = props;

    // Normalizzo la data in stringa YYYY-MM-DD
    const dayKey = day.toISOString().split("T")[0];
    const dayType = daysInfo?.[dayKey];

    let bgColor = "transparent";
    let textColor = "inherit";

    if (dayType === "worked") {
      bgColor = "#d0f0c0"; // verde chiaro
    } else if (dayType === "vacation") {
      bgColor = "#ffe0b2"; // arancio chiaro
    } else if (dayType === "not_worked") {
      bgColor = "#ffcdd2"; // rosso chiaro
    }

    return (
      <PickersDay
        {...other}
        day={day}
        outsideCurrentMonth={outsideCurrentMonth}
        sx={{
          bgcolor: bgColor,
          color: textColor,
          borderRadius: "50%",
          "&:hover": {
            bgcolor: "#90caf9", // colore hover
          },
        }}
        selected={isSameDay(day, selectedDate)}
      />
    );
  };

  return (
    <Card sx={{ width: "100%", height: "100%" }}>
      <CardContent>
        <Typography variant="subtitle1" align="center" gutterBottom>
          Calendario
        </Typography>

        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DateCalendar
            value={selectedDate}
            onChange={(newDate) => {
              if (newDate) setSelectedDate(newDate);
            }}
            onMonthChange={(newMonth) => setCurrentMonth(newMonth.getMonth())}
            slots={{ day: CustomDay }}
          />
        </LocalizationProvider>

        <TextField
          label="Ore mese"
          value={monthHours}
          InputProps={{ readOnly: true }}
          size="small"
          fullWidth
          sx={{ mt: 1 }}
        />
      </CardContent>
    </Card>
  );
}
