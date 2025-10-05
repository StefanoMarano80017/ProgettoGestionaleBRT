import React from 'react';
import { getStatusIconInfo } from './statusIcons.utils.js';

/**
 * Small presentational component wrapper so this file only exports components
 * (satisfies react-refresh rule). Prefer importing helpers from
 * `statusIcons.utils.js` directly when you need the raw helper.
 */
export default function StatusIcon({ theme, status, size = 'small' }) {
  const { Icon, props } = getStatusIconInfo(theme, status, size) || {};
  if (!Icon) return null;
  return <Icon {...props} />;
}

StatusIcon.displayName = 'StatusIcon';

