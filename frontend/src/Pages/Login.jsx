import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Paper,
  Stack,
  Typography,
  TextField,
  Button,
  Alert,
} from "@mui/material";
import LogoGestionale from "@assets/LogoGestionale.png";
import { useAuth } from "../auth/AuthProvider";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    console.group("🧩 LOGIN DEBUG");
    console.log("➡️ Login form submitted");
    console.log("👤 Username:", username);
    console.log("🔒 Password length:", password.length);

    try {
      const result = await login(username, password);
      console.log("✅ Login API call resolved:", result);

      if (result.ok) {
        console.log("➡️ Login successful, navigating to /");
        navigate("/home", { replace: true });
      } else {
        console.warn("⚠️ Login API returned ok=false, staying on login page.");
        setError("Login fallito");
      }

    } catch (err) {
      console.error("❌ Login failed:", err);
      setError(err.message || "Login fallito");
    } finally {
      setLoading(false);
      console.groupEnd();
    }
  }

  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        display: "grid",
        placeItems: "center",
        bgcolor: "background.default",
        p: 2,
        zIndex: (t) => t.zIndex.modal + 1,
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
          position: "relative",
        }}
      >
        <Stack spacing={3} alignItems="center">
          <Box
            component="img"
            src={LogoGestionale}
            alt="Logo applicazione"
            sx={{ height: 56, objectFit: "contain" }}
          />
          <Paper sx={{ p: 3, width: "100%" }}>
            <Typography variant="h6" sx={{ mb: 2, textAlign: "center" }}>
              Accedi
            </Typography>

            <form onSubmit={handleSubmit}>
              <Stack spacing={2}>
                <TextField
                  label="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoFocus
                  fullWidth
                />
                <TextField
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  fullWidth
                />

                {error && <Alert severity="error">{error}</Alert>}

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={loading}
                >
                  {loading ? "Accesso in corso..." : "Entra"}
                </Button>
              </Stack>
            </form>
          </Paper>
        </Stack>

        <Box
          sx={{
            position: "absolute",
            bottom: 16,
            left: "50%",
            transform: "translateX(-50%)",
            textAlign: "center",
            width: "100%",
            px: 2,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Sistema Gestionale BRT • Developed by:{" "}
            <strong>Andrea Manfellotti &amp; Stefano Marano</strong>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
