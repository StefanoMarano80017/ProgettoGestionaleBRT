import React from 'react';
// Updated to reference new provider location directly (was pointing at deprecated layouts path)
import { ThemeCtx } from '@/app/providers/ThemeProvider';

export function useThemeContext() {
	return React.useContext(ThemeCtx);
}

export default useThemeContext;