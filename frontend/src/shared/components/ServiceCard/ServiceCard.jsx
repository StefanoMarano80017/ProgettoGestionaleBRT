// src/shared/components/ServiceCard/ServiceCard.jsx
import React from 'react';
import { Card, CardContent, Box, Typography, alpha } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PropTypes from 'prop-types';

/**
 * ServiceCard - Reusable service card for navigation
 * Displays service icon, title, description with hover animations
 */
export default function ServiceCard({ 
  title, 
  description, 
  path, 
  icon: Icon 
}) {
  return (
    <Card
      component={RouterLink}
      to={path}
      elevation={0}
      sx={{
        textDecoration: "none",
        height: '100%',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          bgcolor: 'primary.main',
          transform: 'scaleX(0)',
          transformOrigin: 'left',
          transition: 'transform 0.3s ease',
        },
        "&:hover": {
          transform: "translateY(-8px)",
          boxShadow: (theme) => `0 12px 28px ${alpha(theme.palette.primary.main, 0.2)}`,
          borderColor: 'primary.main',
          '&::before': {
            transform: 'scaleX(1)',
          },
          '& .icon-container': {
            transform: 'scale(1.1) rotate(5deg)',
            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.15),
          },
          '& .arrow-icon': {
            transform: 'translateX(4px)',
          },
        },
      }}
    >
      <CardContent sx={{ p: 4 }}>
        {/* Icon Container */}
        <Box
          className="icon-container"
          sx={{
            width: 80,
            height: 80,
            borderRadius: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
            color: 'primary.main',
            mb: 3,
            transition: 'all 0.3s ease',
          }}
        >
          {Icon && <Icon sx={{ fontSize: 48 }} />}
        </Box>

        {/* Title and Description */}
        <Box sx={{ mb: 2 }}>
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 700,
              color: 'text.primary',
              mb: 1,
            }}
          >
            {title}
          </Typography>
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ lineHeight: 1.6 }}
          >
            {description}
          </Typography>
        </Box>

        {/* Action Link */}
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 0.5,
            color: 'primary.main',
            fontWeight: 600,
            fontSize: '0.875rem',
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Apri applicazione
          </Typography>
          <ArrowForwardIcon 
            className="arrow-icon"
            sx={{ 
              fontSize: 18,
              transition: 'transform 0.3s ease',
            }} 
          />
        </Box>
      </CardContent>
    </Card>
  );
}

ServiceCard.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  path: PropTypes.string.isRequired,
  icon: PropTypes.elementType,
};
