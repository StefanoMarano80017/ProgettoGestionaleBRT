import React, { useMemo, useState } from "react";
import { Box, IconButton, Typography, Tooltip, Chip, Stack } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import BeachAccessIcon from "@mui/icons-material/BeachAccess";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";

const weekDays = ["Lu", "Ma", "Me", "Gi", "Ve", "Sa", "Do"];
const monthNames = [
  "Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno",
  "Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"
];

function getDayStatus(dayData = [], segnalazione, dateStr, today) {
  const totalHours = dayData.reduce((s, r) => s + Number(r.ore || 0), 0);
  const hasFerie = dayData.some((r) => r.commessa === "FERIE");
  const hasMalattia = dayData.some((r) => r.commessa === "MALATTIA");
  const hasPermesso = dayData.some((r) => r.commessa === "PERMESSO");
  const isFuture = new Date(dateStr) > today;

  if (!dayData.length) return { label: "Vuoto", color: "default" };
  if (hasFerie) return { label: "Ferie", color: "success" };
  if (hasMalattia) return { label: "Malattia", color: "secondary" };
  if (segnalazione) return { label: "Segnalazione", color: "error" };
  if (hasPermesso && totalHours < 8) return { label: "Permesso/Parziale", color: "info" };
  if (isFuture) return { label: "Futuro", color: "default" };
  if (totalHours === 8) return { label: "Completo", color: "success" };
  if (totalHours > 0 && totalHours < 8) return { label: "Parziale", color: "warning" };
  return { label: "Vuoto", color: "default" };
}

export default function WorkCalendarGrid({ data = {}, selectedDay, onDaySelect }) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const firstDay = useMemo(() => new Date(currentYear, currentMonth, 1), [currentMonth, currentYear]);
  const lastDay = useMemo(() => new Date(currentYear, currentMonth + 1, 0), [currentMonth, currentYear]);

  const rows = useMemo(() => {
    const out = [];
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const jsDate = new Date(currentYear, currentMonth, d);
      const dow = jsDate.getDay(); // 0=Dom ... 6=Sab
      const dayData = data[dateStr] || [];
      const segnalazione = data[`${dateStr}_segnalazione`];

      const totalHours = dayData.reduce((s, r) => s + Number(r.ore || 0), 0);
      const hasPermesso = dayData.some((r) => r.commessa === "PERMESSO");
      const hasFerie = dayData.some((r) => r.commessa === "FERIE");
      const hasMalattia = dayData.some((r) => r.commessa === "MALATTIA");

      const status = getDayStatus(dayData, segnalazione, dateStr, today);
      const weekdayLabel = weekDays[(dow + 6) % 7];

      out.push({
        id: dateStr,
        day: d,
        dateStr,
        weekdayLabel,
        totalHours,
        dayData,
        hasPermesso,
        hasFerie,
        hasMalattia,
        segnalazione,
        status, // {label,color}
      });
    }
    return out;
  }, [data, currentMonth, currentYear, lastDay, today]);

  const columns = useMemo(
    () => [
      { field: "day", headerName: "Giorno", width: 90 },
      { field: "weekdayLabel", headerName: "Settimana", width: 110 },
      { field: "dateStr", headerName: "Data", width: 130 },
      {
        field: "totalHours",
        headerName: "Ore",
        type: "number",
        width: 90,
        align: "center",
        headerAlign: "center",
      },
      {
        field: "status",
        headerName: "Stato",
        width: 170,
        sortable: false,
        renderCell: (p) => {
          const { label, color } = p.row.status || { label: "—", color: "default" };
          return <Chip size="small" color={color} variant={color === "default" ? "outlined" : "filled"} label={label} />;
        },
      },
      {
        field: "flags",
        headerName: "Icone",
        width: 130,
        sortable: false,
        renderCell: (p) => {
          const icons = [];
          if (p.row.hasFerie) icons.push(<BeachAccessIcon key="ferie" fontSize="small" />);
          if (p.row.hasMalattia) icons.push(<LocalHospitalIcon key="mal" fontSize="small" />);
          if (p.row.hasPermesso) icons.push(<EventAvailableIcon key="perm" fontSize="small" />);
          return (
            <Stack direction="row" spacing={0.5} alignItems="center">
              {icons.length ? icons : <Typography variant="caption" color="text.disabled">—</Typography>}
            </Stack>
          );
        },
      },
      {
        field: "commesse",
        headerName: "Commesse",
        flex: 1,
        minWidth: 240,
        sortable: false,
        renderCell: (p) => {
          const list = p.row.dayData || [];
          if (!list.length) return <Typography variant="caption" color="text.disabled">Nessuna</Typography>;
          const chips = list.slice(0, 3).map((r, i) => {
            let chipColor = "default";
            let icon = null;
            if (r.commessa === "FERIE") { chipColor = "success"; icon = <BeachAccessIcon fontSize="inherit" />; }
            else if (r.commessa === "MALATTIA") { chipColor = "secondary"; icon = <LocalHospitalIcon fontSize="inherit" />; }
            else if (r.commessa === "PERMESSO") { chipColor = "info"; icon = <EventAvailableIcon fontSize="inherit" />; }
            return (
              <Chip
                key={`${r.commessa}-${i}`}
                size="small"
                color={chipColor}
                variant={chipColor === "default" ? "outlined" : "filled"}
                label={`${r.commessa} (${r.ore}h)`}
                icon={icon}
                sx={{ mr: 0.5 }}
              />
            );
          });
          const extra = list.length > 3 ? <Typography variant="caption">+{list.length - 3}</Typography> : null;
          return <Box sx={{ display: "flex", alignItems: "center", overflow: "hidden" }}>{chips}{extra}</Box>;
        },
      },
      {
        field: "segnalazione",
        headerName: "Note",
        width: 70,
        sortable: false,
        renderCell: (p) =>
          p.row.segnalazione ? (
            <Tooltip title={p.row.segnalazione.descrizione}>
              <WarningAmberIcon color="error" fontSize="small" />
            </Tooltip>
          ) : (
            <Typography variant="caption" color="text.disabled">—</Typography>
          ),
      },
    ],
    []
  );

  const handlePrev = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else setCurrentMonth((m) => m - 1);
  };
  const handleNext = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else setCurrentMonth((m) => m + 1);
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
        <IconButton onClick={handlePrev}><ArrowBackIosIcon /></IconButton>
        <Typography variant="h6">{monthNames[currentMonth]} {currentYear}</Typography>
        <IconButton onClick={handleNext}><ArrowForwardIosIcon /></IconButton>
      </Box>

      <Box sx={{ height: 440, width: "100%" }}>
        <DataGrid
          rows={rows}
          columns={columns}
          density="compact"
          pageSizeOptions={[10, 31]}
          initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
          hideFooterSelectedRowCount
          disableColumnMenu
          disableRowSelectionOnClick
          onRowClick={(p) => onDaySelect?.(p.row.id)}
          getRowClassName={(params) => (params.id === selectedDay ? "row-selected" : "")}
          sx={{
            "& .row-selected": {
              backgroundColor: (theme) => theme.palette.action.selected,
            },
          }}
        />
      </Box>
    </Box>
  );
}