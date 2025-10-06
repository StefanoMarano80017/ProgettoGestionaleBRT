import React, { useMemo, memo } from 'react';
import { Card, CardContent, Typography, Box, Chip } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import useAuth from '@/Hooks/useAuth';
import LogoGestionale from '@assets/LogoGestionale.png';
import { resolveBadgeData } from './utils/badgeUtils';
import PropTypes from 'prop-types';

/**
 * BadgeCard – visual identity card for a user/employee.
 *
 * Derives holder name, company id, and company logo from props with fallback to auth user.
 * Props precedence: explicit prop > user context > fallback.
 *
 * Implementation notes:
 * - Exported as a named `BadgeCard` and memoized as the default export to match project conventions.
 * - Uses `resolveBadgeData` (pure helper) and `useAuth` for current user fallback values.
 */
export function BadgeCard({
  holderName: holderNameProp,
  companyId: companyIdProp,
  company: companyProp,
  companyLogo: companyLogoProp,
  isBadgiato = false,
  sx = {},
}) {
  const { user } = useAuth();

  // Resolve all derived display data (memoized to avoid recompute on unrelated re-renders)
  const { holderName, companyId, companyKey, companyLogo } = useMemo(
    () =>
      resolveBadgeData({
        props: {
          holderName: holderNameProp,
          companyId: companyIdProp,
          companyLogo: companyLogoProp,
          company: companyProp,
        },
        user,
      }),
    [holderNameProp, companyIdProp, companyLogoProp, companyProp, user]
  );

  return (
    <Card
      sx={{
        width: 300,
        height: 160,
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'white',
        ...sx,
      }}
      elevation={3}
    >
  {/* Badging state (top-right) */}
      <Box
        sx={{
          position: 'absolute',
          top: 15,
          right: 15,
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          bgcolor: 'transparent',
          px: 0.5,
        }}
      >
        {isBadgiato ? (
          <>
            <CheckCircleIcon sx={{ color: 'success.main', fontSize: 20 }} />
            <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 600 }}> Marcato </Typography>
          </>
        ) : (
          <>
            <RadioButtonUncheckedIcon sx={{ color: 'primary.main', fontSize: 20 }} />
            <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 600 }}> Non marcato </Typography>
          </>
        )}
      </Box>

      {/* Company logo bottom-right (fallback -> chip) */}
      {companyLogo ? (
        <Box
          component="img"
          src={companyLogo}
          alt={companyKey || 'Azienda'}
          sx={{
            position: 'absolute',
            bottom: 10,
            right: 10,
            height: 24,
            objectFit: 'contain',
            pointerEvents: 'none',
          }}
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      ) : (
        <Chip
          label={companyKey || 'AZIENDA'}
          size="small"
          sx={{ position: 'absolute', bottom: 10, right: 10, borderRadius: 1 }}
        />
      )}

      {/* Title */}
      <Typography variant="subtitle2" color="customBlack.main" sx={{ position: 'absolute', top: 14, left: 14 }} > Badge Dipendente </Typography>

      <CardContent
        sx={{
          px: 2,
          py: 1,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
        }}
      >
        <Typography variant="subtitle1" sx={{ color: 'customBlue3.main' }}>
          {holderName || '—'}
        </Typography>
        <Typography variant="caption" sx={{ color: 'customBlue3.main' }}>
          {companyId || '—'}
        </Typography>
      </CardContent>

      {/* App logo bottom-left */}
      {LogoGestionale && (
        <Box
          component="img"
          src={LogoGestionale}
          alt="app logo"
          sx={{
            position: 'absolute',
            bottom: 8,
            left: 10,
            width: 30,
            height: 30,
            objectFit: 'contain',
            opacity: 0.95,
          }}
        />
      )}
    </Card>
  );
}

BadgeCard.propTypes = {
  holderName: PropTypes.string,
  companyId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  company: PropTypes.string,
  companyLogo: PropTypes.string,
  isBadgiato: PropTypes.bool,
  sx: PropTypes.object,
};

BadgeCard.displayName = 'BadgeCard';

export default memo(BadgeCard);
