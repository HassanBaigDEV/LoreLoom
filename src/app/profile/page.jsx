"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { userService } from "@/lib/userService";
import { subscriptionService } from "@/lib/subscriptionService";
import { formatDate } from "@/utils/dateUtils";
import { motion } from "framer-motion";
import { Toaster, toast } from "sonner";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

export default function ProfilePage() {
  const { user, checkAuth } = useAuth();
  const [formData, setFormData] = useState({
    username: "",
    first_name: "",
    last_name: "",
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
        username: user?.username || "",
        first_name: user?.first_name || "",
        last_name: user?.last_name || "",
        email: user?.email || "",
        bio: user?.bio || "",
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
      toast.success("Profile updated successfully");
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
      toast.success("Profile photo updated");
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

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <Toaster position="top-right" richColors />
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Section */}
            <div className="lg:col-span-2 space-y-8">
              <Card className="bg-gray-800 text-white border-gray-700">
                <CardHeader>
                  <CardTitle className="text-2xl">Profile Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col md:flex-row items-center gap-6 mb-8">
                    <div className="relative group">
                      <Avatar className="w-24 h-24 border-4 border-green-500">
                        <AvatarImage src={user?.photo} />
                        <AvatarFallback>
                          {user?.username?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex items-center justify-center">
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            className="hidden"
                          />
                          <span className="text-sm text-white">Upload</span>
                        </label>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h2 className="text-2xl font-semibold">
                        {formData.first_name
                          ? `${formData.first_name} ${formData.last_name}`
                          : formData.username}
                      </h2>
                      <div className="flex gap-4">
                        <Button
                          variant="outline"
                          className="text-green-500 border-green-500 hover:bg-green-500/10"
                          asChild
                        >
                          <label className="cursor-pointer">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handlePhotoUpload}
                              className="hidden"
                            />
                            Update Photo
                          </label>
                        </Button>
                        {user?.photo && (
                          <Button
                            variant="outline"
                            className="text-red-500 border-red-500 hover:bg-red-500/10"
                            onClick={handleRemovePhoto}
                          >
                            Remove Photo
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-gray-300">Username</Label>
                        <Input
                          value={formData.username}
                          onChange={handleChange}
                          name="username"
                          className="bg-gray-700 border-gray-600 text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-gray-300">First Name</Label>
                        <Input
                          value={formData.first_name}
                          onChange={handleChange}
                          name="first_name"
                          className="bg-gray-700 border-gray-600 text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-gray-300">Last Name</Label>
                        <Input
                          value={formData.last_name}
                          onChange={handleChange}
                          name="last_name"
                          className="bg-gray-700 border-gray-600 text-white"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-gray-300">Email</Label>
                        <Input
                          value={formData.email}
                          disabled
                          className="bg-gray-700 border-gray-600 text-gray-400"
                        />
                        <p className="text-sm text-gray-400">
                          Email cannot be changed
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-gray-300">Bio</Label>
                      <Textarea
                        value={formData.bio}
                        onChange={handleChange}
                        name="bio"
                        className="bg-gray-700 border-gray-600 text-white h-32"
                      />
                    </div>

                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        disabled={loading}
                      >
                        {loading ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </form>

                  {/* Password Change Section */}
                  <div className="mt-12 space-y-6">
                    <h3 className="text-xl font-semibold">Change Password</h3>
                    {passwordError && (
                      <div className="p-4 bg-red-500/10 text-red-500 rounded-lg">
                        {passwordError}
                      </div>
                    )}
                    <form onSubmit={handlePasswordChange} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-gray-300">
                            Current Password
                          </Label>
                          <Input
                            type="password"
                            value={passwordData.current_password}
                            onChange={(e) =>
                              setPasswordData((prev) => ({
                                ...prev,
                                current_password: e.target.value,
                              }))
                            }
                            className="bg-gray-700 border-gray-600 text-white"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-gray-300">New Password</Label>
                          <Input
                            type="password"
                            value={passwordData.new_password}
                            onChange={(e) =>
                              setPasswordData((prev) => ({
                                ...prev,
                                new_password: e.target.value,
                              }))
                            }
                            className="bg-gray-700 border-gray-600 text-white"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-gray-300">
                            Confirm Password
                          </Label>
                          <Input
                            type="password"
                            value={passwordData.confirm_password}
                            onChange={(e) =>
                              setPasswordData((prev) => ({
                                ...prev,
                                confirm_password: e.target.value,
                              }))
                            }
                            className="bg-gray-700 border-gray-600 text-white"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <Button
                          type="submit"
                          className="bg-green-600 hover:bg-green-700 text-white"
                          disabled={passwordLoading}
                        >
                          {passwordLoading ? "Updating..." : "Change Password"}
                        </Button>
                      </div>
                    </form>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Subscription Section */}
            <div className="space-y-8">
              <Card className="bg-gray-900 text-white border-gray-700">
                <CardHeader>
                  <CardTitle className="text-2xl">Subscription</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-gray-400">Current Plan</Label>
                    <div className="text-2xl font-bold text-green-500">
                      {subscription?.tier === "premium"
                        ? "Premium"
                        : subscription?.tier === "basic"
                        ? "Basic"
                        : "Free"}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Status</span>
                      <span>{subscription?.status || "Active"}</span>
                    </div>
                    {subscription?.start_date && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Started</span>
                        <span>{formatDate(subscription.start_date)}</span>
                      </div>
                    )}
                    {subscription?.end_date && subscription.tier !== "free" && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Renews</span>
                        <span>{formatDate(subscription.end_date)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-400">Stories Created</span>
                      <span>{subscription?.story_count || 0}</span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full text-green-500 border-green-500 hover:bg-green-500/10"
                    asChild
                  >
                    <a href="/subscription">
                      {subscription?.tier === "free"
                        ? "Upgrade Plan"
                        : "Manage Subscription"}
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
