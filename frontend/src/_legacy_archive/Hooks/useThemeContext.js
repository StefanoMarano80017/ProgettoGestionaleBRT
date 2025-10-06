// Archived legacy theme hook. Use @shared/hooks/useThemeContext instead.
import React from 'react';
import { ThemeCtx } from '@/app/providers/ThemeProvider';
export function useThemeContext() { return React.useContext(ThemeCtx); }
export default useThemeContext;
