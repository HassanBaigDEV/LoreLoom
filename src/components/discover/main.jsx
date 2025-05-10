"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import cover from "@/assets/images/boyanddog.webp";
import StoriesIcon from "@/assets/images/story.svg";
import { useStories } from "@/hooks/useStories";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/axios";

const MainContent = () => {
  const { pStories, fetchPStories } = useStories();
  const [storiesWithAuthors, setStoriesWithAuthors] = useState([]);
  const router = useRouter();

  // Check if a string is a base64 data URI
  const isBase64Image = (str) => {
    return typeof str === "string" && str.startsWith("data:image/");
  };
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStories = async () => {
      setIsLoading(true);
      await fetchPStories();
      setIsLoading(false);
    };
    loadStories();
  }, []);

  useEffect(() => {
    // Fetch author information for each story
    const getAuthorInfo = async () => {
      if (!pStories?.length) return;

      // Skip if we already have author info for all stories
      if (storiesWithAuthors.length === pStories.length) {
        const allHaveNames = pStories.every(
          (story, index) =>
            storiesWithAuthors[index]?.author_name &&
            storiesWithAuthors[index]?.author_name !== "Unknown Author"
        );
        if (allHaveNames) return;
      }

      const updatedStories = await Promise.all(
        pStories.map(async (story) => {
          // If we already have a valid author_name, use it
          if (story.author_name && story.author_name !== "Unknown Author") {
            return story;
          }

          try {
            // Get author info using the author ID
            if (story.author) {
              const response = await apiClient.get(
                `/user/author/${story.author}`
              );
              const authorData = response.data;

              // Create author name from first and last name, or use username
              let authorName = `${authorData.first_name || ""} ${
                authorData.last_name || ""
              }`.trim();
              if (!authorName) {
                authorName = authorData.username || "Unknown Author";
              }

              return {
                ...story,
                author_name: authorName,
              };
            }
            return story;
          } catch (error) {
            console.error(
              `Error fetching author for story ${story.story_id}:`,
              error
            );
            return story;
          }
        })
      );

      setStoriesWithAuthors(updatedStories);
    };

    getAuthorInfo();
  }, [pStories, storiesWithAuthors]);

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="text-center text-gray-700">
          <h1 className="mt-32 text-6xl font-bold">Discover</h1>
          <p className="mt-5 text-gray-700 font-['Arial', sans-serif] text-lg">
            Loading stories...
          </p>
        </div>
      </div>
    );
  }
  const storiesToDisplay =
    storiesWithAuthors.length > 0 ? storiesWithAuthors : pStories;

  if (!pStories?.length) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="mt-8 mb-48">
          <div className="text-center text-gray-700">
            <h1 className="mt-32 text-6xl font-bold">Discover</h1>
            <p className="mt-5 text-gray-700 font-['Arial', sans-serif] text-lg">
              Discover Unleash the storyteller within! Explore our curated
              collection of <br /> customer-created tales, from heartwarming
              family memories to <br /> thrilling adventures. With StoryWeaver,
              the world is your <br />
              playground. Join our community of story crafters today!
            </p>
          </div>
          <div className="flex items-center justify-center w-full h-64">
            <p className="text-gray-500">No stories found</p>
          </div>
        </div>
      </div>
    );
  }

  // Prefer storiesWithAuthors if available, otherwise fall back to pStories

  return (
    <main className="flex flex-col min-h-screen">
      <div className="text-center text-gray-700">
        <h1 className="mt-32 text-6xl font-bold">Discover</h1>
        <p className="mt-5 text-gray-700 font-['Arial', sans-serif] text-lg">
          Discover Unleash the storyteller within! Explore our curated
          collection of <br /> customer-created tales, from heartwarming family
          memories to <br /> thrilling adventures. With StoryWeaver, the world
          is your <br />
          playground. Join our community of story crafters today!
        </p>
      </div>
      <section className="m-32">
        <div className="grid grid-cols-1 gap-8 mx-auto sm:grid-cols-2 lg:grid-cols-3">
          {storiesToDisplay.map((story, index) => {
            const hasCoverImage =
              story?.cover_image && isBase64Image(story?.cover_image);

            return (
              <div
                key={index}
                className="relative w-full h-64 overflow-hidden cursor-pointer rounded-2xl"
                onClick={() =>
                  router.push(`/create/passage/${story?.story_id}/view`)
                }
              >
                {hasCoverImage ? (
                  <div
                    className="w-full h-full  bg-center bg-cover brightness-50"
                    style={{
                      backgroundImage: `url(${story?.cover_image})`,
                      backgroundPosition: "center",
                      backgroundSize: "cover",
                    }}
                  />
                ) : (
                  <Image
                    src={cover}
                    className="object-cover w-full h-full brightness-50"
                    alt={story?.title}
                  />
                )}

                <div className="absolute top-2 left-4">
                  <span className="px-2 py-1 text-xs text-green-100 transition-colors bg-blue-900 bg-opacity-50 rounded-lg backdrop-blur-sm hover:bg-blue-900/80">
                    {story?.genre}
                  </span>
                </div>

                <div className="absolute bottom-2 left-2 right-2">
                  <div className="p-2 transition-colors bg-blue-900 rounded-lg bg-opacity-40 backdrop-blur-sm hover:bg-blue-950">
                    <h3 className="font-bold truncate text-green-50">
                      {story?.title?.split(":")[0].replace(/^"|"$/g, "")}
                    </h3>
                    <p className="text-xs text-green-200/80">
                      Read story by {story.author_name || "Unknown Author"}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
};

export default MainContent;
