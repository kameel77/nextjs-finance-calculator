import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    primary: {
      main: "#17418a"
    },
    secondary: {
      main: "#ffb400"
    },
    background: {
      default: "#f5f7fb"
    }
  },
  typography: {
    fontFamily: [
      "Roboto",
      "-apple-system",
      "BlinkMacSystemFont",
      '"Segoe UI"',
      "sans-serif"
    ].join(", ")
  },
  shape: {
    borderRadius: 10
  }
});
