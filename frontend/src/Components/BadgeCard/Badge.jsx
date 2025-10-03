import React from "react";
import {
  Card,
  CardHeader,
  CardContent,
  Avatar,
  Typography,
  Box,
  IconButton,
  Chip,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import { useAuth } from "../../Layouts/AuthContext";
import LogoBRT from "../../assets/LogoBRT.png";
import LogoGestionale from "../../assets/LogoGestionale.png";
// Se li aggiungi al repo:
import LogoInwave from "../../assets/LogoInwave.png";
import LogoSTEP from "../../assets/LogoSTEP.png";

export default function BadgeCard(props) {
  const {
    avatar,
    actionIcon = null,
    companyId: propCompanyId,
    companyLogo: propCompanyLogo = "",
    holderName: propHolderName,
    isBadgiato = false,
    company: propCompany, // opzionale: forzare azienda via prop
    sx = {},
  } = props;

  const { user } = useAuth();

  // Dati base utente
  const holderName =
    (propHolderName && String(propHolderName).trim()) ||
    (user ? `${user.nome} ${user.cognome}` : "");
  const companyId =
    (propCompanyId && String(propCompanyId).trim()) ||
    user?.id ||
    "";

  // Azienda corrente (prop > user.azienda)
  const companyRaw = propCompany || user?.azienda || "";
  const companyKey = String(companyRaw).toUpperCase();

  const COMPANY_LOGOS = {
    BRT: LogoBRT,
    INWAVE: LogoInwave, // se mancante, verrà fallback
    STEP: LogoSTEP,     // se mancante, verrà fallback
  };

  const companyLogo =
    (propCompanyLogo && String(propCompanyLogo).trim()) ||
    COMPANY_LOGOS[companyKey] ||
    LogoGestionale;

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

      {/* Logo azienda in basso a destra */}
      {companyLogo ? (
        <Box
          component="img"
          src={companyLogo}
          alt={companyKey || "Azienda"}
          sx={{
            position: "absolute",
            bottom: 10,
            right: 10,
            height: 24,
            objectFit: "contain",
            pointerEvents: "none",
          }}
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      ) : (
        <Chip
          label={companyKey || "AZIENDA"}
          size="small"
          sx={{ position: "absolute", bottom: 10, right: 10, borderRadius: 1 }}
        />
      )}

      {/* Titolo */}
      <Typography variant="subtitle2" color="customBlack.main" sx={{ position: "absolute", top: 14, left: 14 }}>
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
        {/* Nome e ID in customBlue3 */}
        <Typography variant="subtitle1" sx={{ color: "customBlue3.main" }}>
          {holderName || "—"}
        </Typography>
        <Typography variant="caption" sx={{ color: "customBlue3.main" }}>
          {companyId || "—"}
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
