// src/shared/components/Stats/StatCard.jsx
import React from 'react';
import { Paper, Box, Typography, alpha } from '@mui/material';
import PropTypes from 'prop-types';

/**
 * StatCard - Reusable stat card component for dashboards
 * Displays a metric with label, value, and optional icon
 */
export default function StatCard({ 
  label, 
  value, 
  icon: Icon, 
  color = 'primary',
  badge,
  valueVariant = 'h4',
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        transition: 'all 0.3s ease',
        height: '100%',
        '&:hover': {
          borderColor: `${color}.main`,
          boxShadow: (theme) => `0 4px 20px ${alpha(theme.palette[color].main, 0.15)}`,
          transform: 'translateY(-4px)',
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
          {label}
        </Typography>
        {Icon && <Icon sx={{ color: `${color}.main`, fontSize: 20 }} />}
        {badge && badge}
      </Box>
      <Typography 
        variant={valueVariant} 
        sx={{ 
          fontWeight: 700, 
          color: valueVariant === 'h4' ? `${color}.main` : 'text.primary',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: valueVariant === 'body1' ? 'nowrap' : 'normal',
        }}
      >
        {value}
      </Typography>
    </Paper>
  );
}

StatCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  icon: PropTypes.elementType,
  color: PropTypes.oneOf(['primary', 'secondary', 'error', 'warning', 'info', 'success']),
  badge: PropTypes.node,
  valueVariant: PropTypes.string,
};
