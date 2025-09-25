import * as React from "react";
import Popover from "@mui/material/Popover";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Fade from "@mui/material/Fade";
import { AvatarInitials } from "./AvatarInitials"; // importa il componente creato prima

export default function CustomAvatarGroup({ data, max = 3 }) {
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleClick = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const open = Boolean(anchorEl);

  const visibleEmployees = data.slice(0, max);
  const extraCount = data.length - max;

  // Testo del pulsante + (sempre presente)
  const plusLabel = extraCount > 0 ? `${extraCount}` : "";

  return (
    <>
      <Box display="flex" alignItems="center" sx={{ position: "relative" }}>
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
              <AvatarInitials
                name={emp.name.split(" ")[0] || ""}
                surname={emp.name.split(" ")[1] || ""}
                size={40}
              />
            </Box>
          ))}

        {extraCount > 0 && (
          <Box
            sx={{
              ml: -1.5,
              cursor: "pointer",
              zIndex: visibleEmployees.length,
            }}
            onClick={handleClick}
          >
            {/* + con numero degli extra */}
            <AvatarInitials
              text={`+${extraCount}`}
              size={40}
              style={{ backgroundColor: "#B0B0B0", borderColor: "#888888" }}
            />
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
              <AvatarInitials
                name={emp.name.split(" ")[0] || ""}
                surname={emp.name.split(" ")[1] || ""}
                size={32}
              />
              <Typography sx={{ ml: 1 }}>{emp.name}</Typography>
            </ListItem>
          ))}
        </List>
      </Popover>
    </>
  );
}
