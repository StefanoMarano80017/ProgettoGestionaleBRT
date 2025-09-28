import { createTheme } from "@mui/material/styles";

export const lightTheme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#0582CA" },
    secondary: { main: "#D8315B" },
    background: { default: "#FFFAFF" },
  },
});

export const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#0582CA" },
    secondary: { main: "#f48fb1" },
    background: { default: "#2C2C2C" },
  },
});
