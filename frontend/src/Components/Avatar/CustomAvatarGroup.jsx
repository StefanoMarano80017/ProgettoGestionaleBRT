import * as React from "react";
import Popover from "@mui/material/Popover";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Fade from "@mui/material/Fade";
import { AvatarInitials } from "@components/Avatar/AvatarInitials"; // importa il componente creato prima
import PropTypes from 'prop-types';

/**
 * CustomAvatarGroup
 * Small stacked avatar group that shows a popover list for extras.
 *
 * Props:
 * - data: array of { id, name }
 * - max: number of visible avatars before showing +N
 */
export function CustomAvatarGroup({ data = [], max = 3 }) {
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleClick = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const open = Boolean(anchorEl);

  const visibleEmployees = (data || []).slice(0, max);
  const extraCount = Math.max(0, (data || []).length - max);

  return (
    <>
      <Box display="flex" alignItems="center" sx={{ position: "relative" }}>
        {visibleEmployees
          .slice()
          .reverse()
          .map((emp, idx) => {
            const parts = (emp?.name || '').split(/\s+/);
            const first = parts[0] || '';
            const last = parts.slice(1).join(' ') || '';
            return (
              <Box
                key={emp.id}
                sx={{
                  // render later items above earlier ones
                  zIndex: visibleEmployees.length - idx,
                  ml: idx === 0 ? 0 : -1.5,
                }}
              >
                <AvatarInitials name={first} surname={last} size={40} />
              </Box>
            );
          })}

        {extraCount > 0 && (
          <Box
            sx={{
              ml: -1.5,
              cursor: "pointer",
              zIndex: visibleEmployees.length + 1,
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
          {(data || []).map((emp) => {
            const parts = (emp?.name || '').split(/\s+/);
            const first = parts[0] || '';
            const last = parts.slice(1).join(' ') || '';
            return (
              <ListItem key={emp.id}>
                <AvatarInitials name={first} surname={last} size={32} />
                <Typography sx={{ ml: 1 }}>{emp.name}</Typography>
              </ListItem>
            );
          })}
        </List>
      </Popover>
    </>
  );
}

CustomAvatarGroup.propTypes = {
  data: PropTypes.array,
  max: PropTypes.number,
};

export default React.memo(CustomAvatarGroup);
