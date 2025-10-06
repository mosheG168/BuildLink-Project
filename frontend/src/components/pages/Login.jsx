import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "../../hooks/useToast";
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Stack,
  Fade,
  styled,
} from "@mui/material";
import { loginUser } from "../../api/auth";
import { useNavigate, Link } from "react-router-dom";

const schema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

const AnimatedPaper = styled(Paper)(({ theme }) => ({
  position: "relative",
  overflow: "hidden",
  "&::before": {
    content: '""',
    position: "absolute",
    top: "-50%",
    left: "-50%",
    width: "200%",
    height: "200%",
    background: `
      radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%)
    `,
    animation: "rotate 20s linear infinite",
  },
  "@keyframes rotate": {
    "0%": { transform: "rotate(0deg)" },
    "100%": { transform: "rotate(360deg)" },
  },
}));

const StyledLink = styled(Link)(({ theme }) => ({
  color: theme.palette.primary.light,
  textDecoration: "none",
  fontWeight: 600,
  transition: "all 0.2s ease",
  "&:hover": {
    color: theme.palette.primary.main,
    textDecoration: "underline",
  },
}));

const GlowingBox = styled(Box)({
  position: "relative",
  "&::before": {
    content: '""',
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "600px",
    height: "600px",
    background:
      "radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, transparent 70%)",
    pointerEvents: "none",
    animation: "pulse 4s ease-in-out infinite",
  },
  "@keyframes pulse": {
    "0%, 100%": {
      opacity: 0.5,
      transform: "translate(-50%, -50%) scale(1)",
    },
    "50%": {
      opacity: 0.8,
      transform: "translate(-50%, -50%) scale(1.1)",
    },
  },
});

export default function Login() {
  const nav = useNavigate();
  const toast = useToast();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    resetField,
    trigger,
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
    mode: "onChange",
  });

  const liveRef = React.useRef({ email: false, password: false });

  const lv = (name) => {
    const base = register(name);
    return {
      ...base,
      onChange: async (e) => {
        base.onChange(e);
        if (!liveRef.current[name]) liveRef.current[name] = true;
        const ok = await trigger(name);
        if (ok) liveRef.current[name] = false;
      },
    };
  };

  const onSubmit = async (form) => {
    try {
      await loginUser(form);
      toast.success("Welcome back!");
      nav("/");
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "Invalid credentials";
      setError("root", { type: "server", message: msg });
      toast.error(msg);
      resetField("password");
      liveRef.current.password = true;
      await trigger("password");
    }
  };

  return (
    <GlowingBox
      sx={{
        display: "grid",
        placeItems: "center",
        minHeight: "70vh",
        p: 2,
      }}
    >
      <Fade in={mounted} timeout={800}>
        <AnimatedPaper
          sx={{
            p: { xs: 3, sm: 5 },
            width: "100%",
            maxWidth: 440,
            position: "relative",
          }}
        >
          <Box sx={{ position: "relative", zIndex: 1 }}>
            <Typography
              variant="h5"
              gutterBottom
              sx={{
                background: "linear-gradient(135deg, #a78bfa 0%, #f472b6 100%)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                mb: 1,
                fontSize: { xs: "1.75rem", sm: "2rem" },
              }}
            >
              Welcome Back
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", mb: 4 }}>
              Sign in to continue to your account
            </Typography>

            <Stack
              component="form"
              onSubmit={handleSubmit(onSubmit)}
              spacing={2.5}
            >
              <TextField
                label="Email"
                type="email"
                {...lv("email")}
                error={!!errors.email}
                helperText={errors.email?.message}
                autoComplete="username"
                fullWidth
              />
              <TextField
                label="Password"
                type="password"
                {...lv("password")}
                error={!!errors.password}
                helperText={errors.password?.message}
                autoComplete="current-password"
                fullWidth
              />

              {errors.root?.message && (
                <Box
                  sx={{
                    p: 2,
                    bgcolor: "rgba(239, 68, 68, 0.1)",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    borderRadius: 2,
                  }}
                >
                  <Typography color="error" variant="body2">
                    {errors.root.message}
                  </Typography>
                </Box>
              )}

              <Button
                type="submit"
                variant="contained"
                disabled={isSubmitting}
                fullWidth
                size="large"
                sx={{ mt: 1 }}
              >
                {isSubmitting ? "Signing in..." : "Sign In"}
              </Button>

              <Box sx={{ textAlign: "center", mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Don't have an account?{" "}
                  <StyledLink to="/register">Create one</StyledLink>
                </Typography>
              </Box>
            </Stack>
          </Box>
        </AnimatedPaper>
      </Fade>
    </GlowingBox>
  );
}
