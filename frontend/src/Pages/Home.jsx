// src/pages/Home.jsx
import React from "react";
import { Box, Container, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { PAGES } from "@/Routes/pagesConfig";

const renderIcon = (IconOrElement, sx) => {
  // Se è già un elemento <Icon />, clona e aggiungi sx
  if (React.isValidElement(IconOrElement)) {
    return React.cloneElement(IconOrElement, {
      sx: { ...(IconOrElement.props?.sx || {}), ...sx },
    });
  }
  // Se è un componente (es. AccessTimeIcon), istanzialo
  const IconComp = IconOrElement;
  return IconComp ? <IconComp sx={sx} /> : null;
};

export default function Home() {
  // Filtra via la voce Home
  const SERVICES = React.useMemo(
    () => PAGES.filter((p) => p?.path?.toLowerCase() !== "/home" && p?.text?.toLowerCase() !== "home"),
    []
  );

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Box wrapper coordinato come negli altri pannelli */}
      <Box
        sx={{
          boxShadow: 8,
          borderRadius: 2,
          bgcolor: "customBackground.main",
          p: { xs: 2, md: 4 },
        }}
      >
        <Typography variant="h6" sx={{ mb: 2 }}> Servizi </Typography>

        {/* Griglia responsive a capo */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 2.5,
          }}
        >
          {SERVICES.map(({ text, icon, path }) => {
            const iconNode = renderIcon(icon, { fontSize: 40, color: "primary.main", mb: 1 });
            return (
              <Box
                key={text}
                component={RouterLink}
                to={path}
                sx={{
                  textDecoration: "none",
                  color: "inherit",
                  boxShadow: 8,
                  borderRadius: 2,
                  bgcolor: "background.default",
                  p: 3,
                  height: 140,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "transform 120ms ease, box-shadow 120ms ease",
                  "&:hover": { transform: "translateY(-2px)", boxShadow: 12 },
                }}
              >
                {iconNode}
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {text}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Container>
  );
}
