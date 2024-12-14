"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Box,
  Container,
  Typography,
  Paper,
  Divider,
  Button,
  Drawer,
} from "@mui/material";
import storyApiClient from "@/lib/storyApi";
import PlanHeader from "@/components/common/header";
import StoryElement from "@/components/plan/StoryElement";
import PassageElement from "@/components/passage/passageElement";
import ProgressIndicator from "@/components/plan/ProgressIndicator";
import { Toaster } from "react-hot-toast";

export default function StoryPassage({ params }) {
  const router = useRouter();
  const { storyId } = params;
  const [progress, setProgress] = useState(0);
  const [passages, setPassages] = useState([]);
  const [storyData, setStoryData] = useState({
    title: "",
    premise: "",
    setting: "",
    characters: [],
    outline: [],
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedElement, setSelectedElement] = useState(null);

  // Fetch story and passage data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        if (!user?.id) throw new Error("User not found");

        const storyElementsResponse = await storyApiClient.get(
          `/plan/story-elements/${storyId}`,
          { params: { story_id: storyId, user_id: user.id } }
        );

        setStoryData(storyElementsResponse.data);
        calculateProgress(storyElementsResponse.data);

        const passagesResponse = await storyApiClient.get(
          `/draft/passages/${storyId}`,
          { params: { user_id: user.id, limit: 10, skip: 0 } }
        );
        console.log(passagesResponse);
        setPassages(passagesResponse.data);
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };

    fetchData();
  }, [storyId]);

  const calculateProgress = (data) => {
    const elements = ["title", "premise", "setting", "characters", "outline"];
    const completed = elements.filter((elem) =>
      Array.isArray(data[elem]) ? data[elem].length > 0 : Boolean(data[elem])
    ).length;
    setProgress((completed / elements.length) * 100);
  };

  const handleProceed = () => {
    setSelectedElement("passage");
    setSidebarOpen(false);
  };

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  const handleElementSelect = (element) => {
    setSelectedElement(element);
    if (element === "passage") {
      setSidebarOpen(false); // Close sidebar when Passage is selected
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gray-50"
    >
      <Toaster position="top-right" />

      <PlanHeader toggleSidebar={toggleSidebar} stage="writing" />

      <Container maxWidth="md" className="pt-20 pb-12">
        <ProgressIndicator progress={progress} phase="writing" />

        <Paper elevation={3} className="p-8 mt-8">
          <Typography variant="h5" className="mb-8 text-center text-gray-800">
            {storyData.title}
          </Typography>

          <AnimatePresence mode="wait">
            <motion.div className="space-y-8">
              {selectedElement && selectedElement !== "passage" && (
                <StoryElement
                  title={
                    selectedElement.charAt(0).toUpperCase() +
                    selectedElement.slice(1)
                  }
                  description={`Define your story's ${selectedElement}`}
                  content={storyData[selectedElement]}
                  storyId={storyId}
                  isCharacters={selectedElement === "characters"}
                  isOutline={selectedElement === "outline"}
                />
              )}

              {selectedElement === "passage" && (
                <PassageElement
                  title="Passages"
                  content={passages}
                  storyId={storyId}
                />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Hide this button if 'passage' is selected */}
          {progress === 100 && selectedElement !== "passage" && (
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
                className="px-12 py-3 bg-green-500 hover:bg-green-600"
              >
                Proceed to Writing
              </Button>
            </motion.div>
          )}
        </Paper>
      </Container>

      <Drawer
        anchor="right"
        open={sidebarOpen}
        onClose={toggleSidebar}
        sx={{
          width: 250,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: 250,
            boxSizing: "border-box",
          },
        }}
      >
        <Box p={2} className="space-y-4">
          <Typography variant="h6">Planning Elements</Typography>
          <Divider />
          <Box>
            {[
              "title",
              "premise",
              "setting",
              "characters",
              "outline",
              "passage",
            ].map((element) => (
              <Button
                key={element}
                variant="outlined"
                fullWidth
                onClick={() => handleElementSelect(element)}
                className="mb-2 text-green-500 border border-green-500 hover:border-green-500 hover:text-green-500"
                disabled={element === "passage" && progress !== 100}
              >
                {element.charAt(0).toUpperCase() + element.slice(1)}
              </Button>
            ))}
          </Box>
        </Box>
      </Drawer>
    </motion.div>
  );
}
