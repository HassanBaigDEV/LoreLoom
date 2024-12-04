"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import CategoryButton from "@/components/generation/button";
import { TextInput, SelectInput } from "@/components/generation/form";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import storyApiClient from "@/lib/storyApi";

export default function CreateStory() {
  
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [storyData, setStoryData] = useState({
    title: "",
    premise: "",
    setting: "",
    genre: "",
    privacy: "private",
    characters: [],
    outline: [],
  });

  const handlePrivacyChange = (e) => {
    if (!e || !e.target) {
      console.error("Event or event target is undefined");
      return;
    }
    const { value } = e.target;
    setStoryData((prevData) => ({
      ...prevData,
      privacy: value, // Update privacy in story data
    }));
  };

  const handleCreateStory = async () => {
    setIsLoading(true);
    setError("");

    try {
      const user = JSON.parse(localStorage.getItem("user"));
      if (!user?.id) {
        throw new Error("User not found");
      }

      // Prepare the data to be sent in the body of the request
      const bodyData = {
        title: storyData.title,
        genre: storyData.genre,
      };

      // Make the API request to create the story
      const response = await storyApiClient.post("/stories", bodyData, {
        params: {
          user_id: user.id,
          title: storyData.title,
          genre: storyData.genre,
          privacy: storyData.privacy,
        }, // Sending user_id as URL params
      });
      console.log(response);

      // Handle the successful response
      const { story_id } = response.data;
      localStorage.setItem("current_story_id", story_id);
      router.push(`/create/plan/${story_id}`);
    } catch (err) {
      console.error("Error creating story:", err);
      setError("Failed to create story. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const categories = [
    "Sci-Fi",
    "Horror",
    "Adventure",
    "Mystery",
    "Animal",
    "Inspirational",
  ];
  const privacyOptions = ["private", "public"];

  const handleCategorySelect = (category) => {
    setSelectedCategory((prevCategory) => {
      // Toggle the category selection
      const newCategory = prevCategory === category ? null : category;
      // Update genre in story data
      setStoryData((prevData) => ({
        ...prevData,
        genre: newCategory, // Set the genre based on category selection
      }));
      return newCategory;
    });
  };

  const handleTitleChange = (e) => {
    if (!e || !e.target) {
      console.error("Event or event target is undefined");
      return;
    }
    const { value } = e.target;
    setStoryData((prevData) => ({
      ...prevData,
      title: value, // Update title in story data
    }));
  };

  return (
    <div className="min-h-screen p-8 bg-gray-200">
      <h1 className="mt-32 text-4xl font-semibold text-gray-800 text-bold">
        Create Story
      </h1>
      <div className="grid grid-cols-2 gap-8">
        <div className="space-y-8">
          <p className="mb-6 text-gray-600">
            Select a story type and enter the details in the form provided to{" "}
            <br />
            start crafting your story today.
          </p>
          <div className="grid grid-cols-3 gap-8">
            {categories.map((category, index) => (
              <div key={index} className="flex justify-center">
                <CategoryButton
                  label={category}
                  onSelect={handleCategorySelect}
                  isSelected={selectedCategory === category}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="p-8 bg-white rounded-lg">
          <p className="text-xs text-gray-800">
            Type the title of your story and a brief plot for your story in the
            provided text boxes <br />
            below, being sure to keep it under 80 characters and be very
            descriptive.
          </p>
          <div className="grid grid-cols-2 gap-4 mt-6 mb-2">
            <TextInput
              label="Title"
              placeholder="Enter title"
              maxLength={80}
              onChange={handleTitleChange} // Use onChange instead of onKeyDown
              value={storyData.title}
            />
            <SelectInput
              label="Privacy"
              options={privacyOptions}
              value={storyData.privacy}
              onChange={handlePrivacyChange}
            />
            {/* <SelectInput label="Privacy" options={privacyOptions} /> */}
          </div>
          <Button
            variant="contained"
            size="large"
            onClick={handleCreateStory}
            disabled={isLoading}
            className="w-full py-3 text-gray-700 transition duration-300 bg-gray-300 rounded-lg hover:bg-green-500 hover:bg-opacity-50"
          >
            {isLoading ? (
              <CircularProgress size={24} className="text-white" />
            ) : (
              "Create"
            )}
          </Button>

          {error && (
            <Typography color="error" className="mt-4">
              {error}
            </Typography>
          )}
        </div>
      </div>
    </div>
  );
}
