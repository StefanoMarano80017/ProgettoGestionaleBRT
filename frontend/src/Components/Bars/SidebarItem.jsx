import { Box, Button, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import React, { useMemo } from 'react';
import { computeSidebarItemColors } from './sidebarUtils';

/**
 * Single navigation item used inside the Sidebar.
 * Provides consistent sizing + color logic with hover + selected states.
 *
 * Props:
 * - icon: React node (icon element already sized, or any element)
 * - text: string label shown under icon
 * - path: router path to navigate to
 * - selected: boolean active state
 * - size?: numeric icon box edge (default 40)
 */
const SidebarItem = ({ icon, text, path, selected, size = 40 }) => {
  const { color, hoverColor } = useMemo(
    () => ({ color: undefined, hoverColor: undefined }),
    []
  );

  return (
    <Button
      component={Link}
      to={path}
      color="inherit"
      sx={(theme) => {
        const { color: baseColor, hoverColor: hc } = computeSidebarItemColors(theme, selected);
        return {
          display: 'flex',
          flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          flexShrink: 0,
          minWidth: 100,
          p: 1.5,
          textTransform: 'none',
          borderRadius: 2,
          bgcolor: selected ? 'action.hover' : 'transparent',
          color: baseColor,
          '&:hover': {
            bgcolor: selected ? 'action.hover' : 'transparent',
            color: hc,
          },
        };
      }}
    >
      <Box
        sx={(theme) => {
          const { color: baseColor } = computeSidebarItemColors(theme, selected);
          return {
            bgcolor: 'transparent',
            color: baseColor,
            borderRadius: '10%',
            width: size,
            height: size,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 0.5,
            flexShrink: 0,
          };
        }}
      >
        {icon}
      </Box>
      <Typography variant="caption" noWrap>
        {text}
      </Typography>
    </Button>
  );
};

export default React.memo(SidebarItem);
