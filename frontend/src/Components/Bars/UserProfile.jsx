import React from "react";
import { Box, Avatar, Typography, Button, Tooltip } from "@mui/material";

// Funzione per generare iniziali
function getInitials(name) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export default function UserProfile({
  userName = "Mario Rossi",
  role = "Amministratore",
  onLogout,
  collapsed = false,
}) {
  return (
    <Tooltip
      title={collapsed ? `${userName} - ${role}` : ""}
      placement="right"
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          gap: 1,
          px: 2,
          py: 1,
        }}
      >
        {/* Avatar con bordo */}
        <Avatar
          sx={{
            width: 40,
            height: 40,
          }}
        >
          {getInitials(userName)}
        </Avatar>

        {/* Sezione testo */}
        {!collapsed && (
          <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
            <Typography variant="subtitle1" noWrap>
              {userName}
            </Typography>
            <Typography variant="caption" noWrap>
              {role}
            </Typography>
          </Box>
        )}

        {/* Bottone logout */}
        {!collapsed && onLogout && (
          <Button
            variant="outlined"
            size="small"
            onClick={onLogout}
            sx={{ textTransform: "none", whiteSpace: "nowrap" }}
          >
            Logout
          </Button>
        )}
      </Box>
    </Tooltip>
  );
}
