import { Box, Breadcrumbs, Link, IconButton } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import SearchBar from "../Inputs/SearchBar";
import NotificationsMenu from "../NotificationMenu";
import LogoGestionale from "../../Assets/LogoGestionale.png";

export default function PageHeader({ breadcrumbItems = [], onToggleSidebar }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        borderBottom: 1, // bordo inferiore
        borderColor: "divider",
        px: 1, // padding orizzontale
        py: 0.5,
        position: "relative",
      }}
    >
      {/* Sezione sinistra con burger + breadcrumb */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Box
          component="img"
          src={LogoGestionale}
          alt="Logo Gestionale"
          sx={{ height: 25, width: "auto", ml: 4.5 }}
        />
      </Box>

      {/* Barra di ricerca + notifiche */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <SearchBar />
        <NotificationsMenu />
      </Box>
    </Box>
  );
}
