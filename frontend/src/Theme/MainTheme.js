import { createTheme, alpha } from "@mui/material/styles";

export const lightTheme = createTheme({
  palette: {
    mode: "light",
    // Primary/secondary mapped to custom tokens
    primary: { main: "#003554" }, // customBlue3
    secondary: { main: "#FF7700" }, // customOrange
    background: { default: "#f3f3f3ff", paper: "#FFFFFF" },
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
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: `"Lato"`,
    fontWeightRegular: 400,
    fontWeightMedium: 600,
    fontWeightBold: 700,
    h1: { fontSize: "2.25rem", fontWeight: 700, lineHeight: 1.2 },
    h2: { fontSize: "1.875rem", fontWeight: 700, lineHeight: 1.25 },
    h3: { fontSize: "1.5rem", fontWeight: 700, lineHeight: 1.3 },
    h4: { fontSize: "1.375rem", fontWeight: 700, lineHeight: 1.35 },
    h5: { fontSize: "1.25rem", fontWeight: 700, lineHeight: 1.4 },
    h6: { fontSize: "1.125rem", fontWeight: 700, lineHeight: 1.4 },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 600 },
    button: { textTransform: "none", letterSpacing: 0.3 },
  },
});

// Ensure common component defaults/styles follow the palette tokens
lightTheme.components = {
  MuiCssBaseline: {
    styleOverrides: {
      body: {
        color: lightTheme.palette.text.primary,
        backgroundColor: lightTheme.palette.background.default,
      },
      a: {
        color: lightTheme.palette.primary.main,
        textDecoration: "none",
      },
    },
  },
  MuiAppBar: {
    styleOverrides: {
      colorPrimary: {
        backgroundColor: lightTheme.palette.customBackground.main,
        color: lightTheme.palette.text.primary,
        boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
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
  MuiPaper: {
    defaultProps: { elevation: 1 },
    styleOverrides: {
      root: {
        backgroundImage: "none",
        borderRadius: lightTheme.shape.borderRadius,
      },
    },
  },
  MuiCard: {
    defaultProps: { elevation: 1 },
    styleOverrides: {
      root: {
        borderRadius: lightTheme.shape.borderRadius,
        backgroundColor: lightTheme.palette.background.paper,
      },
    },
  },
  MuiDrawer: {
    styleOverrides: {
      paper: {
        backgroundColor: lightTheme.palette.customBackground.main,
        borderRight: `1px solid ${alpha(lightTheme.palette.customBlack.main, 0.08)}`,
      },
    },
  },
  MuiListItemButton: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        '&.Mui-selected': {
          backgroundColor: alpha(lightTheme.palette.primary.main, 0.10),
          color: lightTheme.palette.primary.main,
        },
        '&:hover': {
          backgroundColor: alpha(lightTheme.palette.primary.main, 0.08),
        },
      },
    },
  },
  MuiIconButton: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        '&:hover': {
          backgroundColor: alpha(lightTheme.palette.primary.main, 0.10),
        },
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        color: lightTheme.palette.text.secondary,
        borderRadius: 8,
        backgroundColor: alpha(lightTheme.palette.primary.main, 0.06),
      },
    },
  },
  MuiButton: {
    styleOverrides: {
      root: {
        color: lightTheme.palette.primary.main,
        borderRadius: 8,
      },
      contained: {
        color: lightTheme.palette.text.secondary,
        boxShadow: "none",
        '&:hover': { boxShadow: "none" },
      },
      containedPrimary: {
        color: lightTheme.palette.text.secondary,
      },
    },
  },
  MuiOutlinedInput: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        '& .MuiOutlinedInput-notchedOutline': {
          borderColor: alpha(lightTheme.palette.customBlack.main, 0.12),
        },
        '&:hover .MuiOutlinedInput-notchedOutline': {
          borderColor: alpha(lightTheme.palette.primary.main, 0.40),
        },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
          borderColor: lightTheme.palette.primary.main,
          borderWidth: 2,
        },
      },
    },
  },
  MuiInputLabel: {
    styleOverrides: {
      root: {
        '&.Mui-focused': { color: lightTheme.palette.primary.main },
      },
    },
  },
  MuiTabs: {
    styleOverrides: {
      indicator: { backgroundColor: lightTheme.palette.primary.main },
    },
  },
  MuiTab: {
    styleOverrides: {
      root: {
        textTransform: "none",
        '&.Mui-selected': { color: lightTheme.palette.primary.main },
      },
    },
  },
};

export const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#00A6FB" }, // customBlue1 for crisp accents
    secondary: { main: "#FF7700" }, // keep brand orange as secondary
    background: { default: "#1E1E1E", paper: "#242424" },
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
      secondary: "rgba(255, 255, 255, 0.7)",
    },
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: `"Lato"`,
    fontWeightRegular: 400,
    fontWeightMedium: 600,
    fontWeightBold: 700,
    h1: { fontSize: "2.25rem", fontWeight: 700, lineHeight: 1.2 },
    h2: { fontSize: "1.875rem", fontWeight: 700, lineHeight: 1.25 },
    h3: { fontSize: "1.5rem", fontWeight: 700, lineHeight: 1.3 },
    h4: { fontSize: "1.375rem", fontWeight: 700, lineHeight: 1.35 },
    h5: { fontSize: "1.25rem", fontWeight: 700, lineHeight: 1.4 },
    h6: { fontSize: "1.125rem", fontWeight: 700, lineHeight: 1.4 },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 600 },
    button: { textTransform: "none", letterSpacing: 0.3 },
  },
});

// Component defaults for dark theme
darkTheme.components = {
  MuiCssBaseline: {
    styleOverrides: {
      body: {
        color: darkTheme.palette.text.primary,
        backgroundColor: darkTheme.palette.background.default,
      },
      a: {
        color: darkTheme.palette.primary.main,
        textDecoration: "none",
      },
    },
  },
  MuiAppBar: {
    styleOverrides: {
      colorPrimary: {
        backgroundColor: darkTheme.palette.customBackground.main,
        color: darkTheme.palette.text.primary,
        boxShadow: "0 1px 2px rgba(0,0,0,0.4)",
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
  MuiPaper: {
    defaultProps: { elevation: 1 },
    styleOverrides: {
      root: {
        backgroundImage: "none",
        borderRadius: darkTheme.shape.borderRadius,
        backgroundColor: darkTheme.palette.background.paper,
      },
    },
  },
  MuiCard: {
    defaultProps: { elevation: 1 },
    styleOverrides: {
      root: {
        borderRadius: darkTheme.shape.borderRadius,
        backgroundColor: darkTheme.palette.background.paper,
      },
    },
  },
  MuiDrawer: {
    styleOverrides: {
      paper: {
        backgroundColor: darkTheme.palette.customBackground.main,
        borderRight: `1px solid ${alpha(darkTheme.palette.customWhite.main, 0.06)}`,
      },
    },
  },
  MuiListItemButton: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        '&.Mui-selected': {
          backgroundColor: alpha(darkTheme.palette.primary.main, 0.18),
          color: darkTheme.palette.primary.main,
        },
        '&:hover': {
          backgroundColor: alpha(darkTheme.palette.primary.main, 0.14),
        },
      },
    },
  },
  MuiIconButton: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        '&:hover': {
          backgroundColor: alpha(darkTheme.palette.primary.main, 0.18),
        },
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        color: darkTheme.palette.text.secondary,
        borderRadius: 8,
        backgroundColor: alpha(darkTheme.palette.primary.main, 0.10),
      },
    },
  },
  MuiButton: {
    styleOverrides: {
      root: {
        color: darkTheme.palette.primary.main,
        borderRadius: 8,
      },
      contained: {
        color: darkTheme.palette.text.primary,
        boxShadow: "none",
        '&:hover': { boxShadow: "none" },
      },
    },
  },
  MuiOutlinedInput: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        '& .MuiOutlinedInput-notchedOutline': {
          borderColor: alpha(darkTheme.palette.customWhite.main, 0.12),
        },
        '&:hover .MuiOutlinedInput-notchedOutline': {
          borderColor: alpha(darkTheme.palette.primary.main, 0.5),
        },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
          borderColor: darkTheme.palette.primary.main,
          borderWidth: 2,
        },
      },
    },
  },
  MuiInputLabel: {
    styleOverrides: {
      root: {
        '&.Mui-focused': { color: darkTheme.palette.primary.main },
      },
    },
  },
  MuiTabs: {
    styleOverrides: {
      indicator: { backgroundColor: darkTheme.palette.primary.main },
    },
  },
  MuiTab: {
    styleOverrides: {
      root: {
        textTransform: "none",
        '&.Mui-selected': { color: darkTheme.palette.primary.main },
      },
    },
  },
};

// Default export: pick theme by mode
const getTheme = (mode = "light") => (mode === "dark" ? darkTheme : lightTheme);
export default getTheme;
