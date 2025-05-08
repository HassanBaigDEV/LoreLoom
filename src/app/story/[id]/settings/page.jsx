"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useStories } from "@/hooks/useStories";
import CollaborationSettings from "@/components/Collaboration/CollaborationSettings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast, Toaster } from "react-hot-toast";
import apiClient from "@/lib/axios";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Trash } from "lucide-react";

export default function StorySettingsPage() {
  const params = useParams();
  const router = useRouter();
  const storyId = params.id;
  const { user } = useAuth();
  const { fetchStories } = useStories();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [story, setStory] = useState(null);
  const [isAuthor, setIsAuthor] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    genre: "",
    privacy: "private",
  });
  const [coverImage, setCoverImage] = useState(null);
  const [coverImagePreview, setCoverImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Fetch story data
  useEffect(() => {
    const fetchStory = async () => {
      if (!storyId || !user) return;

      try {
        setLoading(true);
        console.log("Fetching story with ID:", storyId);
        const response = await apiClient.get(`/author/stories/${storyId}`);
        const storyData = response.data;

        console.log("Fetched story data:", storyData);
        setStory(storyData);

        // Check if user is the author
        setIsAuthor(user.id === storyData.author);

        setFormData({
          title: storyData.title || "",
          genre: storyData.genre || "",
          privacy: storyData.privacy || "private",
        });

        // If there's a cover image, set the preview
        if (storyData.cover_image) {
          setCoverImagePreview(storyData.cover_image);
        }
      } catch (error) {
        console.error("Failed to fetch story:", error);
        toast.error("Failed to load story settings");
      } finally {
        setLoading(false);
      }
    };

    fetchStory();
  }, [storyId, user]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle privacy selection
  const handlePrivacyChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      privacy: value,
    }));
  };

  // Handle image file selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Image size should be less than 2MB");
        return;
      }

      setCoverImage(file);

      // Create a preview URL
      const reader = new FileReader();
      reader.onload = (event) => {
        setCoverImagePreview(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle removing the cover image
  const handleRemoveCoverImage = () => {
    setCoverImage(null);
    setCoverImagePreview(null);
  };

  // Save story settings - fixed and simplified
  const handleSave = async () => {
    if (!storyId || !user || !isAuthor) {
      if (!isAuthor) {
        toast.error("Only the author can update story settings");
      }
      return;
    }

    // Create a loading toast that we'll update
    const loadingId = toast.loading("Saving changes...");

    try {
      setSaving(true);

      // Handle image upload if there's a new image
      let coverImageUrl = story?.cover_image;
      if (coverImage) {
        setUploadingImage(true);

        // Create a form for the image upload
        const imageForm = new FormData();
        imageForm.append("file", coverImage);
        imageForm.append("story_id", storyId);

        try {
          const uploadResponse = await apiClient.post(
            "/author/upload-cover",
            imageForm,
            {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            }
          );

          // Get the URL from the response
          coverImageUrl = uploadResponse.data.url;
        } catch (error) {
          console.error("Failed to upload image:", error);
          toast.error("Failed to upload cover image", { id: loadingId });
          setUploadingImage(false);
          setSaving(false);
          return;
        } finally {
          setUploadingImage(false);
        }
      }

      // Handle the case where cover image was removed
      if (coverImagePreview === null && story?.cover_image) {
        coverImageUrl = null;
      }

      // Create the update payload - use the StoryCreate schema format
      const updatePayload = {
        title: formData.title,
        genre: formData.genre,
        privacy: formData.privacy,
        cover_image: coverImageUrl,
        author: user.id,

        // Keep existing values to avoid losing data
        story_id: storyId,
        premise: story.premise || "",
        setting: story.setting || "",
        characters: story.characters || [],
        outline: story.outline || [],
        author_name: story.author_name || "",
        collaborators: story.collaborators || [],
      };

      console.log("Updating story with payload:", updatePayload);

      // Use the URL parameter (story_id) for the API call
      // The backend will handle finding by story_id
      const response = await apiClient.put(
        `/author/stories/${storyId}`,
        updatePayload
      );

      // Update local state with the response
      setStory(response.data);

      // Refresh the stories list to update the dashboard
      if (user?.id) {
        await fetchStories(user.id);
      }

      // Update the toast to show success
      toast.success("Story settings saved successfully", { id: loadingId });
    } catch (error) {
      console.error("Failed to save story settings:", error);
      let errorMessage = "Failed to save settings";

      if (error.response?.data?.detail) {
        errorMessage = `Error: ${error.response.data.detail}`;
      }

      toast.error(errorMessage, { id: loadingId });
    } finally {
      setSaving(false);
    }
  };

  // Helper for checking if a string is a base64 data URI
  const isBase64Image = (str) => {
    return typeof str === "string" && str.startsWith("data:image/");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-b from-green-50 to-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>

      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gradient-to-b from-green-50 to-white py-6 px-4 md:px-6"
    >
      <Toaster position="top-right" />
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">
          Story Settings
        </h1>

        <Tabs defaultValue="general">
          <TabsList className="mb-6 bg-white border border-gray-200">
            <TabsTrigger
              value="general"
              className="data-[state=active]:bg-green-500 data-[state=active]:text-white"
            >
              General
            </TabsTrigger>
            <TabsTrigger
              value="collaboration"
              className="data-[state=active]:bg-green-500 data-[state=active]:text-white"
            >
              Collaboration
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="text-gray-800">
                  General Settings
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Update your story details and visibility
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                {/* Cover Image Upload */}
                <div className="space-y-2">
                  <Label htmlFor="cover-image" className="font-medium">
                    Cover Image
                  </Label>
                  <div className="flex flex-col items-center space-y-4">
                    {coverImagePreview ? (
                      <div className="relative w-full max-w-md h-64 bg-gray-100 rounded-lg overflow-hidden">
                        {isBase64Image(coverImagePreview) ? (
                          <div
                            className="w-full h-full bg-center bg-cover"
                            style={{
                              backgroundImage: `url(${coverImagePreview})`,
                              backgroundPosition: "center",
                              backgroundSize: "cover",
                            }}
                          />
                        ) : (
                          <Image
                            src={coverImagePreview}
                            alt="Story cover"
                            fill
                            className="object-cover"
                            unoptimized={coverImagePreview.startsWith("/")}
                            onError={(e) => {
                              console.error(
                                "Error loading image:",
                                coverImagePreview
                              );
                              // If image fails to load, show error state
                              e.target.onerror = null; // Prevent infinite loop
                              setCoverImagePreview(null);
                              toast.error("Failed to load cover image");
                            }}
                          />
                        )}
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white"
                          onClick={handleRemoveCoverImage}
                          disabled={!isAuthor}
                          type="button"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <label
                        htmlFor="cover-image-input"
                        className={`flex flex-col items-center justify-center w-full max-w-md h-64 border-2 border-dashed border-gray-300 rounded-lg ${
                          isAuthor
                            ? "cursor-pointer bg-gray-50 hover:bg-gray-100"
                            : "bg-gray-100"
                        }`}
                      >
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-10 h-10 mb-3 text-gray-400" />
                          {isAuthor ? (
                            <>
                              <p className="mb-2 text-sm text-gray-500">
                                <span className="font-semibold">
                                  Click to upload
                                </span>{" "}
                                or drag and drop
                              </p>
                              <p className="text-xs text-gray-500">
                                PNG, JPG or WebP (Max 2MB)
                              </p>
                            </>
                          ) : (
                            <p className="mb-2 text-sm text-gray-500">
                              No cover image available
                            </p>
                          )}
                        </div>
                        {isAuthor && (
                          <input
                            id="cover-image-input"
                            type="file"
                            accept="image/png, image/jpeg, image/webp"
                            onChange={handleImageChange}
                            className="hidden"
                            disabled={!isAuthor}
                          />
                        )}
                      </label>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title" className="font-medium">
                    Title
                  </Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Story title"
                    className="border-gray-300 focus:border-green-500 focus:ring-green-500"
                    disabled={!isAuthor}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="genre" className="font-medium">
                    Genre
                  </Label>
                  <Input
                    id="genre"
                    name="genre"
                    value={formData.genre}
                    onChange={handleChange}
                    placeholder="e.g. Fantasy, Sci-Fi, Mystery"
                    className="border-gray-300 focus:border-green-500 focus:ring-green-500"
                    disabled={!isAuthor}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="privacy" className="font-medium">
                    Privacy
                  </Label>
                  <Select
                    value={formData.privacy}
                    onValueChange={handlePrivacyChange}
                    disabled={!isAuthor}
                  >
                    <SelectTrigger className="border-gray-300 focus:border-green-500 focus:ring-green-500">
                      <SelectValue placeholder="Select privacy level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="private">Private</SelectItem>
                      <SelectItem value="public">Public</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {!isAuthor && (
                  <p className="text-amber-500 text-sm mt-4">
                    Only the author can modify story settings
                  </p>
                )}

                <Button
                  onClick={handleSave}
                  disabled={saving || uploadingImage || !isAuthor}
                  className="mt-6 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                  type="button"
                >
                  {saving || uploadingImage ? (
                    <>
                      <span className="animate-spin mr-2">⟳</span>
                      {uploadingImage ? "Uploading..." : "Saving..."}
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="collaboration">
            <CollaborationSettings
              storyId={storyId}
              storyAuthorId={story?.author}
            />
          </TabsContent>
        </Tabs>
      </div>
    </motion.div>

  );
}
