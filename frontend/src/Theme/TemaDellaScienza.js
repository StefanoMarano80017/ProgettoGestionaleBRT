import { createTheme } from "@mui/material/styles";

export const lightTheme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#006DCA", dark: "#004F9D", contrastText: "#FFFFFF" },
    secondary: { main: "#E9425C", dark: "#C52C47", contrastText: "#FFFFFF" },
    background: { default: "#F5F6F8", paper: "#FFFFFF" },
    text: { primary: "#1D1D1F", secondary: "#5C5C5C" },
    success: { main: "#2BAF5A", contrastText: "#FFFFFF" },
    warning: { main: "#E8B600", contrastText: "#1E1E1E" },
    error: { main: "#E0342F", contrastText: "#FFFFFF" },
    info: { main: "#007CBE", contrastText: "#FFFFFF" },
  },
  typography: { fontFamily: `"Lato"` },
  customGradients: {
    primary: "linear-gradient(135deg, #007CBE 0%, #006DCA 100%)",
    secondary: "linear-gradient(135deg, #E9425C 0%, #C52C47 100%)",
  },
});

export const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#00A1E0", dark: "#007BB5", contrastText: "#1E1E1E" },
    secondary: { main: "#FF5F7A", dark: "#E2425C", contrastText: "#1E1E1E" },
    background: { default: "#121212", paper: "#1C1C1C" },
    text: { primary: "#FAFAFA", secondary: "#BBBBBB" },
    success: { main: "#3DDC84", contrastText: "#1E1E1E" },
    warning: { main: "#FFC107", contrastText: "#1E1E1E" },
    error: { main: "#FF4C40", contrastText: "#1E1E1E" },
    info: { main: "#42C8FF", contrastText: "#1E1E1E" },
  },
  typography: { fontFamily: `"Lato"` },
  customGradients: {
    primary: "linear-gradient(135deg, #42C8FF 0%, #00A1E0 100%)",
    secondary: "linear-gradient(135deg, #FF5F7A 0%, #E2425C 100%)",
  },
});

const getTheme = (mode = "light") => (mode === "dark" ? darkTheme : lightTheme);
export default getTheme;
