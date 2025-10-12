import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Paper, Stack, Avatar, Typography, Chip } from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import { inspectorCardBaseSx } from '../utils';

function HeaderCard({ employee, monthLabel, heroAvatarColor }) {
  const theme = useTheme();

  const heroGradient = useMemo(() => {
    const start = theme.palette.customBlue3?.main || theme.palette.primary.dark;
    const mid = theme.palette.customBlue2?.main || theme.palette.primary.main;
    const endBase = theme.palette.customBlue1?.main || theme.palette.primary.light;
    const end = alpha(heroAvatarColor || endBase, 0.9);
    return `linear-gradient(130deg, ${alpha(start, 0.98)} 0%, ${alpha(mid, 0.92)} 42%, ${end} 100%)`;
  }, [heroAvatarColor, theme]);

  return (
    <Paper
      elevation={0}
      sx={{
        ...inspectorCardBaseSx,
        color: 'common.white',
        borderColor: alpha(theme.palette.common.white, 0.18),
        backgroundImage: heroGradient,
        boxShadow: '0 28px 48px rgba(10, 18, 38, 0.32)'
      }}
    >
      <Stack spacing={2.25}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={{ xs: 1.75, sm: 2.5 }}
          alignItems={{ xs: 'flex-start', sm: 'center' }}
        >
          <Avatar
            sx={{
              width: 72,
              height: 72,
              fontSize: '1.6rem',
              fontWeight: 700,
              bgcolor: heroAvatarColor,
              color: theme.palette.getContrastText(heroAvatarColor),
              border: '3px solid rgba(255,255,255,0.35)',
              boxShadow: '0 12px 24px rgba(0,0,0,0.2)'
            }}
          >
            {(employee.nome?.[0] || '').toUpperCase()}
            {(employee.cognome?.[0] || '').toUpperCase()}
          </Avatar>
          <Stack spacing={0.6}>
            <Typography variant="overline" sx={{ letterSpacing: 1.8, color: alpha('#FFFFFF', 0.68) }}>
              Dipendente selezionato
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
              {employee.nome} {employee.cognome}
            </Typography>
          </Stack>
        </Stack>
        <Stack direction="row" spacing={0.75} flexWrap="wrap">
          <Chip
            label={`Azienda: ${employee.azienda || '—'}`}
            size="small"
            variant="outlined"
            sx={{
              color: 'inherit',
              borderColor: alpha('#FFFFFF', 0.35),
              '& .MuiChip-label': { px: 1.25 }
            }}
          />
          <Chip
            label={`Username: ${employee.username || employee.id}`}
            size="small"
            variant="outlined"
            sx={{
              color: 'inherit',
              borderColor: alpha('#FFFFFF', 0.35),
              '& .MuiChip-label': { px: 1.25 }
            }}
          />
          {employee.roles?.map((role) => (
            <Chip
              key={role}
              label={role}
              size="small"
              variant="outlined"
              sx={{
                color: 'inherit',
                borderColor: alpha('#FFFFFF', 0.35),
                '& .MuiChip-label': { px: 1.25 }
              }}
            />
          ))}
        </Stack>
        <Typography variant="body2" sx={{ color: alpha('#FFFFFF', 0.82), mt: 0.25 }}>
          Panoramica del mese di {monthLabel}. Usa i controlli rapidi per cambiare periodo o mettere a
          fuoco una singola giornata e confronta subito con il calendario principale.
        </Typography>
      </Stack>
    </Paper>
  );
}

HeaderCard.propTypes = {
  employee: PropTypes.shape({
    nome: PropTypes.string,
    cognome: PropTypes.string,
    azienda: PropTypes.string,
    username: PropTypes.string,
    id: PropTypes.string,
    roles: PropTypes.arrayOf(PropTypes.string)
  }).isRequired,
  monthLabel: PropTypes.string.isRequired,
  heroAvatarColor: PropTypes.string
};

HeaderCard.defaultProps = {
  heroAvatarColor: undefined
};

export default HeaderCard;
