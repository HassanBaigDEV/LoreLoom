"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
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
import { toast } from "react-hot-toast";
import apiClient from "@/lib/axios";

export default function StorySettingsPage() {
  const params = useParams();
  const storyId = params.id;
  const { user } = useAuth();
  const { storyData, setStoryData } = useStories();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [story, setStory] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    genre: "",
    privacy: "private",
  });

  // Fetch story data
  useEffect(() => {
    const fetchStory = async () => {
      if (!storyId || !user) return;

      try {
        setLoading(true);
        const response = await apiClient.get(`/author/stories/${storyId}`);
        const storyData = response.data;

        console.log("Fetched story data:", storyData);
        setStory(storyData);
        setFormData({
          title: storyData.title || "",
          genre: storyData.genre || "",
          privacy: storyData.privacy || "private",
        });
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

  // Save story settings
  const handleSave = async () => {
    if (!storyId || !user) return;

    try {
      setSaving(true);
      const response = await apiClient.put(`/author/stories/${storyId}`, {
        ...formData,
        userId: user.id,
      });

      setStory(response.data);
      toast.success("Story settings saved");
    } catch (error) {
      console.error("Failed to save story settings:", error);
      toast.error("Failed to save story settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      <h1 className="text-3xl font-bold mb-6">Story Settings</h1>

      <Tabs defaultValue="general">
        <TabsList className="mb-6">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="collaboration">Collaboration</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Update your story details and visibility
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Story title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="genre">Genre</Label>
                <Input
                  id="genre"
                  name="genre"
                  value={formData.genre}
                  onChange={handleChange}
                  placeholder="e.g. Fantasy, Sci-Fi, Mystery"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="privacy">Privacy</Label>
                <Select
                  value={formData.privacy}
                  onValueChange={handlePrivacyChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select privacy level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">Private</SelectItem>
                    <SelectItem value="shared">
                      Shared with Collaborators
                    </SelectItem>
                    <SelectItem value="public">Public</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleSave} disabled={saving} className="mt-4">
                {saving ? "Saving..." : "Save Changes"}
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
  );
}
