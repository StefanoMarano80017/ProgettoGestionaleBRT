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
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SidebarItem from "./SidebarItem";
import AccountBoxIcon from '@mui/icons-material/AccountBox';
import LogoGestionale from "../../Assets/LogoGestionale.png"

// Sidebar items definition

const pages = [
  { text: "Home", icon: <HomeIcon />, path: "/" },
  { text: "TimeSheet", icon: <AccessTimeIcon />, path: "/timesheet" },
  { text: "Commesse", icon: <FolderIcon />, path: "/commesse" },
  { text: "Dipendenti", icon: <PeopleIcon />, path: "/dipendenti" },
  { text: "Documenti", icon: <DescriptionIcon />, path: "/documenti" },
];

// Function to get initials from name
function getInitials(name) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

// Sidebar component
export default function Sidebar({ userName = "Mario Rossi", onLogout, collapsed = false }) {
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
            icon={page.icon}
            text={page.text}
            path={page.path}
            selected={location.pathname === page.path}
          />
        ))}
      </List>
      {/* UserProfile */}
      <Box sx={{ justifyContent: "center", marginY: 2, display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
        <SidebarItem
          key={userName}
          icon={<Avatar sx={{ width: 40,  height: 40, bgcolor: "customGreen.main", }}> <Typography variant="subtitle" sx={{ lineHeight: 2, fontWeight: 400}}> {getInitials(userName)} </Typography> </Avatar>}
          text={userName}
          path={"/timesheet"}
          selected={false}
        />
      </Box>

        <Divider />
    </Box>
  );
}
