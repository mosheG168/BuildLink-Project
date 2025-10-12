import * as React from "react";
import { AppBar, Toolbar, Typography, Button, Stack, Box } from "@mui/material";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useToast } from "../../hooks/useToast";

export default function Navbar() {
  const toast = useToast();
  const nav = useNavigate();
  const [authed, setAuthed] = React.useState(
    () => typeof window !== "undefined" && !!localStorage.getItem("token")
  );

  // Optional: react to cross-tab login/logout
  React.useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "token") setAuthed(!!e.newValue);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  if (!authed) return null; // show navbar only when logged in

  const handleLogout = () => {
    localStorage.removeItem("token");
    setAuthed(false);
    toast.info("Logged out");
    nav("/login");
  };

  return (
    <AppBar position="static" color="default" elevation={1}>
      <Toolbar sx={{ gap: 2 }}>
        <Typography
          variant="h6"
          component={RouterLink}
          to="/"
          sx={{ textDecoration: "none", color: "inherit", flexGrow: 1 }}
        >
          BuildLink
        </Typography>

        <Stack direction="row" spacing={1}>
          <Button component={RouterLink} to="/" color="inherit">
            Home
          </Button>
          {
            <Button component={RouterLink} to="/my-profile" color="inherit">
              Profile
            </Button>
          }
          {
            <Button component={RouterLink} to="/post_job" color="inherit">
              Create Job
            </Button>
          }
          {
            <Button component={RouterLink} to="/jobs" color="inherit">
              Jobs
            </Button>
          }
          {
            <Button component={RouterLink} to="/chat" color="inherit">
              Chat
            </Button>
          }
          {
            <Button component={RouterLink} to="/about" color="inherit">
              About
            </Button>
          }
          <Button onClick={handleLogout} variant="outlined">
            Logout
          </Button>
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
