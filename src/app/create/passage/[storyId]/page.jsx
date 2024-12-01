"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Container,
  Typography,
  Paper,
  Button,
  IconButton
} from "@mui/material";
import { Delete, Edit, Add } from "@mui/icons-material";
import storyApiClient from "@/lib/storyApi";
import PlanHeader from "@/components/plan/Header";
import StoryElement from "@/components/plan/StoryElement";
import ProgressIndicator from "@/components/plan/ProgressIndicator";
import { Toaster, toast } from "react-hot-toast";

export default function PlanStory({ params }) {
  const router = useRouter();
  const { storyId } = params;
  const [loading, setLoading] = useState({
    title: false,
    premise: false,
    setting: false,
    characters: false,
    outline: false,
    passages: false
  });
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [storyData, setStoryData] = useState({
    title: "",
    premise: "",
    setting: "",
    characters: [],
    outline: [],
    passages: []
  });

  // Fetch existing story elements
  useEffect(() => {
    const fetchStoryElements = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user?.id) throw new Error("User not found");

        const response = await storyApiClient.get(
          `/plan/story-elements/${storyId}`,
          {
            params: { 
              story_id: storyId,
              user_id: user.id
            },
          }
        );

        setStoryData(response.data);
        calculateProgress(response.data);
      } catch (err) {
        console.error("Error fetching story elements:", err);
      }
    };

    fetchStoryElements();
  }, [storyId]);

  const calculateProgress = (data) => {
    const elements = ["title", "premise", "setting", "characters", "outline"];
    const completed = elements.filter((elem) =>
      Array.isArray(data[elem]) ? data[elem].length > 0 : Boolean(data[elem])
    ).length;
    setProgress((completed / elements.length) * 100);
  };

  const handleGeneratePassage = async () => {
    // Check if all planning elements are complete
    const requiredElements = ["title", "premise", "setting", "characters", "outline"];
    const missingElements = requiredElements.filter(elem => 
      !storyData[elem] || (Array.isArray(storyData[elem]) && storyData[elem].length === 0)
    );

    if (missingElements.length > 0) {
      toast.error(`Please complete the following elements first: ${missingElements.join(", ")}`);
      return;
    }

    setLoading(prev => ({ ...prev, passages: true }));

    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user?.id) throw new Error("User not found");

      const response = await storyApiClient.get(
        `/plan/generate-passage/${storyId}`,
        {
          params: { user_id: user.id },
        }
      );

      // Update story data with new passage
      setStoryData(prev => ({
        ...prev,
        passages: [...(prev.passages || []), response.data]
      }));

      toast.success("Passage generated successfully!");
    } catch (err) {
      console.error("Error generating passage:", err);
      toast.error("Failed to generate passage. Please try again.");
    } finally {
      setLoading(prev => ({ ...prev, passages: false }));
    }
  };

  const handleEditPassage = async (passageId, newContent) => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user?.id) throw new Error("User not found");

      const response = await storyApiClient.put(
        `/plan/edit-passage/${storyId}/${passageId}`,
        {
          user_id: user.id,
          new_passage: newContent,
        }
      );

      // Update specific passage
      setStoryData(prev => ({
        ...prev,
        passages: prev.passages.map(passage => 
          passage.id === passageId ? response.data : passage
        )
      }));

      toast.success("Passage updated successfully!");
    } catch (err) {
      console.error("Error updating passage:", err);
      toast.error("Failed to update passage. Please try again.");
    }
  };

  const handleDeletePassage = async (passageId) => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user?.id) throw new Error("User not found");

      await storyApiClient.delete(
        `/plan/delete-passage/${storyId}/${passageId}`,
        {
          params: { user_id: user.id },
        }
      );

      // Remove passage from state
      setStoryData(prev => ({
        ...prev,
        passages: prev.passages.filter(passage => passage.id !== passageId)
      }));

      toast.success("Passage deleted successfully!");
    } catch (err) {
      console.error("Error deleting passage:", err);
      toast.error("Failed to delete passage. Please try again.");
    }
  };

  // Check if all planning elements are complete
  const isPlanningComplete = () => {
    const requiredElements = ["title", "premise", "setting", "characters", "outline"];
    return requiredElements.every(elem => 
      storyData[elem] && (Array.isArray(storyData[elem]) ? storyData[elem].length > 0 : true)
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gray-50"
    >
      <Toaster position="top-right" />
      <PlanHeader />
      <Container maxWidth="md" className="pt-20 pb-12">
        <ProgressIndicator progress={progress} />

        <Paper elevation={3} className="p-8 mt-8">
          {/* Story Title as Heading */}
          <Typography variant="h3" className="mb-8 text-center text-gray-800">
            {storyData.title || "Untitled Story"}
          </Typography>

          {/* Planning Elements */}
          <AnimatePresence mode="wait">
            <motion.div className="space-y-8">
              <StoryElement
                title="Title"
                description="Create a captivating title for your story"
                content={storyData?.title}
                isFirst={true}
                storyId={storyId}
              />

              {storyData?.title && (
                <StoryElement
                  title="Premise"
                  description="Define the core concept of your story"
                  content={storyData?.premise}
                  storyId={storyId}
                />
              )}

              {storyData?.premise && (
                <StoryElement
                  title="Setting"
                  description="Establish the world where your story takes place"
                  content={storyData?.setting}
                  storyId={storyId}
                />
              )}

              {storyData?.setting && (
                <StoryElement
                  title="Characters"
                  description="Bring your story's characters to life"
                  content={storyData?.characters}
                  storyId={storyId}
                  isCharacters={true}
                />
              )}

              {storyData?.characters?.length > 0 && (
                <StoryElement
                  title="Outline"
                  description="Structure your story's plot"
                  content={storyData?.outline}
                  storyId={storyId}
                  isOutline={true}
                />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Generate Passages Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-12 space-y-4 text-center"
          >
            {isPlanningComplete() ? (
              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={handleGeneratePassage}
                disabled={loading.passages}
                className="px-12 py-3 bg-green-500 hover:bg-green-600"
              >
                {loading.passages ? "Generating Passage..." : "Generate Passage"}
              </Button>
            ) : (
              <Typography variant="body1" color="error" className="text-center">
                Please complete all planning elements before generating passages.
              </Typography>
            )}
          </motion.div>

          {/* Passages Section */}
          {storyData.passages && storyData.passages.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-12 space-y-6"
            >
              <Typography variant="h5" className="mb-4 text-center">
                Story Passages
              </Typography>
              {storyData.passages.map((passage, index) => (
                <Paper key={passage.id} elevation={2} className="relative p-6">
                  <div className="absolute space-x-2 top-2 right-2">
                    <IconButton 
                      color="primary" 
                      onClick={() => {/* Open edit modal */}}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton 
                      color="error" 
                      onClick={() => handleDeletePassage(passage.id)}
                    >
                      <Delete />
                    </IconButton>
                  </div>
                  <Typography variant="h6" className="mb-4">
                    Passage {index + 1}
                  </Typography>
                  <Typography variant="body1">
                    {passage.content}
                  </Typography>
                </Paper>
              ))}
            </motion.div>
          )}
        </Paper>
      </Container>
    </motion.div>
  );
}