// src/shared/components/PageHeader/PageHero.jsx
import React from 'react';
import { Box, Paper, Typography, Stack, Chip } from '@mui/material';
import PropTypes from 'prop-types';
import { TrendingUp } from '@mui/icons-material';

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
  showStatusChip = true,
  sx = {} 
}) {
  return (
    <Paper
      elevation={3}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        px: 3,
        py: 1.5,
        borderRadius: 2,
        mb: 3,
        ...sx,
        background: (theme) => 
          useCustomBlueGradient
            ? `linear-gradient(135deg, ${theme.palette.customBlue3?.main || theme.palette.primary.main} 0%, ${theme.palette.customBlue2?.main || '#006494'} 50%, ${theme.palette.customBlue1?.main || '#00A6FB'} 100%)`
            : `linear-gradient(135deg, ${theme.palette[color].main} 0%, ${theme.palette[color].dark} 100%)`,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          right: 0,
          width: '40%',
          height: '100%',
          background: (theme) => `linear-gradient(90deg, transparent 0%, ${theme.palette.secondary?.main || '#FF7700'}15 100%)`,
          pointerEvents: 'none'
        }
      }}
    >
      {/* Icon with background */}
      {Icon && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 48,
            height: 48,
            borderRadius: 2,
            bgcolor: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            ...(showAnimation && {
              animation: 'pulse 2s ease-in-out infinite',
              '@keyframes pulse': {
                '0%, 100%': { transform: 'scale(1)' },
                '50%': { transform: 'scale(1.05)' },
              },
            })
          }}
        >
          <Icon sx={{ fontSize: 28, color: 'common.white' }} />
        </Box>
      )}

      {/* Title and Subtitle Stack */}
      <Stack spacing={0.5} sx={{ flexGrow: 1, zIndex: 1 }}>
        <Typography 
          variant="h5" 
          sx={{ 
            color: 'common.white',
            fontWeight: 700,
            letterSpacing: -0.5,
            textShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography 
            variant="caption" 
            sx={{ 
              color: 'rgba(255,255,255,0.9)',
              fontWeight: 500,
              fontSize: '0.75rem',
              lineHeight: 1.4,
            }}
          >
            {subtitle}
          </Typography>
        )}
      </Stack>

      {/* Status Chip */}
      {showStatusChip && (
        <Chip
          icon={<TrendingUp sx={{ fontSize: 16 }} />}
          label="Attivo"
          size="small"
          sx={{
            bgcolor: (theme) => theme.palette.secondary?.main || '#FF7700',
            backdropFilter: 'blur(10px)',
            color: 'common.white',
            fontWeight: 600,
            border: '1px solid rgba(255, 255, 255, 0.4)',
            boxShadow: '0 2px 8px rgba(255, 119, 0, 0.3)',
            '& .MuiChip-icon': {
              color: 'common.white'
            }
          }}
        />
      )}
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
  showStatusChip: PropTypes.bool,
  sx: PropTypes.object,
};
