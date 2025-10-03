import React from "react";
import {
  WarningAmber,
  Celebration,
  BeachAccess,
  LocalHospital,
  EventAvailable,
  CheckCircle,
  AccessTime,
} from "@mui/icons-material";

export const DayStatus = {
  AdminWarning: 'admin-warning',
  Holiday: 'holiday',
  Ferie: 'ferie',
  Malattia: 'malattia',
  Permesso: 'permesso',
  Complete: 'complete',
  Partial: 'partial',
  Future: 'future',
};

// Returns a React element already colored with the theme-consistent color for that status
export function getStatusIcon(theme, status) {
  switch (status) {
    case DayStatus.AdminWarning:
      return <WarningAmber fontSize="small" sx={{ color: theme.palette.error.main }} />;
    case DayStatus.Holiday:
      return <Celebration fontSize="small" sx={{ color: theme.palette.customRed?.main || theme.palette.error.main }} />;
    case DayStatus.Ferie:
      return <BeachAccess fontSize="small" sx={{ color: theme.palette.customPink?.main || theme.palette.secondary.main }} />;
    case DayStatus.Malattia:
      return <LocalHospital fontSize="small" sx={{ color: theme.palette.success.main }} />;
    case DayStatus.Permesso:
      return <EventAvailable sx={{ fontSize: 16, color: theme.palette.info.main }} />;
    case DayStatus.Complete:
      return <CheckCircle sx={{ fontSize: 16, color: theme.palette.success.main }} />;
    case DayStatus.Partial:
      return <AccessTime sx={{ fontSize: 16, color: theme.palette.warning.main }} />;
    case DayStatus.Future:
    default:
      return null;
  }
}
