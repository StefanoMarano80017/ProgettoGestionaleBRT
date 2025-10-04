import React, { useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import DayEntryTile from '@components/Calendar/DayEntryTile';
import MonthSelector from '@components/Calendar/MonthSelector';
import TileLegend from '@components/Calendar/TileLegend';
import { useCalendarMonthYear, useItalianHolidays, useCalendarDays } from '@hooks/Timesheet/calendar';
import { computeDayStatus } from '@components/Calendar/utils';

const WEEK_DAYS = ['Lu','Ma','Me','Gi','Ve','Sa','Do'];

/**
 * WorkCalendar
 * High-level month view calendar rendering 6 weeks worth of day tiles.
 *
 * Props:
 * - data: object keyed by dateStr -> array of records
 * - selectedDay: ISO date string currently selected
 * - onDaySelect: (dateStr) => void
 * - renderDayTooltip?: (dateStr, context) => ReactNode (lazy tooltip content)
 * - fixedDayWidth?: boolean force fixed px width columns
 * - gap?: grid gap
 * - distributeGaps?: spread columns across width removing internal gaps
 * - variant?: 'default' | 'wide' | 'compact'
 * - selectorVariant?: forward to MonthSelector
 * - selectorLabels?: label density for MonthSelector
 */
export default function WorkCalendar({
  data = {},
  selectedDay,
  onDaySelect,
  renderDayTooltip,
  fixedDayWidth = false,
  gap = 1,
  distributeGaps = false,
  variant = 'default',
  selectorVariant = 'windowed',
  selectorLabels = 'short'
}) {
  const today = useMemo(() => new Date(), []);
  const { currentMonth, currentYear, setMonthYear } = useCalendarMonthYear(today);
  const holidaySet = useItalianHolidays(currentYear);
  const { days } = useCalendarDays({ data, currentMonth, currentYear, holidaySet });

  // Controls: small arrows + 5 month buttons (current centered)
  return (
    <Box sx={{ width: "100%" }}>
      {/* Selettore mese */}
      <MonthSelector
        year={currentYear}
        month={currentMonth}
        onChange={(m, y) => setMonthYear(m, y)}
        variant={selectorVariant}
        labels={selectorLabels}
      />

  {/* Intestazione giorni della settimana */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: fixedDayWidth ? `repeat(7, ${variant === 'wide' ? 52 : 44}px)` : "repeat(7, 1fr)",
          gap: distributeGaps ? 0 : gap,
          justifyContent: distributeGaps ? "space-between" : "normal",
          width: "100%",
          mb: 1,
        }}
      >
        {WEEK_DAYS.map((wd) => (
          <Box key={wd} sx={{ textAlign: "center" }}>
            <Typography variant="caption">{wd}</Typography>
          </Box>
        ))}
      </Box>

  {/* Griglia giorni (6 settimane / 42 celle) */}
      <Box sx={{ overflowX: fixedDayWidth && !distributeGaps ? "auto" : "hidden", width: "100%" }}>
        <Box
          sx={{
              display: "grid",
              gridTemplateColumns: fixedDayWidth ? `repeat(7, ${variant === 'wide' ? 52 : 44}px)` : "repeat(7, 1fr)",
              // slightly larger rows for the 'wide' variant to accommodate more info
              gridAutoRows: variant === 'wide' ? "56px" : "44px",
              gap: distributeGaps ? 0 : gap,
              overflowY: "auto",
              scrollbarGutter: "stable",
              width: distributeGaps ? "100%" : fixedDayWidth ? "max-content" : "100%",
              justifyContent: distributeGaps ? "space-between" : "normal",
          }}
        >
        {days.map((item, index) => {
          if (!item) return <Box key={`empty-${index}`} sx={{ borderRadius: 1 }} />;
          const { day, dateStr, dayData, dayOfWeek, segnalazione, isHoliday } = item;
          const isSelected = selectedDay === dateStr;
          const totalHours = dayData?.reduce((s, r) => s + (Number(r?.ore) || 0), 0) || 0;
          const { status, showHours, iconTopRight } = computeDayStatus({
            dayData,
            dayOfWeek,
            segnalazione,
            dateStr,
            isHoliday,
            today,
          });
          const isOutOfMonth = false; // currently not rendering other-month days; keep API ready

          const tooltipContent = renderDayTooltip?.(dateStr, { dayData, dayOfWeek, isHoliday, segnalazione, totalHours });

          return (
            <DayEntryTile
              key={dateStr}
              dateStr={dateStr}
              day={day}
              isSelected={isSelected}
              status={status}
              showHours={showHours}
              iconTopRight={iconTopRight}
              totalHours={totalHours}
              onClick={onDaySelect}
              tooltipContent={tooltipContent}
              variant={variant}
              isHoliday={isHoliday}
              // isOutOfMonth intentionally omitted to allow DayEntryTile default handling
            />
          );
        })}
        </Box>
      </Box>

      {/* Legenda icone/stati */}
      <Box>
        <TileLegend />
      </Box>
    </Box>
  );
}
