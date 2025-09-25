import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import AccountCircle from "@mui/icons-material/AccountCircle";
import NotificationsMenu from "./NotificationMenu";
import SearchBar from "./Inputs/SearchBar";
import { useThemeContext } from "../layouts/ThemeContext";
import ThemeSwitchComponent from "./Buttons/ThemeSwitch";

export default function PrimarySearchAppBar() {
  const { darkMode, toggleTheme } = useThemeContext();

  return (
    <AppBar
      position="static"
      elevation={0} // rimuove ombra
      sx={{
        backgroundColor: "transparent", // nessun background
        boxShadow: "none", // niente shadow
        margin: 0,
        borderBottom: 1,
        borderColor: "divider",
        height:65
      }}
    >

      <Toolbar sx={{ display: "flex", justifyContent: "space-between", p: 0}}>
        {/* Logo a sinistra */}
        <Box sx={{ display: "flex", alignItems: "center", mr: 2 }}>
          <img src="/logo.png" alt="Logo" style={{ height: 40 }} />
        </Box>

        {/* Barra di ricerca al centro */}
        <Box sx={{ flexGrow: 1, px: 4 }}>
          <SearchBar />
        </Box>

        {/* Icone a destra */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <NotificationsMenu />

          <IconButton
            size="small"
            edge="end"
            aria-controls="primary-search-account-menu"
            aria-haspopup="true"
            color="inherit"
          >
            <AccountCircle />
          </IconButton>

          <ThemeSwitchComponent checked={darkMode} onChange={toggleTheme} />
        </Box>
      </Toolbar>
    </AppBar>
  );
}
