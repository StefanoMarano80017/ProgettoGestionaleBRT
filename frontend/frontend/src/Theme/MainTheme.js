import { createTheme } from "@mui/material/styles";

export const lightTheme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#3E92CC" },
    secondary: { main: "#D8315B" },
    background: { default: "#FFFAFF" },
  },
});

export const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#90caf9" },
    secondary: { main: "#f48fb1" },
    background: { default: "#1E1B18" },
  },
});
