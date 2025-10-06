import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import App from "./App.jsx";
import { ToastProvider } from "./hooks/useToast.jsx";

const qc = new QueryClient();

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#8b5cf6",
      light: "#a78bfa",
      dark: "#7c3aed",
    },
    secondary: {
      main: "#ec4899",
      light: "#f472b6",
      dark: "#db2777",
    },
    background: {
      default: "#0f0f23",
      paper: "rgba(30, 30, 60, 0.6)",
    },
    text: {
      primary: "#f8fafc",
      secondary: "#cbd5e1",
    },
  },
  typography: {
    fontFamily: '"Inter", "Segoe UI", "Roboto", sans-serif',
    h5: {
      fontWeight: 700,
      letterSpacing: "-0.02em",
    },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background:
            "linear-gradient(135deg, #0f0f23 0%, #1a1a3e 50%, #0f0f23 100%)",
          backgroundAttachment: "fixed",
          position: "relative",
          "&::before": {
            content: '""',
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `
              radial-gradient(circle at 20% 30%, rgba(139, 92, 246, 0.15) 0%, transparent 50%),
              radial-gradient(circle at 80% 70%, rgba(236, 72, 153, 0.15) 0%, transparent 50%)
            `,
            pointerEvents: "none",
            animation: "pulse 8s ease-in-out infinite",
          },
          "@keyframes pulse": {
            "0%, 100%": { opacity: 1 },
            "50%": { opacity: 0.8 },
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backgroundColor: "rgba(30, 30, 60, 0.4)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(139, 92, 246, 0.2)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            backgroundColor: "rgba(15, 15, 35, 0.5)",
            transition: "all 0.3s ease",
            "&:hover": {
              backgroundColor: "rgba(15, 15, 35, 0.7)",
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "rgba(139, 92, 246, 0.5)",
              },
            },
            "&.Mui-focused": {
              backgroundColor: "rgba(15, 15, 35, 0.8)",
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "#8b5cf6",
                borderWidth: "2px",
              },
            },
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
          fontSize: "1rem",
          padding: "12px 24px",
          boxShadow: "none",
          transition: "all 0.3s ease",
        },
        contained: {
          background: "linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)",
          "&:hover": {
            background: "linear-gradient(135deg, #7c3aed 0%, #db2777 100%)",
            transform: "translateY(-2px)",
            boxShadow: "0 8px 24px rgba(139, 92, 246, 0.4)",
          },
          "&:active": {
            transform: "translateY(0)",
          },
          "&.Mui-disabled": {
            background: "rgba(139, 92, 246, 0.3)",
            color: "rgba(248, 250, 252, 0.5)",
          },
        },
      },
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <ToastProvider>
            <App />
          </ToastProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
