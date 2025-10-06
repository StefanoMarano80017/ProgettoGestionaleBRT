import * as React from "react";
import { Box, Breadcrumbs, IconButton, Tooltip, Typography } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import SearchBar from "@/Components/Inputs/SearchBar";
import NotificationsMenu from "@/Components/NotificationMenu";
import { Link as RouterLink, useLocation } from "react-router-dom";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import ThemeSwitchComponent from "@/Components/Buttons/ThemeSwitch";
import { useThemeContext } from "@/Hooks/useThemeContext";
import { PAGES } from "@/Routes/pagesConfig"; // <-- usa la stessa config della Sidebar

// Helper per render icone sia come componente che come elemento JSX
// Icons default to color: 'inherit' so they pick up the parent Box color
const renderIcon = (IconOrElement, sx = {}) => {
  const forcedColor = sx?.color ?? "inherit";
  const merged = { ...(IconOrElement.props?.sx || {}), ...sx, color: forcedColor };
  if (React.isValidElement(IconOrElement)) {
    return React.cloneElement(IconOrElement, {
      sx: merged,
    });
  }
  const IconComp = IconOrElement;
  return IconComp ? <IconComp sx={merged} /> : null;
};

export default function PageHeader() {
  const location = useLocation();
  const { mode, toggleTheme } = useThemeContext();

  // Map segment -> { icon, label } presi da pagesConfig
  const pageMeta = React.useMemo(() => {
    const meta = {};
    PAGES.forEach(({ path, icon, text }) => {
      const seg = String(path || "").toLowerCase().replace(/^\//, ""); // es. 'timesheet'
      meta[seg] = { icon, label: text };
    });
    return meta;
  }, []);

  const crumbs = React.useMemo(() => {
    const path = location.pathname.toLowerCase();
    const segments = path.split("/").filter(Boolean);

    // Primo elemento: Home con icona
    const items = [
      {
        href: "/home",
        label: pageMeta.home?.label || "Home",
        icon: renderIcon(pageMeta.home?.icon || HomeOutlinedIcon, { fontSize: "medium" }),
      },
    ];

    // Se siamo su "/" o "/home" mostra solo Home
    if (path === "/" || path === "/home") return items;

    // Costruisci resto, saltando 'home'
    let acc = "";
    segments.forEach((seg) => {
      if (seg === "home") return;
      acc += `/${seg}`;
      const { icon, label } = pageMeta[seg] || {};
      items.push({
        href: acc,
        label: label || seg,
        icon: renderIcon(icon || FolderOpenIcon, { fontSize: "medium" }),
      });
    });

    return items;
  }, [location.pathname, pageMeta]);

  // Removed unused currentTitle

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        bgcolor: "customBackground.main",
        pr: 6,
        pl: 2,
        py: 1,
        position: "relative",
        gap: 1,
      }}
    >
      {/* Left: breadcrumbs a icone */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Breadcrumbs separator={<KeyboardArrowRightIcon />} aria-label="Percorso">
          {crumbs.map((c, idx) => {
            const isLast = idx === crumbs.length - 1;
            // compute a theme-aware active color: timesheet uses blue3 in light, blue1 in dark
            const iconColor = isLast
              ? (location.pathname.toLowerCase().startsWith("/timesheet")
                  ? (mode === "light" ? "customBlue3.main" : "customBlue1.main")
                  : "primary.main")
              : "text.secondary";

            const iconBox = (
              <Box
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  color: iconColor,
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
        {/* page title removed; only breadcrumb icons are shown */}
      </Box>

      {/* Right: search + notifications + theme */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <SearchBar />
        <NotificationsMenu />
        <ThemeSwitchComponent checked={mode === "dark"} onChange={toggleTheme} />
      </Box>
    </Box>
  );
}
