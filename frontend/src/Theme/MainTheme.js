import { createTheme } from "@mui/material/styles";

export const lightTheme = createTheme({
  palette: {
    mode: "light",
    // Primary/secondary mapped to custom tokens
    primary: { main: "#003554" }, // customBlue3
    secondary: { main: "#FF7700" }, // customOrange
    background: { default: "#f3f3f3ff" },
    customGreen: { main: "#34C759" },
    customYellow: { main: "#FFCC00" },
    customRed: { main: "#FF3B30" }, 
    customBackground: { main: "#FCFCFC" },
    customWhite: { main: "#FAFAFA" },
    customGray: { main: "#DADADA" },
    customBlack: { main: "#1E1E1E" },    
    customBlue1: { main: "#00A6FB" },
    customBlue2: { main: "#006494" },
    customBlue3: { main: "#003554" },
    customPink: { main: "#D8315B" },
    customOrange: { main: "#FF7700" },
    // text colors belong under palette.text so MUI components pick them up
    text: {
      primary: "#003554",
      secondary: "#2A2B2A",
    },
  },
  typography: { fontFamily: `"Lato"` },
});

// Ensure common component defaults/styles follow the palette tokens
lightTheme.components = {
  MuiCssBaseline: {
    styleOverrides: {
      body: {
        color: lightTheme.palette.text.primary,
        backgroundColor: lightTheme.palette.background.default,
      },
    },
  },
  MuiTypography: {
    styleOverrides: {
      root: {
        color: lightTheme.palette.text.primary,
      },
      body2: {
        color: lightTheme.palette.text.secondary,
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        color: lightTheme.palette.text.secondary,
      },
    },
  },
  MuiButton: {
    styleOverrides: {
      root: {
        color: lightTheme.palette.primary.main,
      },
      contained: {
        color: lightTheme.palette.text.secondary,
      },
      containedPrimary: {
        color: lightTheme.palette.text.secondary,
      },
    },
  },
};

export const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#0582CA" },
    secondary: { main: "#f48fb1" },
    background: { default: "#1E1E1E" },
    customGreen: { main: "#34C759" },
    customYellow: { main: "#FFCC00" },
    customRed: { main: "#FF3B30" }, 
    customBackground: { main: "#242424" },
    customWhite: { main: "#FAFAFA" },
    customGray: { main: "#DADADA" },
    customBlack: { main: "#1E1E1E" },
    customBlue1: { main: "#00A6FB" },
    customBlue2: { main: "#006494" },
    customBlue3: { main: "#003554" },
    customPink: { main: "#D8315B" },
    customOrange: { main: "#FF7700" },
    // text colors for dark theme should be under palette.text
    text: {
      primary: "#FCFCFC",
      secondary: "#2A2B2A",
    },
  },
  typography: { fontFamily: `"Lato"` },
});

// Component defaults for dark theme
darkTheme.components = {
  MuiCssBaseline: {
    styleOverrides: {
      body: {
        color: darkTheme.palette.text.primary,
        backgroundColor: darkTheme.palette.background.default,
      },
    },
  },
  MuiTypography: {
    styleOverrides: {
      root: {
        color: darkTheme.palette.text.primary,
      },
      body2: {
        color: darkTheme.palette.text.secondary,
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        color: darkTheme.palette.text.secondary,
      },
    },
  },
  MuiButton: {
    styleOverrides: {
      root: {
        color: darkTheme.palette.text.secondary,
      },
    },
  },
};

// Default export: pick theme by mode
const getTheme = (mode = "light") => (mode === "dark" ? darkTheme : lightTheme);
export default getTheme;
