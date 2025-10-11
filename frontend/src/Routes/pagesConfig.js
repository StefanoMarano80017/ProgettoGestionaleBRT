import HomeIcon from "@mui/icons-material/Home";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import BusinessCenterIcon from "@mui/icons-material/BusinessCenter";
// import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";

// Elenco servizi/route mostrati in Home e Sidebar
export const PAGES = [
  { text: "Home", icon: HomeIcon, path: "/home" },
  { text: "TimeSheet", icon: AccessTimeIcon, path: "/timesheet" },
  { text: "Commesse", icon: BusinessCenterIcon, path: "/commesse" },
];