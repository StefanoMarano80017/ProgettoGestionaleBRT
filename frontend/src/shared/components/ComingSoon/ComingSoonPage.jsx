// src/shared/components/ComingSoon/ComingSoonPage.jsx
import React from 'react';
import { 
  Container, 
  Box, 
  Typography, 
  Paper, 
  Alert,
  Stack,
  Chip
} from '@mui/material';
import ConstructionIcon from '@mui/icons-material/Construction';
import PropTypes from 'prop-types';
import { PageHero } from '@shared/components/PageHeader/';

/**
 * ComingSoonPage - Reusable placeholder page for features in development
 * Displays hero, alert, and feature list
 */
export default function ComingSoonPage({ 
  title, 
  subtitle, 
  icon: Icon,
  features = [],
  color = 'secondary'
}) {
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ minHeight: 'calc(100vh - 300px)' }}>
        {/* Header */}
        <PageHero 
          title={title}
          subtitle={subtitle}
          icon={Icon}
          color={color}
        />

        {/* Coming Soon Alert */}
        <Alert 
          severity="info" 
          icon={<ConstructionIcon fontSize="inherit" />}
          sx={{ 
            mb: 3,
            borderRadius: 2,
            '& .MuiAlert-message': {
              width: '100%',
            }
          }}
        >
          <Stack spacing={1}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Funzionalità in sviluppo
            </Typography>
            <Typography variant="body2">
              Questo modulo è attualmente in fase di sviluppo. 
              Presto saranno disponibili le seguenti funzionalità:
            </Typography>
          </Stack>
        </Alert>

        {/* Feature Preview */}
        {features.length > 0 && (
          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
              Funzionalità previste
            </Typography>
            
            <Stack spacing={2}>
              {features.map((feature, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <Chip 
                    label={feature.emoji || '📌'} 
                    size="small" 
                    sx={{ minWidth: 40, fontSize: '1.2rem' }} 
                  />
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {feature.description}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Stack>
          </Paper>
        )}
      </Box>
    </Container>
  );
}

ComingSoonPage.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string.isRequired,
  icon: PropTypes.elementType.isRequired,
  features: PropTypes.arrayOf(
    PropTypes.shape({
      emoji: PropTypes.string,
      title: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
    })
  ),
  color: PropTypes.oneOf(['primary', 'secondary', 'error', 'warning', 'info', 'success']),
};
