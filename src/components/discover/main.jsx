"use client";

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import cover from "@/assets/images/boyanddog.webp";
import { useStories } from "@/hooks/useStories";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/axios";
import { Search, Filter, ChevronDown } from "lucide-react";

const genres = [
  "All Genres",
  "Fantasy",
  "Science Fiction",
  "Mystery",
  "Romance",
  "Horror",
  "Thriller",
  "Adventure",
  "Historical Fiction",
  "Other",
];

const MainContent = () => {
  const { pStories, fetchPStories } = useStories();
  const [storiesWithAuthors, setStoriesWithAuthors] = useState([]);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("All Genres");
  const [showGenreDropdown, setShowGenreDropdown] = useState(false);

  // Check if a string is a base64 data URI
  const isBase64Image = (str) => {
    return typeof str === "string" && str.startsWith("data:image/");
  };

  useEffect(() => {
    const loadStories = async () => {
      setIsLoading(true);
      await fetchPStories();
      setIsLoading(false);
    };

    // Only load stories on initial mount
    loadStories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Remove fetchPStories from the dependency array to prevent infinite calls

  // Fetch author information for stories only when pStories changes
  useEffect(() => {
    // Skip if no stories to process
    // if (!pStories?.length) return;

    // Skip if we already have the same number of stories with authors and they all have valid author names
    if (
      storiesWithAuthors?.length === pStories?.length &&
      storiesWithAuthors?.every(
        (story) => story.author_name && story.author_name !== "Unknown Author"
      )
    ) {
      return;
    }

    const getAuthorInfo = async () => {
      try {
        const updatedStories = await Promise.all(
          pStories?.map(async (story) => {
            // If we already have a valid author_name for this story, keep it
            const existingStory = storiesWithAuthors.find(
              (s) => s.story_id === story.story_id
            );
            if (
              existingStory?.author_name &&
              existingStory.author_name !== "Unknown Author"
            ) {
              return {
                ...story,
                author_name: existingStory.author_name,
              };
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
      } catch (error) {
        console.error("Error fetching author information:", error);
      }
    };

    getAuthorInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pStories]); // Only depend on pStories

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleGenreSelect = (genre) => {
    setSelectedGenre(genre);
    setShowGenreDropdown(false);
  };

  // Filter stories based on search term and genre
  const getFilteredStories = () => {
    const storiesToFilter =
      storiesWithAuthors.length > 0 ? storiesWithAuthors : pStories;

    if (!storiesToFilter?.length) return [];

    // If no filters are applied, return all stories
    if (!searchTerm && selectedGenre === "All Genres") {
      return storiesToFilter;
    }

    return storiesToFilter.filter((story) => {
      // Handle title search
      let titleMatch = true;
      if (searchTerm) {
        const storyTitle =
          typeof story?.title === "string" ? story.title.toLowerCase() : "";
        titleMatch = storyTitle.includes(searchTerm.toLowerCase());
      }

      // Handle genre filter
      let genreMatch = true;
      if (selectedGenre && selectedGenre !== "All Genres") {
        const storyGenre = story?.genre ? story.genre.toLowerCase() : "";
        genreMatch = storyGenre === selectedGenre.toLowerCase();
      }

      return titleMatch && genreMatch;
    });
  };

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

  const filteredStories = getFilteredStories();

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

  return (
    <main className="flex flex-col min-h-screen px-4 sm:px-6 lg:px-8 curso">
      {/* Header */}
      <div className="text-center text-gray-700 mt-16">
        <h1 className="text-6xl font-bold">Discover</h1>
        <p className="mt-4 text-lg">
          Unleash the storyteller within! Explore our curated collection…
        </p>
      </div>

      {/* Search & Filter */}
      <div className="mt-12 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
            placeholder="Search stories…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="relative w-full sm:w-48">
          <button
            onClick={() => setShowGenreDropdown(!showGenreDropdown)}
            className="flex items-center justify-between w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            <div className="flex items-center">
            <Filter className="w-4 h-4 mr-2 text-gray-400" />
            {selectedGenre}
            </div>
            <ChevronDown className="w-4 h-4 ml-2 text-gray-400" />
          </button>
          {showGenreDropdown && (
            <div className="absolute right-0 z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
              {genres.map((g) => (
                <button
                  key={g}
                  onClick={() => {
                    setSelectedGenre(g);
                    setShowGenreDropdown(false);
                  }}
                  className={`block w-full text-left px-4 py-2 text-sm hover:bg-green-100 ${
                    g === selectedGenre ? "bg-green-100 font-medium" : ""
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Stories Grid */}
      <section className="mt-12 mb-24">
        {filteredStories.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-gray-500">
            No stories found
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredStories.map((story) => (
              <div
                key={story.story_id}
                className="relative group transform transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                onClick={() =>
                  router.push(`/create/passage/${story.story_id}/view`)
                }
              >
                {/* Card Image */}
                <div className="relative h-64 w-full overflow-hidden rounded-xl shadow-md group-hover:shadow-lg">
                  {isBase64Image(story.cover_image) ? (
                    <div
                      className="absolute inset-0 bg-center bg-cover brightness-50 transition-transform duration-500 group-hover:scale-110"
                      style={{ backgroundImage: `url(${story.cover_image})` }}
                    />
                  ) : (
                    <Image
                      src={cover}
                      alt={story.title || "Story cover"}
                      fill
                      className="object-cover brightness-50 transition-transform duration-500 group-hover:scale-110"
                    />
                  )}
                </div>

                {/* Genre Badge */}
                <span className="absolute top-3 left-3 px-2.5 py-1 text-xs font-medium text-green-100 bg-blue-900 bg-opacity-70 rounded-lg backdrop-blur-sm">
                  {story.genre || "Other"}
                </span>

                {/* Title & Author Overlay */}
                <div className="absolute bottom-3 left-3 right-3 p-3 bg-gradient-to-t from-blue-950 to-blue-900/60 rounded-lg backdrop-blur-sm">
                  <h3 className="truncate font-bold text-white">
                    {story.title?.split(":")[0].replace(/^"|"$/g, "") ||
                      "Untitled"}
                  </h3>
                  <p className="mt-1 text-xs text-blue-100/90">
                    Read story by {story.author_name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
};

export default MainContent;
