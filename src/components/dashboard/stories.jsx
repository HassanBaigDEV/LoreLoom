"use client";
import React, { useState, useEffect } from "react";
import { useStories } from "@/hooks/useStories";
import { useAtom } from "jotai";
import { userAtom } from "@/store/atoms";
import Image from "next/image";
import cover from "@/assets/images/seilala-cover.webp";
import {
  BookOpen,
  Loader2,
  Users,
  Settings,
  Pencil,
  Trash,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "react-hot-toast";
import apiClient from "@/lib/axios";

export default function Stories({ hideHeader = false, filterParams = {} }) {
  const [user] = useAtom(userAtom);
  const { stories, collabStories, fetchStories, fetchCollaborativeStories } =
    useStories();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStory, setSelectedStory] = useState(null);
  const [authorNames, setAuthorNames] = useState({});
  const { searchTerm = "", selectedGenre = null } = filterParams;

  // Add a function to get author info
  const getAuthorInfo = async (authorId) => {
    if (!authorId) return "Unknown Author";
    try {
      const response = await apiClient.get(`/user/author/${authorId}`);
      const authorData = response.data;
      // Create author name from first and last name, or use username
      let authorName = `${authorData.first_name || ""} ${
        authorData.last_name || ""
      }`.trim();
      if (!authorName) {
        authorName = authorData.username || "Unknown Author";
      }
      return authorName;
    } catch (error) {
      console.error(`Error fetching author for story:`, error);
      return "Unknown Author";
    }
  };

  useEffect(() => {
    if (user?.id) {
      const loadData = async () => {
        setIsLoading(true);
        await Promise.all([
          fetchStories(user?.id),
          fetchCollaborativeStories(user?.id),
        ]);
        setIsLoading(false);
      };
      loadData();
    }
  }, [user]);

  // Add effect to load author names for all stories
  useEffect(() => {
    const fetchAllAuthorNames = async () => {
      const allStories = [...(stories || []), ...(collabStories || [])];
      if (allStories.length === 0) return;

      // Create a copy of the current authorNames
      const nameMap = { ...authorNames };
      let hasNewAuthors = false;

      // Only fetch authors we don't already have
      for (const story of allStories) {
        if (story.author && !nameMap[story.author]) {
          hasNewAuthors = true;
          const name = await getAuthorInfo(story.author);
          nameMap[story.author] = name;
        }
      }

      // Only update state if we have new authors
      if (hasNewAuthors) {
        setAuthorNames(nameMap);
      }
    };

    fetchAllAuthorNames();
  }, [stories, collabStories]); // Remove authorNames dependency

  const handleEditStory = (story) => {
    if (!story?.story_id) return;
    router.push(`/create/plan/${story?.story_id}`);
  };

  const handleWriteStory = (story) => {
    if (!story?.story_id) return;
    router.push(`/create/passage/${story?.story_id}`);
  };

  const handleStorySettings = (story) => {
    if (!story?.story_id) return;
    router.push(`/story/${story?.story_id}/settings`);
  };

  const handleDeleteStory = (story) => {
    if (!window.confirm("Are you sure you want to delete this story?")) return;
    toast.error("Delete functionality not yet implemented");
  };

  // Check if a string is a base64 data URI
  const isBase64Image = (str) => {
    return typeof str === "string" && str.startsWith("data:image/");
  };

  // Filter stories based on search term and genre
  const filterStories = (storyList) => {
    if (!storyList) return [];

    // If no filters are applied, return all stories
    if (!searchTerm && !selectedGenre) {
      return storyList;
    }

    return storyList.filter((story) => {
      // Handle title search
      let titleMatch = true;
      if (searchTerm) {
        const storyTitle =
          typeof story?.title === "string" ? story.title.toLowerCase() : "";
        titleMatch = storyTitle.includes(searchTerm.toLowerCase());
      }

      // Handle genre filter
      let genreMatch = true;
      if (selectedGenre) {
        const storyGenre = story?.genre ? story.genre.toLowerCase() : "";
        genreMatch = storyGenre === selectedGenre.toLowerCase();
      }

      return titleMatch && genreMatch;
    });
  };

  if (isLoading) {
    return (
      <div className="mt-8 mb-48">
        {!hideHeader && (
          <div className="flex items-center gap-2 mb-8">
            <BookOpen className="w-8 h-8 text-green-500" />
            <h2 className="text-2xl font-semibold">Your Stories</h2>
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 mx-auto sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-[200px] w-full rounded-2xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-3 w-[150px]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const renderStoryGrid = (storyList, isCollaborative = false) => {
    const filteredStories = filterStories(storyList);

    if (!filteredStories?.length) {
      return (
        <div className="flex items-center justify-center w-full h-64">
          <p className="text-gray-500">
            {searchTerm || selectedGenre
              ? "No stories found matching your filters"
              : isCollaborative
              ? "No collaborative stories found"
              : "No stories found"}
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-8 mx-auto sm:grid-cols-2 lg:grid-cols-3">
        {filteredStories?.map((story, index) => {
          const isAuthor = !isCollaborative;
          const hasCoverImage =
            story?.cover_image && isBase64Image(story.cover_image);

          // Get author name either from story.author_name or from our cached authorNames
          const storyAuthorName =
            story?.author_name ||
            (story?.author && authorNames[story?.author]) ||
            "Unknown Author";

          return (
            <div
              key={story?.id ?? index}
              className="relative block w-full group transform transition-all duration-300 hover:translate-y-[-5px]"
              onClick={() =>
                router.push(`/create/passage/${story?.story_id}/view`)
              }
            >
              <div className="relative w-full h-64 overflow-hidden transition-shadow shadow-md cursor-pointer rounded-xl hover:shadow-lg">
                {hasCoverImage ? (
                  <div
                    className="w-full h-full transition-transform duration-700 bg-center bg-cover brightness-50 group-hover:scale-110"
                    style={{
                      backgroundImage: `url(${story?.cover_image})`,
                      backgroundPosition: "center",
                      backgroundSize: "cover",
                    }}
                  />
                ) : (
                  <div className="relative w-full h-full">
                    <Image
                      src={cover}
                      className="object-cover w-full h-full transition-transform duration-700 brightness-50 group-hover:scale-110"
                      alt={story?.title ?? "Story cover"}
                      fill
                    />
                  </div>
                )}
              </div>

              <div className="absolute top-3 left-3">
                <span className="px-2.5 py-1 text-xs font-medium text-green-100 transition-colors bg-blue-900 bg-opacity-70 rounded-lg backdrop-blur-sm hover:bg-blue-900/80">
                  {story?.genre ?? "Other"}
                </span>
              </div>

              {isCollaborative && (
                <div className="absolute top-3 right-16">
                  <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-green-100 transition-colors rounded-lg bg-blue-900/60 backdrop-blur-sm hover:bg-blue-900/90">
                    <Users className="w-3 h-3" />
                    Collaborative
                  </span>
                </div>
              )}

              <div className="absolute top-3 right-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white transition-all bg-gray-800/50 hover:bg-gray-800/70 backdrop-blur-sm"
                      onClick={e => e.stopPropagation()}
                    >
                      •••
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="min-w-[150px]">
                    <DropdownMenuItem 
                    onClick={e => {
                      e.stopPropagation();
                      handleWriteStory(story)
                      }}>
                      <Pencil className="w-4 h-4 mr-2" />
                      Write
                    </DropdownMenuItem>

                    {isAuthor && (
                      <DropdownMenuItem 
                      onClick={e => {
                      e.stopPropagation();
                      handleEditStory(story)
                      }}>
                        <BookOpen className="w-4 h-4 mr-2" />
                        Plan Story
                      </DropdownMenuItem>
                    )}

                    <DropdownMenuItem
                      onClick={e => {
                      e.stopPropagation();
                      handleStorySettings(story)
                      }}>
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </DropdownMenuItem>

                    {isAuthor && (
                      <DropdownMenuItem
                        onClick={e => {
                      e.stopPropagation();
                      handleWriteStory(story)
                      }}
                        className="text-red-500 hover:text-red-700 focus:text-red-700"
                      >
                        <Trash className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div
                className="absolute cursor-pointer bottom-3 left-3 right-3"
                onClick={() => handleWriteStory(story)}
              >
                <div className="p-3 transition-colors rounded-lg bg-gradient-to-t from-blue-950 to-blue-900/70 backdrop-blur-sm group-hover:from-blue-900 group-hover:to-blue-800/80">
                  <h3 className="font-bold text-white truncate">
                    {typeof story?.title === "string"
                      ? story?.title.split(":")[0]?.replace(/^"|"$/g, "")
                      : "Untitled"}
                  </h3>
                  <p className="mt-1 text-xs text-blue-100/90">
                    {isCollaborative
                      ? `Collaborative story with ${storyAuthorName}`
                      : `Your story by ${
                          storyAuthorName || user?.last_name || "You"
                        }`}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="mt-8 mb-48">
      {!hideHeader && (
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-green-500" strokeWidth={1.5} />
            <h2 className="text-2xl font-semibold">Stories</h2>
          </div>
          <button
            onClick={() => router.push("/stories")}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-green-500 transition-colors border border-transparent rounded-lg bg-green-50 hover:bg-green-100"
          >
            View All Stories
          </button>
        </div>
      )}

      <Tabs defaultValue="mystories" className="w-full">
        <TabsList className="mb-6 bg-white border border-gray-200 rounded-lg">
          <TabsTrigger
            value="mystories"
            className="data-[state=active]:bg-green-500 data-[state=active]:text-white"
          >
            My Stories
          </TabsTrigger>
          <TabsTrigger
            value="collaborative"
            className="data-[state=active]:bg-green-500 data-[state=active]:text-white"
          >
            Collaborative
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mystories">
          <section>{renderStoryGrid(stories)}</section>
        </TabsContent>

        <TabsContent value="collaborative">
          <section>{renderStoryGrid(collabStories, true)}</section>
        </TabsContent>
      </Tabs>
    </div>
  );
}
