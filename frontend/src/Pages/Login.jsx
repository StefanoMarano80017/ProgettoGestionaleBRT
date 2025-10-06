import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Box, Paper, Stack, Typography, TextField, Button, Alert,
} from "@mui/material";
import useAuth from "@/Hooks/useAuth";
import LogoGestionale from "@assets/LogoGestionale.png";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const location = useLocation();

  const [form, setForm] = React.useState({ username: "", password: "" });
  const [error, setError] = React.useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await login(form.username, form.password);
      // Dopo il login, se veniamo da RequireAuth naviga alla destinazione originale
      const dest = location?.state?.from?.pathname || "/Home";
      nav(dest, { replace: true });
    } catch (err) {
      setError(err.message || "Errore di autenticazione");
    }
  };

  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,                  // top:0, right:0, bottom:0, left:0
        display: "grid",
        placeItems: "center",      // centro verticale + orizzontale
        bgcolor: "background.default",
        p: 2,
        zIndex: (t) => t.zIndex.modal + 1, // sopra eventuali layout
      }}
    >
      <Box
        sx={{
          boxShadow: 8,
          borderRadius: 2,
          bgcolor: "customBackground.main",
          py: 6,
          px: { xs: 3, sm: 6 },
          width: "min(640px, 92vw)",
        }}
      >
        <Stack spacing={3} alignItems="center">
          <Box component="img" src={LogoGestionale} alt="Logo applicazione" sx={{ height: 56, objectFit: "contain" }} />
          <Paper sx={{ p: 3, width: "100%" }}>
            <Typography variant="h6" sx={{ mb: 2, textAlign: "center" }}> Accedi </Typography>
            <form onSubmit={onSubmit}>
              <Stack spacing={2}>
                <TextField
                  label="Username"
                  value={form.username}
                  onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                  autoFocus
                  fullWidth
                />
                <TextField
                  label="Password"
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  fullWidth
                />
                {error && <Alert severity="error">{error}</Alert>}
                <Button type="submit" variant="contained" fullWidth> Entra </Button>
              </Stack>
            </form>
          </Paper>
        </Stack>
      </Box>
    </Box>
  );
}