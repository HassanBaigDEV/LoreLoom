"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import storyApiClient from "@/lib/storyApi";
import axios from "axios";

export default function CreateStory() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreateStory = async () => {
    setIsLoading(true);
    setError("");

    try {
      const user = JSON.parse(localStorage.getItem("user"));
      console.log("user", user?.id);
      if (!user?.id) {
        throw new Error("User not found");
      }

      const response = await storyApiClient.post("/stories", null, {
        params: { user_id: user.id },
        // query: { user_id: user.id },
      });

      const { story_id } = response.data;
      localStorage.setItem("current_story_id", story_id);
      router.push(`/create/plan/${story_id}`);
    } catch (err) {
      console.log("Error creating story:", err);
      setError("Failed to create story. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen px-4 py-12 bg-gray-50 sm:px-6 lg:px-8"
    >
      <div className="max-w-3xl mx-auto">
        <Box className="p-8 text-center bg-white rounded-lg shadow-lg">
          <Typography
            variant="h4"
            component="h1"
            className="mb-6 text-gray-800"
          >
            Start Your Story Journey
          </Typography>

          <Typography variant="body1" className="mb-8 text-gray-600">
            Ready to create your next masterpiece? Let's begin by setting up
            your story canvas.
          </Typography>

          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={handleCreateStory}
            disabled={isLoading}
            className="bg-green-500 hover:bg-green-600"
          >
            {isLoading ? (
              <CircularProgress size={24} className="text-white" />
            ) : (
              "Create New Story"
            )}
          </Button>

          {error && (
            <Typography color="error" className="mt-4">
              {error}
            </Typography>
          )}
        </Box>
      </div>
    </motion.div>
  );
}
