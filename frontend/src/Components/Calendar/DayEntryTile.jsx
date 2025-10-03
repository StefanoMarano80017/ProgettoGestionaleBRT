import React from "react";
import { Box, Typography, Tooltip } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { getTileSx } from "./tileStyles";
import { getStatusIcon } from "./statusIcons.jsx";

/**
 * DayEntryTile
 * Presentational tile for a single day inside the calendar grid.
 * Handles selection outline, background color logic, icons, hours badge, and optional tooltip.
 */
export default function DayEntryTile({
  dateStr,
  day,
  // State flags
  isSelected = false,
  isHoliday = false,
  isOutOfMonth = false,
  // Visual data
  bgcolor = "transparent",
  totalHours = 0,
  // Decorations
  icon = null,
  iconTopRight = false,
  hasPermessoDot = false,
  status = undefined, // 'admin-warning' | 'holiday' | 'ferie' | 'malattia' | 'permesso' | 'complete' | 'partial' | 'future'
  // UI
  showHours = false,
  showDayNumber = true,
  tooltipContent,
  variant = "default", // 'default' | 'wide'
  onClick,
}) {
  const isWide = variant === "wide";
  const theme = useTheme();
  // determine weekend from dateStr (expects ISO yyyy-mm-dd or valid Date string)
  const isWeekend = React.useMemo(() => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return false;
    const wd = d.getDay();
    return wd === 0 || wd === 6;
  }, [dateStr]);

  const tile = (
    <Box
      onClick={() => onClick?.(dateStr)}
      sx={(t) => getTileSx(t, {
        isSelected,
        isHoliday,
        isWeekend,
        isOutOfMonth,
        status,
        hasBg: bgcolor !== "transparent",
        bgcolor,
        isWide,
      })}
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
            borderRadius: 0,
            // removed background per request; keep text weight and color from parent
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
        {showHours ? (totalHours > 0 ? `${totalHours}h` : "-") : ""}
      </Typography>

      {/* Main icon (centered or top-right). If not provided, infer from status */}
      {(icon || status) && (
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
          {(() => {
            // If a custom icon element was provided, color it based on status for consistency
            if (icon && React.isValidElement(icon)) {
              // Determine color by explicit status first
              let statusColor =
                status === 'ferie'
                  ? (theme.palette.customPink?.main || theme.palette.secondary.main)
                  : status === 'malattia'
                  ? theme.palette.success.main
                  : undefined;

              // If no status provided, try to infer from the icon component type (e.g. BeachAccess, LocalHospital)
              if (!statusColor && icon.type) {
                const typeName = icon.type.displayName || icon.type.name || String(icon.type);
                if (typeName.includes('BeachAccess')) {
                  statusColor = theme.palette.customPink?.main || theme.palette.secondary.main;
                } else if (typeName.includes('LocalHospital')) {
                  statusColor = theme.palette.success.main;
                }
              }

              if (statusColor) {
                // merge existing sx if any
                const existingSx = icon.props?.sx || {};
                const mergedSx = { ...existingSx, color: statusColor };
                return React.cloneElement(icon, { sx: mergedSx });
              }
              return icon;
            }

            // Fallback to shared status icon (already themed)
            return getStatusIcon(theme, status);
          })()}
        </Box>
      )}

      {/* Optional small dot for permissions */}
      {hasPermessoDot && (
        <Box
          sx={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            bgcolor: "currentColor",
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
