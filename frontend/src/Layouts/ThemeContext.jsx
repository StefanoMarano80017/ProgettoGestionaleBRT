// src/context/ThemeContext.jsx
import { createContext, useContext, useState, useMemo } from "react";
import { ThemeProvider as MuiThemeProvider, useMediaQuery } from "@mui/material";
import { lightTheme, darkTheme } from "../Theme/MainTheme";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  // Rileva preferenza utente dal sistema
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  const [darkMode, setDarkMode] = useState(prefersDarkMode);

  // Calcola il tema corrente
  const theme = useMemo(() => (darkMode ? darkTheme : lightTheme), [darkMode]);

  const toggleTheme = () => setDarkMode((prev) => !prev);

  return (
    <ThemeContext.Provider value={{ darkTheme, toggleTheme }}>
      <MuiThemeProvider theme={theme}>{children}</MuiThemeProvider>
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  return useContext(ThemeContext);
}
