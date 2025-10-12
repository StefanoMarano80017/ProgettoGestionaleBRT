import React from 'react';
import { Box, Chip, Typography, Stack, Paper, Divider } from '@mui/material';
import PropTypes from 'prop-types';
import { 
  CheckCircle, 
  RadioButtonUnchecked, 
  AccessTime,
  Login,
  Logout,
  FlightTakeoff,
  FlightLand,
  Restaurant,
  Coffee
} from '@mui/icons-material';

/**
 * Get icon and color for badge type
 */
const getBadgeTypeConfig = (type) => {
  const configs = {
    'ENTRATA': { icon: Login, color: 'success', label: 'Entrata' },
    'USCITA': { icon: Logout, color: 'error', label: 'Uscita' },
    'TRASFERTA_IN': { icon: FlightTakeoff, color: 'info', label: 'Trasferta In' },
    'TRASFERTA_OUT': { icon: FlightLand, color: 'info', label: 'Trasferta Out' },
    'PAUSA_PRANZO_INIZIO': { icon: Restaurant, color: 'warning', label: 'Pranzo Inizio' },
    'PAUSA_PRANZO_FINE': { icon: Restaurant, color: 'warning', label: 'Pranzo Fine' },
    'BREAK_INIZIO': { icon: Coffee, color: 'default', label: 'Break Inizio' },
    'BREAK_FINE': { icon: Coffee, color: 'default', label: 'Break Fine' }
  };
  
  return configs[type] || { icon: AccessTime, color: 'default', label: 'Badge' };
};

/**
 * BadgeCompact - Enhanced badge status indicator
 * Shows badge status with detailed information in a compact, modern design
 */
export function BadgeCompact({ 
  isBadgiato = false, 
  badgeNumber, 
  lastBadgeTime, 
  lastBadgeType,
  lastBadgeLabel,
  width = 420
}) {
  const formatTime = () => {
    if (!lastBadgeTime) return '--:--';
    
    try {
      const date = new Date(lastBadgeTime);
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    } catch {
      return '--:--';
    }
  };

  const formatDate = () => {
    if (!lastBadgeTime) return '--/--';
    
    try {
      const date = new Date(lastBadgeTime);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      return `${day}/${month}`;
    } catch {
      return '--/--';
    }
  };

  const typeConfig = getBadgeTypeConfig(lastBadgeType);
  const displayLabel = lastBadgeLabel || typeConfig.label;
  const TypeIcon = typeConfig.icon;
  const statusColor = isBadgiato ? 'success' : 'text.secondary';
  const StatusIcon = isBadgiato ? CheckCircle : RadioButtonUnchecked;

  return (
    <Paper
      elevation={2}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        px: 2,
        py: 1,
        borderRadius: 2,
        bgcolor: 'background.paper',
        border: '1px solid',
  borderColor: isBadgiato ? 'success.main' : 'divider',
  width: { xs: '100%', md: width },
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          boxShadow: 4,
          transform: 'translateY(-2px)',
          borderColor: isBadgiato ? 'success.dark' : 'primary.main'
        }
      }}
    >
      {/* Status Icon */}
      <StatusIcon 
        sx={{ 
          fontSize: 24, 
          color: statusColor,
          transition: 'color 0.3s'
        }} 
      />

      <Divider orientation="vertical" flexItem sx={{ my: 0.5 }} />

      {/* Badge Info Section */}
      <Stack spacing={0.25} sx={{ minWidth: 100 }}>
        <Typography 
          variant="caption" 
          sx={{ 
            fontSize: '0.65rem',
            color: 'text.secondary',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            fontWeight: 600
          }}
        >
          Badge
        </Typography>
        <Typography 
          variant="body2" 
          sx={{ 
            fontWeight: 600,
            color: 'text.primary',
            fontSize: '0.875rem'
          }}
        >
          {badgeNumber || 'N/A'}
        </Typography>
      </Stack>

      <Divider orientation="vertical" flexItem sx={{ my: 0.5 }} />

      {/* Last Badge Section */}
      <Stack spacing={0.25} sx={{ minWidth: 80 }}>
        <Typography 
          variant="caption" 
          sx={{ 
            fontSize: '0.65rem',
            color: 'text.secondary',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            fontWeight: 600
          }}
        >
          Ultima
        </Typography>
        <Stack direction="row" spacing={0.5} alignItems="center">
          <Typography 
            variant="body2" 
            sx={{ 
              fontWeight: 700,
              color: statusColor,
              fontSize: '0.95rem',
              fontFamily: 'monospace'
            }}
          >
            {formatTime()}
          </Typography>
          <Typography 
            variant="caption" 
            sx={{ 
              color: 'text.secondary',
              fontSize: '0.7rem'
            }}
          >
            {formatDate()}
          </Typography>
        </Stack>
      </Stack>

      {/* Badge Type Chip */}
      {lastBadgeType && (
        <>
          <Divider orientation="vertical" flexItem sx={{ my: 0.5 }} />
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              flex: 1,
              minWidth: 0
            }}
          >
            <Chip
              icon={<TypeIcon sx={{ fontSize: 16 }} />}
              label={displayLabel}
              size="small"
              color={typeConfig.color}
              sx={{
                height: 24,
                fontSize: '0.7rem',
                fontWeight: 600,
                '& .MuiChip-icon': {
                  fontSize: 16
                }
              }}
            />
          </Box>
        </>
      )}
    </Paper>
  );
}

BadgeCompact.propTypes = {
  isBadgiato: PropTypes.bool,
  badgeNumber: PropTypes.string,
  lastBadgeTime: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
  lastBadgeType: PropTypes.string,
  lastBadgeLabel: PropTypes.string,
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
};

BadgeCompact.displayName = 'BadgeCompact';

export default BadgeCompact;
