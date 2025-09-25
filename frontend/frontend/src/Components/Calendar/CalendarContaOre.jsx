import * as React from "react";
import { PickersDay } from "@mui/x-date-pickers";
import { isSameDay, getYear, getMonth } from "date-fns";
import CalendarWithSidePanel from "./CalendarWithSidePanel";
import CardSetOreGiorno from "./SetOreGiorno";
import { TextField, Box, Stack, Chip } from "@mui/material";

export default function CalendarContaOre({
  selectedDate,
  setSelectedDate,
  currentMonth,
  setCurrentMonth,
  daysInfo,
}) {
  // render custom dei giorni
  const renderDay = (day, outsideCurrentMonth, other, selectedDate) => {
    const dayKey = day.toISOString().split("T")[0];
    const dayData = daysInfo?.[dayKey];

    let textColor = "inherit";
    if (dayData?.type === "worked") textColor = "green";
    else if (dayData?.type === "vacation") textColor = "orange";
    else if (dayData?.type === "not_worked") textColor = "red";

    return (
      <PickersDay
        {...other}
        day={day}
        outsideCurrentMonth={outsideCurrentMonth}
        sx={{
          color: textColor,
          width: 36,
          height: 36,
          fontSize: "1rem",
        }}
        selected={isSameDay(day, selectedDate)}
      />
    );
  };

  // side panel = gestione ore giorno
  const sidePanel = <CardSetOreGiorno selectedDate={selectedDate} />;

  // Calcolo dinamico ore/giorni per il mese corrente
  const year = selectedDate ? getYear(selectedDate) : new Date().getFullYear();
  const month = currentMonth;

  const monthDays = Object.entries(daysInfo || {}).filter(([date]) => {
    const d = new Date(date);
    return getYear(d) === year && getMonth(d) === month;
  });

  const totals = monthDays.reduce(
    (acc, [, data]) => {
      if (data.type === "worked") {
        acc.workedDays++;
        acc.workedHours += data.hours || 0;
      } else if (data.type === "vacation") {
        acc.vacationDays++;
        acc.vacationHours += data.hours || 0;
      } else if (data.type === "not_worked") {
        acc.notWorkedDays++;
        acc.notWorkedHours += data.hours || 0;
      }
      return acc;
    },
    {
      workedDays: 0,
      workedHours: 0,
      vacationDays: 0,
      vacationHours: 0,
      notWorkedDays: 0,
      notWorkedHours: 0,
    }
  );

  const totalMonthHours =
    totals.workedHours + totals.vacationHours + totals.notWorkedHours;

  // Footer extra: riepilogo ore + chip
  const footerExtra = (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
        overflowX: "auto", // consente lo scroll orizzontale se necessario
      }}
    >
      <Stack direction="row" spacing={1} flexWrap="nowrap">
        <Chip
          label={`Lavorativi: ${totals.workedDays} gg / ${totals.workedHours}h`}
          color="success"
          sx={{ flexBasis: "25%", textAlign: "center" }}
        />
        <Chip
          label={`Ferie: ${totals.vacationDays} gg / ${totals.vacationHours}h`}
          color="info"
          sx={{ flexBasis: "25%", textAlign: "center" }}
        />
        <Chip
          label={`Non lavorati: ${totals.notWorkedDays} gg`}
          color="warning"
          sx={{ flexBasis: "25%", textAlign: "center" }}
        />
        <Chip
          label={`Totale: ${totalMonthHours} h`}
          color="primary"
          variant="outlined"
          sx={{ flexBasis: "25%", textAlign: "center" }}
        />
      </Stack>
    </Box>
  );

  return (
    <CalendarWithSidePanel
      selectedDate={selectedDate}
      setSelectedDate={setSelectedDate}
      currentMonth={currentMonth}
      setCurrentMonth={setCurrentMonth}
      renderDay={renderDay}
      sidePanel={sidePanel}
      footerExtra={footerExtra}
    />
  );
}
