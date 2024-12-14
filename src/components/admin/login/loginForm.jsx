"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  InputAdornment,
  IconButton,
  Alert,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { adminService } from "@/lib/adminService";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import Cookies from "js-cookie";

export default function AdminLoginForm() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setAdmin } = useAdminAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await adminService.login(formData.email, formData.password);
      
      // Set admin data and ensure tokens are stored
      if (response.user) {
        const adminData = {
          ...response.user,
          role: 'admin',
        };
        setAdmin(adminData);
        localStorage.setItem("admin", JSON.stringify(adminData));

        // Manually set cookies if needed
        if (response.access_token && response.refresh_token) {
          Cookies.set("client_admin_accessToken", response.access_token, { path: '/' });
          Cookies.set("client_admin_refreshToken", response.refresh_token, { path: '/' });
        }
      }
      
      // Add a small delay before redirect to ensure cookies are set
      setTimeout(() => {
        router.push("/admin/dashboard");
      }, 100);
    } catch (err) {
      console.error('Login error:', err);
      setError(
        err.message || err.response?.data?.detail || err.response?.data?.message || "Login failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardContent className="space-y-4">
        <Typography variant="h5" component="h1" className="text-center mb-6">
          Admin Login
        </Typography>

        {error && (
          <Alert severity="error" className="mb-4">
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <TextField
            fullWidth
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <TextField
            fullWidth
            label="Password"
            name="password"
            type={showPassword ? "text" : "password"}
            value={formData.password}
            onChange={handleChange}
            required
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            sx={{
              bgcolor: "rgb(31 41 55)",
              "&:hover": {
                bgcolor: "rgb(55 65 81)",
              },
            }}
          >
            {loading ? "Logging in..." : "Login"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
} 