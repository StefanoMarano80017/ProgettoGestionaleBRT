import HomeIcon from "@mui/icons-material/Home";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";

// Elenco servizi/route mostrati in Home e Sidebar
export const PAGES = [
  { text: "Home", icon: HomeIcon, path: "/home" },
  { text: "TimeSheet", icon: AccessTimeIcon, path: "/timesheet" },
  { text: "Amministrazione", icon: AdminPanelSettingsIcon, path: "/amministrazione" },
];