import React, { useMemo, useState } from "react";
import { ThemeProvider as MUIThemeProvider, CssBaseline, createTheme, useMediaQuery } from "@mui/material";
import appTheme from "@/shared/theme/MainTheme";

// Renamed from app/layouts/ThemeContext.jsx to app/providers/ThemeProvider.jsx
// eslint-disable-next-line react-refresh/only-export-components
export const ThemeCtx = React.createContext(null);

export function ThemeProvider({ children }) {
  const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");
  const [mode, setMode] = useState(() => localStorage.getItem("themeMode") || (prefersDark ? "dark" : "light"));

  const toggleTheme = () => {
    setMode((m) => {
      const next = m === "light" ? "dark" : "light";
      localStorage.setItem("themeMode", next);
      return next;
    });
  };

  const muiTheme = useMemo(() => {
    if (typeof appTheme === "function") return appTheme(mode);
    if (appTheme && typeof appTheme.getTheme === "function") return appTheme.getTheme(mode);
    return createTheme({ palette: { mode } });
  }, [mode]);

  return (
    <ThemeCtx.Provider value={{ mode, toggleTheme, setMode }}>
      <MUIThemeProvider theme={muiTheme}>
        <CssBaseline />
        {children}
      </MUIThemeProvider>
    </ThemeCtx.Provider>
  );
}

export default ThemeProvider;
