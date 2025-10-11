import { Box, Button, Typography, alpha } from '@mui/material';
import { Link } from 'react-router-dom';
import React from 'react';
import { computeSidebarItemColors } from './sidebarUtils';

const SidebarItem = ({ icon, text, path, selected, size = 44 }) => {
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
          minWidth: 'auto',
          width: '100%',
          py: 2,
          px: 1,
          textTransform: 'none',
          borderRadius: 2.5,
          position: 'relative',
          bgcolor: selected 
            ? alpha(theme.palette.primary.main, 0.12)
            : 'transparent',
          color: baseColor,
          border: '1px solid',
          borderColor: selected 
            ? alpha(theme.palette.primary.main, 0.2)
            : 'transparent',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': { 
            bgcolor: selected 
              ? alpha(theme.palette.primary.main, 0.15)
              : alpha(theme.palette.primary.main, 0.05),
            borderColor: alpha(theme.palette.primary.main, 0.2),
            color: hc,
            transform: 'translateX(2px)',
            boxShadow: selected 
              ? `0 2px 8px ${alpha(theme.palette.primary.main, 0.15)}`
              : 'none',
          },
          '&:active': {
            transform: 'translateX(1px) scale(0.98)',
          },
          // Active indicator bar
          '&::before': {
            content: '""',
            position: 'absolute',
            left: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 3,
            height: selected ? '60%' : 0,
            bgcolor: 'primary.main',
            borderRadius: '0 4px 4px 0',
            transition: 'height 0.2s ease',
          },
        };
      }}
    >
      {/* Icon Container */}
      <Box
        sx={(theme) => {
          const { color: baseColor } = computeSidebarItemColors(theme, selected);
          return { 
            bgcolor: selected 
              ? alpha(theme.palette.primary.main, 0.1)
              : 'transparent',
            color: baseColor, 
            borderRadius: 2, 
            width: size, 
            height: size, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            mb: 0.75, 
            flexShrink: 0,
            transition: 'all 0.2s ease',
            border: '1px solid',
            borderColor: selected 
              ? alpha(theme.palette.primary.main, 0.15)
              : 'transparent',
            boxShadow: selected 
              ? `0 2px 6px ${alpha(theme.palette.primary.main, 0.12)}`
              : 'none',
          };
        }}
      >
        {icon}
      </Box>
      
      {/* Label */}
      <Typography 
        variant="caption" 
        noWrap
        sx={{
          fontWeight: selected ? 600 : 500,
          fontSize: '0.7rem',
          letterSpacing: 0.3,
          lineHeight: 1.2,
          textAlign: 'center',
          maxWidth: '100%',
          transition: 'font-weight 0.2s ease',
        }}
      >
        {text}
      </Typography>
    </Button>
  );
};

export default React.memo(SidebarItem);
