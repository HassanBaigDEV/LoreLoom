"use client";
import { useState, useEffect } from "react";
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
  Stack,
  Alert,
  Paper,
} from "@mui/material";
import {
  PhotoCamera,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from "@mui/icons-material";
import { useAuth } from "@/hooks/useAuth";
import { userService } from "@/lib/userService";
import { subscriptionService } from "@/lib/subscriptionService";
import { formatDate } from "@/utils/dateUtils";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function ProfilePage() {
  const { user, checkAuth } = useAuth();
  const [formData, setFormData] = useState({
    username: "",
    firstName: "",
    lastName: "",
    email: "",
    bio: "",
  });
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [passwordError, setPasswordError] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

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
    setLoading(true);
    try {
      await userService.updateProfile(formData);
      await checkAuth();
      toast.success("Profile updated successfully!");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setPhotoLoading(true);
    try {
      await userService.uploadProfilePhoto(file);
      await checkAuth();
      toast.success("Profile photo updated successfully!");
    } catch (err) {
      toast.error(err.message || "Failed to upload photo");
    } finally {
      setPhotoLoading(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (
      !window.confirm("Are you sure you want to remove your profile photo?")
    ) {
      return;
    }

    setPhotoLoading(true);
    try {
      await userService.removeProfilePhoto();
      await checkAuth();
      toast.success("Profile photo removed successfully!");
    } catch (err) {
      toast.error("Failed to remove photo");
    } finally {
      setPhotoLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.new_password !== passwordData.confirm_password) {
      setPasswordError("New passwords don't match");
      return;
    }

    setPasswordLoading(true);
    setPasswordError("");

    try {
      await userService.changePassword({
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
      });
      toast.success("Password changed successfully");
      setPasswordData({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
    } catch (err) {
      setPasswordError(
        err.response?.data?.detail || "Failed to change password"
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  const inputStyles = {
    input: { color: 'white' },
    label: { color: 'grey.400' },
    '& .MuiOutlinedInput-root': {
      '& fieldset': {
        borderColor: 'rgba(255, 255, 255, 0.23)',
      },
      '&:hover fieldset': {
        borderColor: 'rgba(255, 255, 255, 0.4)',
      },
      '&.Mui-focused fieldset': {
        borderColor: 'rgb(34 197 94)',
      },
    },
    '& .MuiFormHelperText-root': {
      color: 'grey.400',
    },
  };

  return (
    <>
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: "grey.50",
          pt: { xs: 8, sm: 12 },
          pb: { xs: 6, sm: 8 },
        }}
      >
        <Container maxWidth="lg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Grid container spacing={4}>
              {/* Profile Section */}
              <Grid item xs={12} md={8}>
                <Card
                  elevation={0}
                  sx={{
                    bgcolor: "rgb(24 31 46)",
                    color: "white",
                    borderRadius: 2,
                  }}
                >
                  <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
                    {/* Profile Photo Section */}
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        mb: 4,
                        flexDirection: { xs: "column", sm: "row" },
                        gap: { xs: 2, sm: 3 },
                      }}
                    >
                      <Avatar
                        src={user?.photo}
                        sx={{
                          width: { xs: 80, sm: 100 },
                          height: { xs: 80, sm: 100 },
                          border: "4px solid",
                          borderColor: "rgb(34 197 94)",
                        }}
                      >
                        {user?.username?.[0]?.toUpperCase()}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h5" gutterBottom>
                          {formData.firstName
                            ? `${formData.firstName} ${formData.lastName}`
                            : formData.username}
                        </Typography>
                        <Stack direction="row" spacing={2}>
                          <Button
                            variant="outlined"
                            component="label"
                            startIcon={<PhotoCamera />}
                            disabled={photoLoading}
                            sx={{
                              color: "rgb(34 197 94)",
                              borderColor: "rgb(34 197 94)",
                              "&:hover": {
                                borderColor: "rgb(22 163 74)",
                                bgcolor: "rgba(34, 197, 94, 0.1)",
                              },
                            }}
                          >
                            Update Photo
                            <input
                              hidden
                              type="file"
                              accept="image/*"
                              onChange={handlePhotoUpload}
                            />
                          </Button>
                          {user?.photo && (
                            <Button
                              variant="outlined"
                              color="error"
                              onClick={handleRemovePhoto}
                              disabled={photoLoading}
                            >
                              Remove Photo
                            </Button>
                          )}
                        </Stack>
                      </Box>
                    </Box>

                    <Divider
                      sx={{ borderColor: "rgba(255, 255, 255, 0.1)", mb: 4 }}
                    />

                    {/* Profile Form */}
                    <form onSubmit={handleSubmit}>
                      <Grid container spacing={3}>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="Username"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            sx={inputStyles}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="First Name"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            sx={inputStyles}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Last Name"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            sx={inputStyles}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="Email"
                            name="email"
                            value={formData.email}
                            disabled
                            helperText="Email cannot be changed"
                            sx={{
                              ...inputStyles,
                              '& .MuiInputBase-input.Mui-disabled': {
                                WebkitTextFillColor: 'rgba(255, 255, 255, 0.7)',
                              },
                            }}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="Bio"
                            name="bio"
                            value={formData.bio}
                            onChange={handleChange}
                            multiline
                            rows={4}
                            sx={{
                              ...inputStyles,
                              '& .MuiOutlinedInput-root': {
                                ...inputStyles['& .MuiOutlinedInput-root'],
                                '& textarea': {
                                  color: 'white',
                                },
                              },
                            }}
                          />
                        </Grid>
                      </Grid>

                      <Box
                        sx={{
                          mt: 4,
                          display: "flex",
                          justifyContent: "flex-end",
                        }}
                      >
                        <Button
                          type="submit"
                          variant="contained"
                          disabled={loading}
                          sx={{
                            bgcolor: "rgb(34 197 94)",
                            "&:hover": {
                              bgcolor: "rgb(22 163 74)",
                            },
                          }}
                        >
                          {loading ? "Saving..." : "Save Changes"}
                        </Button>
                      </Box>
                    </form>

                    <Divider
                      sx={{ borderColor: "rgba(255, 255, 255, 0.1)", my: 4 }}
                    />

                    {/* Password Change Section */}
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        Change Password
                      </Typography>
                      {passwordError && (
                        <Alert severity="error" sx={{ mb: 3 }}>
                          {passwordError}
                        </Alert>
                      )}
                      <form onSubmit={handlePasswordChange}>
                        <Grid container spacing={3}>
                          <Grid item xs={12}>
                            <TextField
                              fullWidth
                              type="password"
                              label="Current Password"
                              value={passwordData.current_password}
                              onChange={(e) =>
                                setPasswordData((prev) => ({
                                  ...prev,
                                  current_password: e.target.value,
                                }))
                              }
                              required
                              sx={inputStyles}
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              type="password"
                              label="New Password"
                              value={passwordData.new_password}
                              onChange={(e) =>
                                setPasswordData((prev) => ({
                                  ...prev,
                                  new_password: e.target.value,
                                }))
                              }
                              required
                              sx={inputStyles}
                            />
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <TextField
                              fullWidth
                              type="password"
                              label="Confirm New Password"
                              value={passwordData.confirm_password}
                              onChange={(e) =>
                                setPasswordData((prev) => ({
                                  ...prev,
                                  confirm_password: e.target.value,
                                }))
                              }
                              required
                              sx={inputStyles}
                            />
                          </Grid>
                        </Grid>
                        <Box
                          sx={{
                            mt: 3,
                            display: "flex",
                            justifyContent: "flex-end",
                          }}
                        >
                          <Button
                            type="submit"
                            variant="contained"
                            disabled={passwordLoading}
                            sx={{
                              bgcolor: "rgb(34 197 94)",
                              "&:hover": {
                                bgcolor: "rgb(22 163 74)",
                              },
                            }}
                          >
                            {passwordLoading
                              ? "Changing..."
                              : "Change Password"}
                          </Button>
                        </Box>
                      </form>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Subscription Info Section */}
              <Grid item xs={12} md={4}>
                <Card
                  elevation={0}
                  sx={{
                    bgcolor: "rgb(17 24 39)",
                    color: "white",
                    borderRadius: 2,
                  }}
                >
                  <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
                    <Typography variant="h6" gutterBottom>
                      Subscription Details
                    </Typography>
                    <Stack spacing={2}>
                      <Box>
                        <Typography variant="subtitle2" color="grey.400">
                          Current Plan
                        </Typography>
                        <Typography
                          variant="h5"
                          sx={{ color: "rgb(34 197 94)" }}
                        >
                          {subscription?.tier === "premium"
                            ? "Premium"
                            : subscription?.tier === "basic"
                            ? "Basic"
                            : "Free"}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" color="grey.400">
                          Status
                        </Typography>
                        <Typography>
                          {subscription?.status || "Active"}
                        </Typography>
                      </Box>
                      {subscription?.start_date && (
                        <Box>
                          <Typography variant="subtitle2" color="grey.400">
                            Started
                          </Typography>
                          <Typography>
                            {formatDate(subscription.start_date)}
                          </Typography>
                        </Box>
                      )}
                      {subscription?.end_date &&
                        subscription.tier !== "free" && (
                          <Box>
                            <Typography variant="subtitle2" color="grey.400">
                              Renews
                            </Typography>
                            <Typography>
                              {formatDate(subscription.end_date)}
                            </Typography>
                          </Box>
                        )}
                      <Box>
                        <Typography variant="subtitle2" color="grey.400">
                          Stories Created
                        </Typography>
                        <Typography>
                          {subscription?.story_count || 0}
                        </Typography>
                      </Box>

                      <Button
                        variant="outlined"
                        fullWidth
                        href="/subscription"
                        sx={{
                          mt: 2,
                          color: "rgb(34 197 94)",
                          borderColor: "rgb(34 197 94)",
                          "&:hover": {
                            borderColor: "rgb(22 163 74)",
                            bgcolor: "rgba(34, 197, 94, 0.1)",
                          },
                        }}
                      >
                        {subscription?.tier === "free"
                          ? "Upgrade Plan"
                          : "Manage Subscription"}
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </motion.div>
        </Container>
      </Box>
    </>
  );
}
