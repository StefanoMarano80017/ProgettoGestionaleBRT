import * as React from "react";
import { DateCalendar } from "@mui/x-date-pickers";
import { Box } from "@mui/material";

export default function CalendarBase({
  selectedDate,
  setSelectedDate,
  currentMonth,
  setCurrentMonth,
  renderDay,
  width = "100%",
}) {
  // Componente custom Day wrapper che delega lo stile a renderDay
  const CustomDay = (props) => {
    const { day, outsideCurrentMonth, ...other } = props;
    return renderDay(day, outsideCurrentMonth, other, selectedDate);
  };

  return (
    <Box sx={{ width }}>
      <DateCalendar
        value={selectedDate}
        onChange={(newDate) => {
          if (newDate) setSelectedDate(newDate);
        }}
        onMonthChange={(newMonth) => setCurrentMonth(newMonth.getMonth())}
        slots={{ day: CustomDay }}
      />
    </Box>
  );
}
