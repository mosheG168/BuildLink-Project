import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Box, Paper, Stack, Typography, Button } from "@mui/material";
import api from "../../api/client";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "../../hooks/useToast";

export default function Home() {
  const toast = useToast();
  const nav = useNavigate();
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["me"],
    queryFn: async () => (await api.get("/users/me")).data,
    enabled: !!token, // only fetch if logged in
    retry: false,
  });

  const loggedIn = !!token;

  return (
    <Box
      sx={{ display: "grid", placeItems: "center", minHeight: "70vh", p: 2 }}
    >
      <Paper sx={{ p: 4, width: "100%", maxWidth: 800 }}>
        {!loggedIn && (
          <Stack spacing={2} alignItems="flex-start">
            <Typography variant="h4">Welcome 👋</Typography>
            <Typography variant="body1">
              Please <Link to="/login">log in</Link> or{" "}
              <Link to="/register">create an account</Link> to continue.
            </Typography>
            <Stack direction="row" spacing={2}>
              <Button variant="contained" onClick={() => nav("/login")}>
                Login
              </Button>
              <Button variant="outlined" onClick={() => nav("/register")}>
                Register
              </Button>
            </Stack>
          </Stack>
        )}

        {loggedIn && (
          <Stack spacing={2}>
            {isLoading && <Typography>Loading your profile…</Typography>}
            {isError && (
              <Typography color="error">
                Couldn’t load your profile. Try re-logging.
              </Typography>
            )}
            {data && (
              <>
                <Typography variant="h5">
                  Welcome back, {data?.name?.first} {data?.name?.last}!
                </Typography>
                <Typography variant="body1">
                  Role: {data?.isBusiness ? "Contractor" : "Subcontractor"}
                </Typography>
                {data?.email && (
                  <Typography variant="body2" color="text.secondary">
                    {data.email}
                  </Typography>
                )}
              </>
            )}
          </Stack>
        )}
      </Paper>
    </Box>
  );
}
