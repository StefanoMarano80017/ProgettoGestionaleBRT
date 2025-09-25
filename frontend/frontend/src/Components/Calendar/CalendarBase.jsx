import * as React from "react";
import { DateCalendar, PickersDay } from "@mui/x-date-pickers";
import { isSameDay } from "date-fns";

export default function CalendarBase({
  selectedDate,
  setSelectedDate,
  currentMonth,
  setCurrentMonth,
  renderDay, // funzione custom per renderizzare i giorni
}) {
  // Componente custom Day wrapper che delega lo stile a renderDay
  const CustomDay = (props) => {
    const { day, outsideCurrentMonth, ...other } = props;
    return renderDay(day, outsideCurrentMonth, other, selectedDate);
  };

  return (
    <DateCalendar
      value={selectedDate}
      onChange={(newDate) => {
        if (newDate) setSelectedDate(newDate);
      }}
      onMonthChange={(newMonth) => setCurrentMonth(newMonth.getMonth())}
      slots={{ day: CustomDay }}
    />
  );
}
