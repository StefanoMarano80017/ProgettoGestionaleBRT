import React from 'react';
import { ThemeCtx } from '@/Layouts/ThemeContext';

export function useThemeContext() {
  return React.useContext(ThemeCtx);
}

export default useThemeContext;
