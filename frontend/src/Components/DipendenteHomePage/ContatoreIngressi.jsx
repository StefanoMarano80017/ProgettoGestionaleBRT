import React from "react";
import { Box, Stack, Alert, Typography, Card } from "@mui/material";
import LayoutDashColumn from "./LayoutDashColumn";
import CalendarDipendenti from "../Calendar/CalendarDipendenti";
import SetOreGiorno from "../Calendar/SetOreGiorno";

/**
 * ContatoreIngressi
 *
 * Props:
 * - selectedDate: Date
 * - setSelectedDate: function(Date)
 * - currentMonth: number
 * - setCurrentMonth: function(number)
 * - daysInfo: object (mappa { "YYYY-MM-DD": { type, hours, ... } })
 */
const ContatoreIngressi = ({ selectedDate, setSelectedDate, currentMonth, setCurrentMonth, daysInfo }) => {
  return (
    <Box >
      <Card variant="outlined" sx={{ p: 2 }}>
        <LayoutDashColumn spacing={0}
          left={
            <CalendarDipendenti
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              currentMonth={currentMonth}
              setCurrentMonth={setCurrentMonth}
              daysInfo={daysInfo}
            />
          }
          right={
            <SetOreGiorno selectedDate={selectedDate}
          />}
        />
      </Card>
    </Box>
  );
};

export default ContatoreIngressi;
