import * as React from "react";
import Avatar from "@mui/material/Avatar";
import Popover from "@mui/material/Popover";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Fade from "@mui/material/Fade";

// Funzione per generare un colore consistente da un ID
function stringToColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = "#";
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff;
    color += ("00" + value.toString(16)).slice(-2);
  }
  return color;
}

export default function CustomAvatarGroup({ data, max = 3 }) {
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleClick = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const open = Boolean(anchorEl);

  const visibleEmployees = data.slice(0, max);
  const extraCount = data.length - max;

  return (
    <>
      <Box display="flex" alignItems="center" sx={{ position: "relative" }}>
        {/* Invertiamo l’ordine per avere il primo sotto */}
        {visibleEmployees
          .slice()
          .reverse()
          .map((emp, idx) => (
            <Box
              key={emp.id}
              sx={{
                zIndex: idx,
                ml: idx === 0 ? 0 : -1.5,
              }}
            >
              <Avatar sx={{ bgcolor: stringToColor(emp.name) }}>
                {emp.name[0]}
              </Avatar>
            </Box>
          ))}

        {extraCount > 0 && (
          <Box
            sx={{ ml: -1.5, cursor: "pointer", zIndex: visibleEmployees.length }}
            onClick={handleClick}
          >
            <Avatar>+{extraCount}</Avatar>
          </Box>
        )}
      </Box>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        TransitionComponent={Fade}
      >
        <Typography variant="subtitle1" sx={{ p: 1 }}>
          Persone assegnate
        </Typography>
        <List sx={{ p: 1 }}>
          {data.map((emp) => (
            <ListItem key={emp.id}>
              <Avatar
                sx={{ width: 32, height: 32, mr: 1, bgcolor: stringToColor(emp.name) }}
              >
                {emp.name[0]}
              </Avatar>
              {emp.name}
            </ListItem>
          ))}
        </List>
      </Popover>
    </>
  );
}
