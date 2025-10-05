import React from 'react';
import { ThemeCtx } from '@layouts/ThemeContext';

export function useThemeContext() {
  return React.useContext(ThemeCtx);
}

export default useThemeContext;
