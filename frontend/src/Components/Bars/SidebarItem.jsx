import { Box, Button, Typography } from "@mui/material";
import { Link } from "react-router-dom";

const SidebarItem = ({ icon, text, path, selected }) => {
  return (
    <Button
      component={Link}
      to={path}
      color="inherit" // prevents default blue hover
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,          // 👈 prevent shrinking
        minWidth: 120,           // 👈 keep a minimum width so text/icon don’t collapse
        p: 1.5,
        textTransform: "none",
        borderRadius: 2,
        bgcolor: selected ? "action.hover" : "transparent",
        color: selected ? "customWhite.main" : "customGray.main",
        "&:hover": {
          bgcolor: selected ? "action.hover" : "transparent",
          color: selected ? "primary.contrastText" : "primary.main",
        },
      }}
    >
      <Box
        sx={{
          bgcolor: "transparent",
          color: selected ? "customWhite.main" : "customGray.main",
          borderRadius: "10%",
          width: 40,
          height: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          mb: 0.5,
          flexShrink: 0, // 👈 also prevents icon box from collapsing
        }}
      >
        {icon}
      </Box>
      <Typography variant="caption" noWrap>
        {text}
      </Typography>
    </Button>
  );
};


export default SidebarItem;
