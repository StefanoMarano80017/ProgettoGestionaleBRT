import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tooltip,
  Divider,
  Avatar,
  Typography,
  Button,
} from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import FolderIcon from "@mui/icons-material/Folder";
import PeopleIcon from "@mui/icons-material/People";
import DescriptionIcon from "@mui/icons-material/Description";
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../Layouts/AuthContext";
import { PAGES as pages } from "../../Routes/pagesConfig";
import UserProfile from "./UserProfile";
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SidebarItem from "./SidebarItem";
import AccountBoxIcon from '@mui/icons-material/AccountBox';
import LogoGestionale from "../../Assets/LogoGestionale.png";

// Function to get initials from name
function getInitials(name) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

const renderIcon = (IconOrElement, sx) => {
  if (React.isValidElement(IconOrElement)) {
    return React.cloneElement(IconOrElement, {
      sx: { ...(IconOrElement.props?.sx || {}), ...sx },
    });
  }
  const IconComp = IconOrElement;
  return IconComp ? <IconComp sx={sx} /> : null;
};

// Sidebar component
export default function Sidebar({ userName, onLogout, collapsed = false }) {
  const location = useLocation();
  const { user, logout } = useAuth();

  const displayName =
    user ? `${user.nome} ${user.cognome}` : userName || "Ospite";
  const initials = getInitials(displayName);

  return (
    <Box
      sx={{
        width: collapsed ? 60 : 100,
        transition: "width 0.3s",
        bgcolor: "customBackground.main",
        height: "100vh",
        borderRight: 1,
        borderColor: "divider",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Logo or App Name */}
      <Box sx={{ p: 1, display: "flex", justifyContent: "center", alignItems: "center" }}>
        <img src={LogoGestionale} alt="Logo" style={{ maxWidth: '47%', height: 'auto' }} />
      </Box>
      <Divider />

      {/* Lista pagine */}
      <List sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        {pages.map((page) => (
          <SidebarItem
            key={page.text}
            icon={renderIcon(page.icon, { fontSize: 22 })}
            text={page.text}
            path={page.path}
            selected={location.pathname === page.path}
          />
        ))}
      </List>

      {/* UserProfile */}
      <Box
        sx={{
          justifyContent: "center",
          marginY: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 1,
        }}
      >
        <SidebarItem
          key={displayName}
          icon={
            <Avatar sx={{ width: 40, height: 40, bgcolor: "customGreen.main" }}>
              <Typography variant="subtitle2" sx={{ lineHeight: 2, fontWeight: 500 }}>
                {initials}
              </Typography>
            </Avatar>
          }
          text={displayName}
          path={"/timesheet"}
          selected={false}
        />
        {/* Optional: logout button if needed */}
        <Button size="small" onClick={onLogout || logout}>Logout</Button>
      </Box>

      <Divider />
    </Box>
  );
}
