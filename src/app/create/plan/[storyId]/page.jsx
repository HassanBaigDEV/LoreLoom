"use client";
import { useState, useEffect } from "react";
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
import { useAtom } from 'jotai';
import { 
  storyDataAtom, 
  storyProgressAtom, 
  storyLoadingAtom, 
  storyErrorAtom,
  currentStoryIdAtom 
} from '@/store/atoms';
import storyApiClient from "@/lib/storyApi";
import PlanHeader from "@/components/plan/Header";
import StoryElement from "@/components/plan/StoryElement";
import ProgressIndicator from "@/components/plan/ProgressIndicator";
import { Toaster, toast } from "react-hot-toast";

export default function PlanStory({ params }) {
  const router = useRouter();
  const { storyId } = params;
  const [pageLoading, setPageLoading] = useState(true);
  
  // Jotai state
  const [storyData, setStoryData] = useAtom(storyDataAtom);
  const [progress, setProgress] = useAtom(storyProgressAtom);
  const [loading, setLoading] = useAtom(storyLoadingAtom);
  const [error, setError] = useAtom(storyErrorAtom);
  const [, setCurrentStoryId] = useAtom(currentStoryIdAtom);

  const calculateProgress = (data) => {
    const elements = ["title", "premise", "setting", "characters", "outline"];
    const completed = elements.filter((elem) =>
      Array.isArray(data[elem]) ? data[elem].length > 0 : Boolean(data[elem])
    ).length;
    setProgress((completed / elements.length) * 100);
  };

  useEffect(() => {
    setCurrentStoryId(storyId);
    const fetchStoryElements = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user?.id) throw new Error("User not found");

        const response = await storyApiClient.get(
          `/plan/story-elements/${storyId}`,
          {
            params: { user_id: user.id },
          }
        );

        setStoryData(response.data);
        calculateProgress(response.data);
      } catch (err) {
        console.error("Error fetching story elements:", err);
        toast.error("Failed to load story elements");
      } finally {
        setPageLoading(false);
      }
    };

    fetchStoryElements();
  }, [storyId, setStoryData, setCurrentStoryId]);

  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <CircularProgress size={40} className="text-green-500" />
          <Typography className="mt-4 text-gray-600">
            Loading your story...
          </Typography>
        </div>
      </div>
    );
  }

  const handleGenerate = async (elementType) => {
    setLoading(true);
    setError("");

    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user?.id) throw new Error("User not found");

      const response = await storyApiClient.get(
        `/plan/generate-${elementType}/${storyId}`,
        {
          params: { user_id: user.id },
        }
      );

      setStoryData((prev) => {
        const newData = { ...prev, [elementType]: response.data };
        calculateProgress(newData);
        return newData;
      });
    } catch (err) {
      console.error(`Error generating ${elementType}:`, err);
      setError(`Failed to generate ${elementType}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (elementType, newContent) => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user?.id) throw new Error("User not found");

      const response = await storyApiClient.put(
        `/plan/edit-${elementType}/${storyId}`,
        {
          [`new_${elementType}`]: newContent
        },
        {
          params: { user_id: user.id }
        }
      );

      setStoryData((prev) => ({
        ...prev,
        [elementType]: response.data[elementType],
      }));
      toast.success(`${elementType} updated successfully!`);
    } catch (err) {
      console.error(`Error updating ${elementType}:`, err);
      toast.error(`Failed to update ${elementType}. Please try again.`);
    }
  };

  const handleProceed = () => {
    router.push("/write");
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
          <Typography variant="h4" className="mb-8 text-center text-gray-800">
            Craft Your Story
          </Typography>

          <AnimatePresence mode="wait">
            <motion.div className="space-y-8">
              <StoryElement
                title="Title"
                description="Create a captivating title for your story"
                content={storyData?.title}
                loading={loading}
                onGenerate={() => handleGenerate("title")}
                onEdit={(content) => handleEdit("title", content)}
                isFirst={true}
                storyId={storyId}
                setStoryData={setStoryData}
              />

              {storyData?.title && (
                <StoryElement
                  title="Premise"
                  description="Define the core concept of your story"
                  content={storyData?.premise}
                  loading={loading}
                  onGenerate={() => handleGenerate("premise")}
                  onEdit={(content) => handleEdit("premise", content)}
                  storyId={storyId}
                  setStoryData={setStoryData}
                />
              )}

              {storyData?.premise && (
                <StoryElement
                  title="Setting"
                  description="Establish the world where your story takes place"
                  content={storyData?.setting}
                  loading={loading}
                  onGenerate={() => handleGenerate("setting")}
                  onEdit={(content) => handleEdit("setting", content)}
                  storyId={storyId}
                  setStoryData={setStoryData}
                />
              )}

              {storyData?.setting && (
                <StoryElement
                  title="Characters"
                  description="Bring your story's characters to life"
                  content={storyData?.characters}
                  loading={loading}
                  onGenerate={() => handleGenerate("characters")}
                  onEdit={(content) => handleEdit("characters", content)}
                  storyId={storyId}
                  isCharacters={true}
                  setStoryData={setStoryData}
                />
              )}

              {storyData?.characters?.length > 0 && (
                <StoryElement
                  title="Outline"
                  description="Structure your story's plot"
                  content={storyData?.outline}
                  loading={loading}
                  onGenerate={() => handleGenerate("outline")}
                  onEdit={(content) => handleEdit("outline", content)}
                  storyId={storyId}
                  isOutline={true}
                  setStoryData={setStoryData}
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
                onClick={handleProceed}
                className="bg-green-500 hover:bg-green-600 px-12 py-3"
              >
                Proceed to Writing
              </Button>
            </motion.div>
          )}
        </Paper>
      </Container>
    </motion.div>
  );
}
