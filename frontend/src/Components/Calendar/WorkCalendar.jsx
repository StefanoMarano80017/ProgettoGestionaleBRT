import React, { useState } from "react";
import { Box, Typography, IconButton, Tooltip } from "@mui/material";
import { ArrowBackIos, ArrowForwardIos, WarningAmber, BeachAccess } from "@mui/icons-material";

const WorkCalendar = ({ data = {}, selectedDay, onDaySelect }) => {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const firstDay = new Date(currentYear, currentMonth, 1);
  const lastDay = new Date(currentYear, currentMonth + 1, 0);

  const days = [];
  const startDayOfWeek = (firstDay.getDay() + 6) % 7; // lunedì=0
  for (let i = 0; i < startDayOfWeek; i++) days.push(null);

  for (let d = 1; d <= lastDay.getDate(); d++) {
    const dateStr = `${currentYear}-${(currentMonth + 1)
      .toString()
      .padStart(2, "0")}-${d.toString().padStart(2, "0")}`;
    const dayOfWeek = new Date(currentYear, currentMonth, d).getDay();
    const dayData = data[dateStr];
    const segnalazione = data[dateStr + "_segnalazione"];
    days.push({ day: d, dateStr, dayData, dayOfWeek, segnalazione });
  }

  const weekDays = ["Lu", "Ma", "Me", "Gi", "Ve", "Sa", "Do"];
  const monthNames = [
    "Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno",
    "Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"
  ];

  const getDayInfo = (dayData, dayOfWeek, segnalazione, dateStr) => {
    const totalHours = dayData?.reduce((sum, rec) => sum + rec.ore, 0) || 0;
    const isWeekend = dayOfWeek >= 5;
    const isFuture = new Date(dateStr) > today;

    if (!dayData || dayData.length === 0) return { bgcolor: "transparent", icon: null, showHours: false };

    if (dayData.some((rec) => rec.commessa === "FERIE")) return { bgcolor: "success.main", icon: <BeachAccess />, showHours: false };
    if (segnalazione) return { bgcolor: "error.main", icon: <WarningAmber />, showHours: false };
    if (isFuture) return { bgcolor: "transparent", icon: null, showHours: false };
    if (totalHours === 8) return { bgcolor: "success.main", icon: null, showHours: true };
    if (totalHours > 0 || (!isWeekend && totalHours < 8)) return { bgcolor: "warning.main", icon: null, showHours: true };
    return { bgcolor: isWeekend ? "grey.400" : "transparent", icon: null, showHours: false };
  };

  return (
    <Box>
      {/* Header mese */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
        <IconButton onClick={handlePrevMonth}><ArrowBackIos /></IconButton>
        <Typography variant="h6">{monthNames[currentMonth]} {currentYear}</Typography>
        <IconButton onClick={handleNextMonth}><ArrowForwardIos /></IconButton>
      </Box>

      {/* Nomi giorni */}
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", mb: 1 }}>
        {weekDays.map((wd) => <Box key={wd} sx={{ textAlign: "center" }}><Typography variant="caption">{wd}</Typography></Box>)}
      </Box>

      {/* Griglia giorni */}
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 1 }}>
        {days.map((item, index) => {
          if (!item) return <Box key={`empty-${index}`} />;
          const { day, dateStr, dayData, dayOfWeek, segnalazione } = item;
          const isSelected = selectedDay === dateStr;
          const { bgcolor, icon, showHours } = getDayInfo(dayData, dayOfWeek, segnalazione, dateStr);

          const totalHours = dayData?.reduce((sum, rec) => sum + rec.ore, 0) || 0;

          const dayContent = (
            <Box
              sx={{
                p: 1,
                textAlign: "center",
                cursor: "pointer",
                borderRadius: 1,
                bgcolor: isSelected ? "primary.light" : bgcolor,
                color: "white",
                minHeight: 50,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                position: "relative",
              }}
            >
              <Typography variant="body2">{day}</Typography>

              {/* Mostra solo al posto delle ore */}
              {icon ? (
                <Box sx={{ display: "flex", justifyContent: "center", mt: 0.5 }}>{icon}</Box>
              ) : showHours ? (
                <Typography variant="caption">{totalHours}h</Typography>
              ) : null}
            </Box>
          );

          return segnalazione ? (
            <Tooltip key={dateStr} title={segnalazione.descrizione} placement="top">
              <Box onClick={() => onDaySelect(dateStr)}>{dayContent}</Box>
            </Tooltip>
          ) : (
            <Box key={dateStr} onClick={() => onDaySelect(dateStr)}>{dayContent}</Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default WorkCalendar;
