import { Box, Breadcrumbs, Link, IconButton } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import SearchBar from "../Inputs/SearchBar";
import NotificationsMenu from "../NotificationMenu";
import CustomBreadcrumbs from "../Buttons/CustomBreadcrumbs"

export default function PageHeader({ breadcrumbItems = [], onToggleSidebar }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        mb: 3,
        borderBottom: 1, // bordo inferiore
        borderColor: "divider",
        px: 1, // padding orizzontale
        py: 0.5,
        position: "relative",
      }}
    >
      {/* Sezione sinistra con burger + breadcrumb */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        {/* Burger menu */}
        <IconButton onClick={onToggleSidebar} size="small">
          <MenuIcon />
        </IconButton>

        {/* Breadcrumb */}
        <CustomBreadcrumbs
          items={breadcrumbItems}
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
