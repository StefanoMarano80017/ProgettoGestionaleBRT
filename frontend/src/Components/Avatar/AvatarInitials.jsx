import React, { useMemo } from 'react';
import Box from '@mui/material/Box';
import { stringToColor, darkenColor } from './utils/color';

/**
 * AvatarInitials
 * Deterministic colored circular avatar displaying initials or custom text.
 *
 * Props:
 * - size?: number (default 40)
 * - name?: first name (optional if fullName provided)
 * - surname?: last name (optional if fullName provided)
 * - fullName?: alternative single prop (takes precedence over name+surname for deriving initials)
 * - text?: explicit text override (e.g. "+3")
 * - backgroundColor?: override computed background
 * - borderColor?: override computed border color
 * - style?: inline style passthrough
 * - ...rest: forwarded to root Box
 */
import PropTypes from 'prop-types';

/**
 * AvatarInitials
 * Deterministic colored circular avatar displaying initials or custom text.
 *
 * Props:
 * - size?: number (default 40)
 * - name?: first name (optional if fullName provided)
 * - surname?: last name (optional if fullName provided)
 * - fullName?: alternative single prop (takes precedence over name+surname for deriving initials)
 * - text?: explicit text override (e.g. "+3")
 * - backgroundColor?: override computed background
 * - borderColor?: override computed border color
 * - style?: inline style passthrough
 */
export function AvatarInitials({
  size = 40,
  name = '',
  surname = '',
  fullName,
  text,
  backgroundColor,
  borderColor,
  style,
  ...rest
}) {
  const { displayText, bgColor, bColor, borderWidth } = useMemo(() => {
    const sourceName = fullName || `${name} ${surname}`.trim();
    const initials = text != null
      ? text
      : (() => {
          const parts = sourceName.split(/\s+/).filter(Boolean);
          if (parts.length === 0) return '';
          if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
          return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
        })();
    const computedBg = backgroundColor || stringToColor(sourceName || name + surname);
    const computedBorder = borderColor || darkenColor(computedBg, 0.3);
    return {
      displayText: initials,
      bgColor: computedBg,
      bColor: computedBorder,
      borderWidth: Math.max(2, Math.round(size * 0.1)),
    };
  }, [backgroundColor, borderColor, fullName, name, surname, text, size]);

  return (
    <Box
      component="div"
      role="img"
      aria-label={displayText ? `Avatar ${displayText}` : 'Avatar'}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        border: `${borderWidth}px solid ${bColor}`,
        width: size,
        height: size,
        overflow: 'hidden',
        fontWeight: 'bold',
        fontSize: Math.round(size * 0.4),
        color: '#fff',
        backgroundColor: bgColor,
        userSelect: 'none',
        lineHeight: 1,
      }}
      style={style}
      {...rest}
    >
      {displayText}
    </Box>
  );
}

AvatarInitials.propTypes = {
  size: PropTypes.number,
  name: PropTypes.string,
  surname: PropTypes.string,
  fullName: PropTypes.string,
  text: PropTypes.string,
  backgroundColor: PropTypes.string,
  borderColor: PropTypes.string,
  style: PropTypes.object,
};

export default React.memo(AvatarInitials);
