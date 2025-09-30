import { Box, Breadcrumbs, IconButton, Tooltip } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import SearchBar from "../Inputs/SearchBar";
import NotificationsMenu from "../NotificationMenu";
import { Link as RouterLink, useLocation } from "react-router-dom";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";

export default function PageHeader({ onToggleSidebar }) {
  const location = useLocation();

  const crumbs = (() => {
    const segments = location.pathname.split("/").filter(Boolean);
    const items = [];
    let acc = "";

    items.push({
      href: "/",
      label: "Home",
      icon: <HomeOutlinedIcon fontSize="small" />,
    });

    segments.forEach((seg) => {
      acc += `/${seg}`;
      const map = {
        timesheet: { label: "Timesheet", icon: <AccessTimeIcon fontSize="small" /> },
        calendario: { label: "Calendario", icon: <CalendarMonthIcon fontSize="small" /> },
        calendar: { label: "Calendario", icon: <CalendarMonthIcon fontSize="small" /> },
        progetti: { label: "Progetti", icon: <WorkOutlineIcon fontSize="small" /> },
        projects: { label: "Progetti", icon: <WorkOutlineIcon fontSize="small" /> },
        impostazioni: { label: "Impostazioni", icon: <SettingsOutlinedIcon fontSize="small" /> },
        settings: { label: "Impostazioni", icon: <SettingsOutlinedIcon fontSize="small" /> },
        profilo: { label: "Profilo", icon: <PersonOutlineIcon fontSize="small" /> },
        profile: { label: "Profilo", icon: <PersonOutlineIcon fontSize="small" /> },
        dipendente: { label: "Dipendente", icon: <PersonOutlineIcon fontSize="small" /> },
      };
      const meta = map[seg?.toLowerCase()] || { label: seg, icon: <FolderOpenIcon fontSize="small" /> };
      items.push({ href: acc, ...meta });
    });

    return items;
  })();

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        borderBottom: 1,
        borderColor: "divider",
        pr: 6,
        pl: 2,
        py: 1,
        position: "relative",
        gap: 1,
      }}
    >
      {/* Left: menu toggle + icon-only breadcrumbs (current page included) */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        

        <Breadcrumbs separator="›" aria-label="Percorso">
          {crumbs.map((c, idx) => {
            const isLast = idx === crumbs.length - 1;
            const iconBox = (
              <Box
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  color: isLast ? "primary.main" : "text.secondary",
                  "&:hover": { color: "text.primary" },
                }}
              >
                {c.icon}
              </Box>
            );
            return isLast ? (
              <Tooltip key={c.href} title={c.label}>
                <span>{iconBox}</span>
              </Tooltip>
            ) : (
              <Tooltip key={c.href} title={c.label}>
                <Box component={RouterLink} to={c.href} sx={{ textDecoration: "none" }}>
                  {iconBox}
                </Box>
              </Tooltip>
            );
          })}
        </Breadcrumbs>
      </Box>

      {/* Right: search + notifications */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <SearchBar />
        <NotificationsMenu />
      </Box>
    </Box>
  );
}
