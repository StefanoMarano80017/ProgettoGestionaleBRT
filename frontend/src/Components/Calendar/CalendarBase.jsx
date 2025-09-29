import * as React from "react";
import { DateCalendar } from "@mui/x-date-pickers";
import { Box } from "@mui/material";

export default function CalendarBase({
  selectedDate,
  setSelectedDate,
  currentMonth,
  setCurrentMonth,
  renderDay,
}) {
  // Componente custom Day wrapper che delega lo stile a renderDay
  const CustomDay = (props) => {
    const { day, outsideCurrentMonth, ...other } = props;
    return renderDay(day, outsideCurrentMonth, other, selectedDate);
  };

  return (
      <DateCalendar sx={{
        width: 1000,            // change overall width
        // Header (month + year)
        "& .MuiPickersCalendarHeader-label": {
          fontSize: "2rem",   // font size for month/year
          minHeight: "60px",  // header height
        },
        // Weekday labels (Mon, Tue, ...)
        "& .MuiDayCalendar-weekDayLabel": {
          fontSize: "1rem",       // weekday font size
          marginBottom: "0.5rem", // spacing under weekday
        },

        // Day buttons (numbers)
        "& .MuiDayCalendar-day": {
          width: "3rem",       // day square width
          height: "3rem",      // day square height
          margin: "0.2rem",    // spacing between days
          fontSize: "1.2rem",  // day number font size
        },

        // Optional: spacing for the day grid
        "& .MuiDayCalendar-week": {
          gap: "0.5rem", // spacing between each week row
        },
      }}
        value={selectedDate}
        onChange={(newDate) => {
          if (newDate) setSelectedDate(newDate);
        }}
        onMonthChange={(newMonth) => setCurrentMonth(newMonth.getMonth())}
        slots={{ day: CustomDay }}
      />
  );
}
