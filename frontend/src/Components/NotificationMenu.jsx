import { useState } from "react";
import {
  IconButton,
  Badge,
  Menu,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  ListItemIcon,
  Button,
  Divider,
  Typography,
  Box,
  Tooltip,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import CheckIcon from "@mui/icons-material/Check";
import UndoIcon from "@mui/icons-material/Undo";
import MailIcon from "@mui/icons-material/Mail";
import WarningIcon from "@mui/icons-material/Warning";
import { Link } from "react-router-dom";

export default function NotificationsMenu() {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: "message",
      text: "Hai ricevuto un nuovo messaggio",
      read: false,
    },
    { id: 2, type: "alert", text: "Server down dalle 14:00", read: true },
    {
      id: 3,
      type: "update",
      text: "La tua password scade tra 5 giorni",
      read: false,
    },
    { id: 4, type: "message", text: "Nuovo ticket aperto", read: false },
    {
      id: 5,
      type: "alert",
      text: "Aggiornamento sistema alle 23:00",
      read: false,
    },
    {
      id: 6,
      type: "update",
      text: "Profilo aggiornato con successo",
      read: true,
    },
    // aggiungi altre per testare lo scroll
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleClick = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const toggleRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <Box>
      {/* Pulsante notifiche */}
      <IconButton size="small" color="inherit" onClick={handleClick}>
        <Badge
          badgeContent={unreadCount}
          color="error"
          anchorOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
          sx={{
            "& .MuiBadge-badge": {
              fontSize: 9,
              height: 12, 
              minWidth: 12,
              mt:0.5,
            }
          }}
        >
          <NotificationsIcon />
        </Badge>
      </IconButton>

      {/* Menu notifiche */}
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 350,
            display: "flex",
            flexDirection: "column",
          },
        }}
      >
        {/* Header */}
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle1">Notifiche</Typography>
        </Box>
        <Divider />

        {/* Lista notifiche scrollabile */}
        <List sx={{ flexGrow: 1, maxHeight: 300, overflow: "auto" }}>
          {notifications.length === 0 ? (
            <ListItem>
              <ListItemText primary="Nessuna notifica" />
            </ListItem>
          ) : (
            notifications.map((n) => (
              <ListItem key={n.id} divider>
                <ListItemIcon>
                  {n.type === "message" && <MailIcon />}
                  {n.type === "alert" && <WarningIcon color="error" />}
                  {n.type === "update" && <NotificationsIcon />}
                </ListItemIcon>
                <ListItemText
                  primary={n.text}
                  sx={{ textDecoration: n.read ? "line-through" : "none" }}
                />
                <ListItemSecondaryAction>
                  <Tooltip
                    title={n.read ? "Segna come non letta" : "Segna come letta"}
                  >
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={() => toggleRead(n.id)}
                    >
                      {n.read ? <UndoIcon /> : <CheckIcon />}
                    </IconButton>
                  </Tooltip>
                </ListItemSecondaryAction>
              </ListItem>
            ))
          )}
        </List>

        <Divider />

        {/* Footer con azioni */}
        <Box sx={{ display: "flex", justifyContent: "space-between", p: 1 }}>
          <Button size="small" onClick={markAllAsRead}> Segna tutte come lette </Button>
          <Button size="small" component={Link} to="/notifications" onClick={handleClose} > Vedi tutto </Button>
        </Box>
      </Menu>
    </Box>
  );
}
