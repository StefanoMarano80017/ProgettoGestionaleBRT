import React from "react";
import {
  Card,
  CardHeader,
  CardContent,
  Avatar,
  Typography,
  Box,
  IconButton,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import LogoGestionale from "../../Assets/LogoGestionale.png";

function BadgeCard({
  avatar,
  actionIcon = null,
  companyId = "",
  companyLogo = "",
  holderName = "",
  isBadgiato = false, // nuovo prop: true se ha badgiato quella giornata
  sx = {},
}) {
  return (
    <Card
      sx={{
        width: 300,
        height: 160,
        position: "relative",
        overflow: "hidden",
        borderRadius: 2,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "white",
        ...sx,
      }}
      elevation={3}
    >
      {/* stato badging in alto a destra */}
      <Box
        sx={{
          position: "absolute",
          top: 15,
          right: 15,
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          bgcolor: "transparent",
          px: 0.5,
        }}
      >
        {isBadgiato ? (
          <>
            <CheckCircleIcon sx={{ color: "success.main", fontSize: 20 }} />
            <Typography variant="caption" sx={{ color: "success.main", fontWeight: 600 }}>
              Marcato
            </Typography>
          </>
        ) : (
          <>
            <RadioButtonUncheckedIcon sx={{ color: "primary.main", fontSize: 20 }} />
            <Typography variant="caption" sx={{ color: "primary.main", fontWeight: 600 }}>
              Non marcato
            </Typography>
          </>
        )}
      </Box>

      {/* logo azienda in alto a destra */}
      {companyLogo && (
        <Box
          component="img"
          src={companyLogo}
          alt="company logo"
          sx={{
            position: "absolute",
            bottom: 0,
            right: 15,
            width: 56,
            height: 56,
            objectFit: "contain",
          }}
        />
      )}

      {/* eventuale icona azione in alto a sinistra */}
      <Typography variant="h7" color="customBlack.main" sx={{ position: "absolute", top: 14, left: 14 }}>
        Badge Dipendente
      </Typography>

      <CardContent
        sx={{
          px: 2,
          py: 1,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: 1,
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
        }}
      >
        <Typography
          variant="subtitle2"
          color="customBlack.main"
          sx={{ letterSpacing: 0.5 }}
        >
          {companyId}
        </Typography>

        <Typography variant="h6" color="customBlack.main" sx={{ fontWeight: 700 }}>
          {holderName}
        </Typography>
      </CardContent>

      {/* logo dell'app in basso a sinistra */}
      {LogoGestionale && (
        <Box
          component="img"
          src={LogoGestionale}
          alt="app logo"
          sx={{
            position: "absolute",
            bottom: 8,
            left: 10,
            width: 30,
            height: 30,
            objectFit: "contain",
            opacity: 0.95,
          }}
        />
      )}
    </Card>
  );
}

export default BadgeCard;
