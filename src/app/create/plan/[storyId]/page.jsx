"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Box,
  Container,
  Typography,
  Paper,
  CircularProgress,
  Button,
} from "@mui/material";
import storyApiClient from "@/lib/storyApi";
import PlanHeader from "@/components/common/header";
import StoryElement from "@/components/plan/StoryElement";
import ProgressIndicator from "@/components/plan/ProgressIndicator";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { Toaster, toast } from "react-hot-toast";

const LoadingOverlay = () => (
  <Box
    sx={{
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      bgcolor: "rgba(255, 255, 255, 0.8)",
      zIndex: 1000,
    }}
  >
    <CircularProgress sx={{ color: "rgb(34 197 94)" }} />
  </Box>
);

export default function PlanStory({ params }) {
  const router = useRouter();
  const { storyId } = params;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [storyData, setStoryData] = useState({
    title: "",
    premise: "",
    setting: "",
    characters: [],
    outline: [],
  });

  const calculateProgress = useCallback((data) => {
    const elements = ["title", "premise", "setting", "characters", "outline"];
    const completed = elements.filter((elem) =>
      Array.isArray(data[elem]) ? data[elem].length > 0 : Boolean(data[elem])
    ).length;
    setProgress((completed / elements.length) * 100);
  }, []);

  const fetchStoryElements = useCallback(async () => {
    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user?.id) throw new Error("User not found");

      const response = await storyApiClient.get(
        `/plan/story-elements/${storyId}`,
        {
          params: {
            story_id: storyId,
            user_id: user.id,
          },
        }
      );

      setStoryData(response.data);
      calculateProgress(response.data);
    } catch (err) {
      console.error("Error fetching story elements:", err);
      toast.error("Failed to fetch story elements");
      setError("Failed to fetch story elements");
    } finally {
      setLoading(false);
    }
  }, [storyId, calculateProgress]);

  useEffect(() => {
    fetchStoryElements();
  }, [fetchStoryElements]);

  const handleElementUpdate = async () => {
    setSaving(true);
    try {
      await fetchStoryElements();
      toast.success("Successfully updated!");
    } catch (error) {
      toast.error("Failed to update. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleProceedP = () => {
    router.push(`/draft/passage/${storyId}`);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="min-h-screen bg-gray-50"
      >
        <Toaster position="top-right" />
        <PlanHeader stage="planning" />
        <Container maxWidth="md" className="pt-20 pb-12">
          <ProgressIndicator progress={progress} />

          <Paper elevation={3} className="relative p-8 mt-8">
            {(loading || saving) && <LoadingOverlay />}

            <Typography variant="h4" className="mb-8 text-center text-gray-800">
              Craft Your Story
            </Typography>

            <AnimatePresence mode="wait">
              <motion.div className="space-y-8">
                <StoryElement
                  title="Title"
                  description="Create a captivating title for your story"
                  content={storyData?.title}
                  isFirst={true}
                  storyId={storyId}
                  onUpdate={handleElementUpdate}
                />

                {storyData?.title && (
                  <StoryElement
                    title="Premise"
                    description="Define the core concept of your story"
                    content={storyData?.premise}
                    storyId={storyId}
                    onUpdate={handleElementUpdate}
                  />
                )}

                {storyData?.premise && (
                  <StoryElement
                    title="Setting"
                    description="Establish the world where your story takes place"
                    content={storyData?.setting}
                    storyId={storyId}
                    onUpdate={handleElementUpdate}
                  />
                )}

                {storyData?.setting && (
                  <StoryElement
                    title="Characters"
                    description="Bring your story's characters to life"
                    content={storyData?.characters}
                    storyId={storyId}
                    isCharacters={true}
                    onUpdate={handleElementUpdate}
                  />
                )}

                {storyData?.characters?.length > 0 && (
                  <StoryElement
                    title="Outline"
                    description="Structure your story's plot"
                    content={storyData?.outline}
                    storyId={storyId}
                    isOutline={true}
                    onUpdate={handleElementUpdate}
                  />
                )}
              </motion.div>
            </AnimatePresence>

            {progress === 100 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-12 text-center"
              >
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  onClick={handleProceedP}
                  disabled={loading || saving}
                  sx={{
                    px: 6,
                    py: 2,
                    bgcolor: "rgb(34 197 94)",
                    "&:hover": {
                      bgcolor: "rgb(22 163 74)",
                    },
                  }}
                >
                  Proceed to Writing
                </Button>
              </motion.div>
            )}
          </Paper>
        </Container>
      </motion.div>
    </>
  );
}
