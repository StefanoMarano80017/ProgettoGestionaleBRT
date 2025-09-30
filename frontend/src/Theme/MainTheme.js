import { createTheme } from "@mui/material/styles";

export const lightTheme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#0582CA" },
    secondary: { main: "#D8315B" },
    background: { default: "#FFFAFF" },
    customGreen: { main: "#34C759" },
    customYellow: { main: "#FFCC00" },
    customRed: { main: "#FF3B30" }, 
    customBackground: { main: "#242424" },
    customWhite: { main: "#FAFAFA" },
    customGray: { main: "#DADADA" },
    customBlack: { main: "#1E1E1E" },
  },
  typography: {
    fontFamily: `"Lato"`
  },
});

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
  },
  typography: {
    fontFamily: `"Lato"`
  },
});
