import * as React from "react";
import { Paper } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { PickersDay } from "@mui/x-date-pickers/PickersDay";
import { isSameDay, getYear, getMonth, getDay } from "date-fns";
import CalendarBase from "./CalendarBase";
import itLocale from "date-fns/locale/it";

export default function CalendarDipendenti({ selectedDate, setSelectedDate, currentMonth, setCurrentMonth, daysInfo }) {
  const renderDay = (day, outsideCurrentMonth, otherProps) => {
    const dayKey = day.toISOString().split("T")[0];
    const dayData = daysInfo?.[dayKey];

    let textColor = "inherit";
    if (dayData?.type === "worked") textColor = "customGreen.main";
    else if (dayData?.type === "vacation") textColor = "customYellow.main";
    else if (dayData?.type === "not_worked") textColor = "customRed.main";

    const isDisabled = getDay(day) === 0 || getDay(day) === 6; // domenica o sabato

    return (
      <PickersDay
        {...otherProps}
        day={day}
        outsideCurrentMonth={outsideCurrentMonth}
        sx={{ color: textColor, width: 36, height: 36, fontSize: "1rem" }}
        selected={isSameDay(day, selectedDate)}
        disabled={isDisabled} // disabilita il giorno se è sabato o domenica
      />
    );
  };

  // funzione opzionale per il CalendarPicker, disabilita sabato e domenica
  const shouldDisableDate = (date) => getDay(date) === 0 || getDay(date) === 6;

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={itLocale}>
        <CalendarBase
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          currentMonth={currentMonth}
          setCurrentMonth={setCurrentMonth}
          renderDay={renderDay}
          shouldDisableDate={shouldDisableDate} // disabilita i giorni non lavorativi
        />
    </LocalizationProvider>
  );
}
