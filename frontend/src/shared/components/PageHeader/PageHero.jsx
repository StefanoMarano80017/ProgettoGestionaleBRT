// src/shared/components/PageHeader/PageHero.jsx
import React from 'react';
import { Box, Paper, Typography, alpha } from '@mui/material';
import PropTypes from 'prop-types';

/**
 * PageHero - Reusable hero section with gradient background
 * Used for page headers with personalized greetings or titles
 */
export default function PageHero({ 
  title, 
  subtitle, 
  icon: Icon,
  color = 'primary',
  showAnimation = false,
  useCustomBlueGradient = false,
  sx = {} 
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        mb: 4,
        p: { xs: 3, md: 5 },
        borderRadius: 3,
        ...sx,
        background: (theme) => 
          useCustomBlueGradient
            ? `linear-gradient(135deg, ${theme.palette.customBlue3?.main || theme.palette.primary.main} 0%, ${theme.palette.customBlue2?.main || '#006494'} 50%, ${theme.palette.customBlue1?.main || '#00A6FB'} 100%)`
            : `linear-gradient(135deg, ${theme.palette[color].main} 0%, ${theme.palette[color].dark} 100%)`,
        color: '#ffffff',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid',
        borderColor: useCustomBlueGradient ? 'customBlue3.main' : `${color}.dark`,
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          right: 0,
          width: '50%',
          height: '100%',
          background: (theme) => 
            `radial-gradient(circle at top right, ${alpha(theme.palette.secondary.main, 0.2)} 0%, transparent 70%)`,
          pointerEvents: 'none',
        },
      }}
    >
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          {Icon && (
            <Icon 
              sx={{ 
                fontSize: 32,
                color: '#ffffff',
                ...(showAnimation && {
                  animation: 'wave 1s ease-in-out 2',
                  '@keyframes wave': {
                    '0%, 100%': { transform: 'rotate(0deg)' },
                    '25%': { transform: 'rotate(20deg)' },
                    '75%': { transform: 'rotate(-20deg)' },
                  },
                })
              }} 
            />
          )}
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 700,
              color: '#ffffff',
            }}
          >
            {title}
          </Typography>
        </Box>
        {subtitle && (
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 400,
              opacity: 0.95,
              maxWidth: 600,
              color: '#ffffff',
            }}
          >
            {subtitle}
          </Typography>
        )}
      </Box>
    </Paper>
  );
}

PageHero.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  icon: PropTypes.elementType,
  color: PropTypes.oneOf(['primary', 'secondary', 'error', 'warning', 'info', 'success']),
  showAnimation: PropTypes.bool,
  useCustomBlueGradient: PropTypes.bool,
  sx: PropTypes.object,
};
