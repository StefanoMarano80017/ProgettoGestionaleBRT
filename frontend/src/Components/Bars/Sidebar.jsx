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
} from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import FolderIcon from "@mui/icons-material/Folder";
import PeopleIcon from "@mui/icons-material/People";
import DescriptionIcon from "@mui/icons-material/Description";
import { Link } from "react-router-dom";
import UserProfile from "./UserProfile";

const pages = [
  { text: "Home", icon: <HomeIcon />, path: "/" },
  { text: "Commesse", icon: <FolderIcon />, path: "/commesse" },
  { text: "Progetti", icon: <FolderIcon />, path: "/progetti" },
  { text: "Dipendenti", icon: <PeopleIcon />, path: "/dipendenti" },
  { text: "Documenti", icon: <DescriptionIcon />, path: "/documenti" },
];

// Funzione per generare iniziali da nome completo
function getInitials(name) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export default function Sidebar({ userName = "Mario Rossi", onLogout, collapsed }) {
  return (
    <Box
      sx={{
        width: collapsed ? 60 : 220,
        transition: "width 0.3s",
        bgcolor: "background.paper",
        height: "100vh",
        borderRight: 1,
        borderColor: "divider",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Lista pagine */}
      <List sx={{ flexGrow: 1 }}>

        <Divider />
        {pages.map((page) => (
          <ListItem key={page.text} disablePadding>
            <Tooltip title={collapsed ? page.text : ""} placement="right">
              <ListItemButton
                component={Link}
                to={page.path}
                selected={location.pathname === page.path}
                sx={{
                  justifyContent: collapsed ? "center" : "flex-start",
                  px: 2,
                }}
              >
                <ListItemIcon sx={{ minWidth: 0, justifyContent: "center" }}>
                  {page.icon}
                </ListItemIcon>
                {!collapsed && (
                  <ListItemText primary={page.text} sx={{ ml: 2 }} />
                )}
              </ListItemButton>
            </Tooltip>
          </ListItem>
        ))}

        <Divider />
                {/* UserProfile */}
        <Box sx={{
            display: "flex",
            justifyContent: "center",
            py: 2,
            height: 40,
          }}>
          <UserProfile
            userName={userName}
            onLogout={onLogout}
            collapsed={collapsed}
          />
        </Box>

      </List>
    </Box>
  );
}
