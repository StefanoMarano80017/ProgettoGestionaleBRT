import React from "react";
import { Box, Typography, Tooltip } from "@mui/material";

/**
 * DayEntryTile
 * Presentational tile for a single day inside the calendar grid.
 * Handles selection outline, background color logic, icons, hours badge, and optional tooltip.
 */
export default function DayEntryTile({
  dateStr,
  day,
  isSelected = false,
  bgcolor = "transparent",
  icon = null,
  showHours = false,
  hasPermessoDot = false,
  iconTopRight = false,
  totalHours = 0,
  onClick,
  tooltipContent,
  variant = "default", // 'default' | 'wide' (slightly larger visual spacing)
  showDayNumber = true,
}) {
  const isWide = variant === "wide";
  const dateChipBg = (isSelected || bgcolor !== "transparent")
    ? "rgba(255,255,255,0.25)"
    : "rgba(0,0,0,0.06)";

  const tile = (
    <Box
      onClick={() => onClick?.(dateStr)}
      sx={{
        position: "relative",
        cursor: "pointer",
        borderRadius: 1,
        background: isSelected
          ? (theme) => theme.palette.primary.light
          : bgcolor,
        bgcolor: isSelected ? "primary.light" : bgcolor,
        color: bgcolor !== "transparent" ? "white" : "text.primary",
        height: "100%",
        px: isWide ? 1.25 : 1,
        boxShadow: isSelected
          ? "inset 0 0 0 2px #fff"
          : "inset 0 0 0 1px rgba(0,0,0,0.12)",
      }}
    >
      {/* Day number chip */}
      {showDayNumber && (
        <Typography
          variant="caption"
          sx={{
            position: "absolute",
            top: isWide ? 5 : 4,
            left: isWide ? 7 : 6,
            lineHeight: 1,
            px: 0.5,
            borderRadius: 1,
            backgroundColor: dateChipBg,
          }}
        >
          {day}
        </Typography>
      )}

      {/* Hours label at bottom center */}
      <Typography
        variant="caption"
        sx={{ position: "absolute", bottom: 4, left: "50%", transform: "translateX(-50%)", lineHeight: 1 }}
      >
        {showHours ? `${totalHours}h` : ""}
      </Typography>

      {/* Main icon (centered or top-right) */}
      {icon && (
        <Box
          sx={{
            position: "absolute",
            top: iconTopRight ? (isWide ? 5 : 4) : "50%",
            right: iconTopRight ? (isWide ? 7 : 6) : undefined,
            left: iconTopRight ? undefined : "50%",
            transform: iconTopRight ? "none" : "translate(-50%, -50%)",
            lineHeight: 0,
          }}
        >
          {icon}
        </Box>
      )}

      {/* Optional small dot for permissions */}
      {hasPermessoDot && (
        <Box
          sx={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            bgcolor: "white",
            position: "absolute",
            top: isWide ? 7 : 6,
            right: isWide ? 7 : 6,
          }}
        />
      )}
    </Box>
  );

  return tooltipContent ? (
    <Tooltip title={tooltipContent} arrow placement="top">
      <Box sx={{ height: "100%" }}>{tile}</Box>
    </Tooltip>
  ) : (
    tile
  );
}
