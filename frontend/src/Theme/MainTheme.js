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
    background: { default: "#242424" },
    customGreen: { main: "#34C759" },
    customYellow: { main: "#FFCC00" },
    customRed: { main: "#FF3B30" }, 
    customBackground: { main: "#242424" },
  },
  typography: {
    fontFamily: `"Lato"`
  },
});
