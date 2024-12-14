"use client";
import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Grid,
  Typography,
  TextField,
  Button,
  Avatar,
  Card,
  CardContent,
  Divider,
  IconButton,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { useAuth } from "@/hooks/useAuth";
import { PhotoCamera, Delete } from "@mui/icons-material";
import Image from "next/image";
import Link from "next/link";
import cover from "@/assets/images/boyanddog.webp";
import { userService } from "@/lib/userService";
import { useRouter } from "next/navigation";
import { subscriptionService } from "@/lib/subscriptionService";
import { formatDate } from "@/utils/dateUtils";
const themeColors = {
  primary: "rgb(34 197 94)",
  primaryHover: "rgb(22 163 74)",
  dark: "rgb(31 41 55)",
};

export default function ProfileSettings() {
  const { user, checkAuth } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const router = useRouter();

  const [formData, setFormData] = useState({
    username: "",
    firstName: "",
    lastName: "",
    email: "",
    bio: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || "",
        firstName: user.first_name || "",
        lastName: user.last_name || "",
        email: user.email || "",
        bio: user.bio || "",
      });
    }
  }, [user]);

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const data = await subscriptionService.getCurrentSubscription();
        setSubscription(data);
      } catch (error) {
        console.error("Error fetching subscription:", error);
      }
    };

    fetchSubscription();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      await userService.updateProfile({
        username: formData.username,
        first_name: formData.firstName,
        last_name: formData.lastName,
        bio: formData.bio,
      });
      setSuccess("Profile updated successfully!");
      await checkAuth(); // Refresh user data
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setIsLoading(true);
      setError("");
      await userService.uploadProfilePhoto(file);
      await checkAuth(); // Refresh user data
      setSuccess("Profile photo updated successfully!");
    } catch (err) {
      setError(
        typeof err === "string"
          ? err
          : err.response?.data?.detail || "Failed to upload photo"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (
      !window.confirm("Are you sure you want to remove your profile photo?")
    ) {
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      await userService.removeProfilePhoto();
      await checkAuth(); // Refresh user data
      setSuccess("Profile photo removed successfully!");
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to remove photo");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (
      window.confirm(
        "Are you sure you want to delete your account? This action cannot be undone."
      )
    ) {
      try {
        setIsLoading(true);
        await userService.deleteAccount();
        router.push("/");
      } catch (err) {
        setError(err.response?.data?.detail || "Failed to delete account");
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 8 } }}>
      <Grid container spacing={4}>
        {/* Profile Section */}
        <Grid item xs={12} md={8}>
          <Card elevation={0} sx={{ bgcolor: "rgb(249 250 251)", mb: 4 }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
                <Avatar
                  src={user?.photo}
                  sx={{
                    width: 100,
                    height: 100,
                    mr: 3,
                    border: `2px solid ${themeColors.primary}`,
                  }}
                >
                  {user?.username?.[0]?.toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight={600} gutterBottom>
                    Profile Settings
                  </Typography>
                  <Box sx={{ display: "flex", gap: 2 }}>
                    <Button
                      variant="outlined"
                      component="label"
                      startIcon={<PhotoCamera />}
                      disabled={isLoading}
                      sx={{
                        borderColor: themeColors.primary,
                        color: themeColors.primary,
                        "&:hover": {
                          borderColor: themeColors.primaryHover,
                          bgcolor: "rgba(34, 197, 94, 0.04)",
                        },
                      }}
                    >
                      Update Photo
                      <input
                        hidden
                        type="file"
                        accept="image/jpeg,image/png,image/jpg"
                        onChange={handlePhotoUpload}
                      />
                    </Button>
                    {user?.photo && (
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={handleRemovePhoto}
                        disabled={isLoading}
                      >
                        Remove Photo
                      </Button>
                    )}
                  </Box>
                  {error && (
                    <Typography color="error" sx={{ mt: 1 }}>
                      {error}
                    </Typography>
                  )}
                  {success && (
                    <Typography color="success.main" sx={{ mt: 1 }}>
                      {success}
                    </Typography>
                  )}
                </Box>
              </Box>

              <Box component="form" onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Username"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="First Name"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Last Name"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      variant="outlined"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      variant="outlined"
                      disabled
                      helperText="Email cannot be changed"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Bio"
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      variant="outlined"
                      multiline
                      rows={4}
                    />
                  </Grid>
                </Grid>

                <Box sx={{ mt: 4, display: "flex", gap: 2 }}>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={isLoading}
                    sx={{
                      bgcolor: themeColors.primary,
                      "&:hover": {
                        bgcolor: themeColors.primaryHover,
                      },
                    }}
                  >
                    Save Changes
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<Delete />}
                    onClick={handleDeleteAccount}
                  >
                    Delete Account
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Subscription Section */}
        <Grid item xs={12} md={4}>
          <Card elevation={0} sx={{ bgcolor: "rgb(249 250 251)" }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Subscription Plan
              </Typography>
              <Box
                sx={{
                  mt: 2,
                  p: 2,
                  bgcolor: "white",
                  borderRadius: 1,
                  border: "1px solid rgba(0, 0, 0, 0.1)",
                }}
              >
                <Box sx={{ position: "relative", height: 120, mb: 2 }}>
                  <Image
                    src={cover}
                    alt="Plan Cover"
                    fill
                    style={{
                      objectFit: "cover",
                      borderRadius: "8px",
                    }}
                  />
                </Box>
                <Typography variant="subtitle1" fontWeight={600}>
                  {subscription?.tier === "premium"
                    ? "StoryWeaver Premium"
                    : subscription?.tier === "basic"
                    ? "StoryWeaver Basic"
                    : "StoryWeaver Free"}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Status: {subscription?.status || "N/A"}
                </Typography>
                {subscription?.start_date && (
                  <Typography variant="body2" color="text.secondary">
                    Started: {formatDate(subscription.start_date)}
                  </Typography>
                )}
                {subscription?.end_date && subscription.tier !== "free" && (
                  <Typography variant="body2" color="text.secondary">
                    Renews: {formatDate(subscription.end_date)}
                  </Typography>
                )}
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 2 }}
                >
                  Stories Created: {subscription?.story_count || 0}
                </Typography>
                {subscription?.tier === "free" ? (
                  <Button
                    component={Link}
                    href="/subscription"
                    variant="outlined"
                    fullWidth
                    sx={{
                      color: themeColors.primary,
                      borderColor: themeColors.primary,
                      "&:hover": {
                        borderColor: themeColors.primaryHover,
                        bgcolor: "rgba(34, 197, 94, 0.04)",
                      },
                    }}
                  >
                    Upgrade Plan
                  </Button>
                ) : (
                  <Button
                    component={Link}
                    href="/subscription"
                    variant="outlined"
                    fullWidth
                    sx={{
                      color: themeColors.primary,
                      borderColor: themeColors.primary,
                      "&:hover": {
                        borderColor: themeColors.primaryHover,
                        bgcolor: "rgba(34, 197, 94, 0.04)",
                      },
                    }}
                  >
                    Manage Subscription
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}
