"use client";

import React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import CategoryButton from "@/components/generation/button";
import {
  TextInput,
  TextAreaInput,
  SelectInput,
} from "@/components/generation/form";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import UpgradeBanner from "@/components/generation/banner";

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

  const categories = [
    "Sci-Fi",
    "Jamaican",
    "Adventure",
    "Mystery",
    "Animal",
    "Inspirational",
  ];
  const ageOptions = ["Below 18 years", "18+ years"];

  return (
    <div className="min-h-screen p-8 bg-gray-200">
      <h1 className="mt-32 mb-8 text-4xl font-semibold text-gray-800 text-bold">
        Create Story
      </h1>
      <div className="grid grid-cols-2 gap-8">         
        <div className="space-y-8">
        <p className="mb-6 text-gray-600">
        Select a story type and enter the details in the form provided to <br />
        start crafting your story today.
      </p>
          <div className="grid grid-cols-3 gap-8">
            {categories.map((category, index) => (
              <div key={index} className="flex justify-center">
                <CategoryButton
                  label={category}
                />
              </div>
            ))}
          </div>
          <UpgradeBanner />
        </div>

        <div className="p-8 bg-white rounded-lg">
          <p className="text-xs text-gray-800">
            Type the title of your story and a brief plot for your story in the
            provided text boxes <br />
            below, being sure to keep it under 80 characters and be very
            descriptive.
          </p>
          <div className="grid grid-cols-2 gap-4 mt-6 mb-8">
            <TextInput label="Title" placeholder="Enter title" maxLength={80} />
            <SelectInput label="Age" options={ageOptions} />
          </div>
          <TextAreaInput
            label="Premise"
            placeholder="Enter Premise here"
            maxLength={1739}
          />
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={handleCreateStory}
            disabled={isLoading}
            className="w-full py-3 text-gray-700 transition duration-300 bg-gray-300 rounded-lg hover:bg-gray-400"
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
