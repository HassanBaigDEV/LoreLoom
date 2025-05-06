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

export default function Stories() {
  const [user] = useAtom(userAtom);
  const { stories, collabStories, fetchStories, fetchCollaborativeStories } =
    useStories();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStory, setSelectedStory] = useState(null);

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

  const handleEditStory = (story) => {
    if (!story?.story_id) return;
    router.push(`/create/plan/${story.story_id}`);
  };

  const handleWriteStory = (story) => {
    if (!story?.story_id) return;
    router.push(`/create/passage/${story.story_id}`);
  };

  const handleStorySettings = (story) => {
    if (!story?.story_id) return;
    router.push(`/story/${story.story_id}/settings`);
  };

  const handleDeleteStory = (story) => {
    // Add confirmation dialog
    if (!window.confirm("Are you sure you want to delete this story?")) return;

    // Delete story logic would go here
    toast.error("Delete functionality not yet implemented");
  };

  if (isLoading) {
    return (
      <div className="mt-8 mb-48">
        <div className="flex items-center gap-2 mb-8">
          <BookOpen className="w-8 h-8 text-blue-900" />
          <h2 className="text-2xl font-semibold">Your Stories</h2>
        </div>
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
    if (!storyList?.length) {
      return (

      <div className="mt-8 mb-48">
        <div className="flex items-center gap-2 mb-8">
          <BookOpen className="w-8 h-8 text-blue-900" />
          <h2 className="text-2xl font-semibold">Your Stories</h2>
        </div>
        
        <div className="flex items-center justify-center w-full h-64">
          <p className="text-gray-500">
            {isCollaborative
              ? "No collaborative stories found"
              : "No stories found"}
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-8 mx-auto sm:grid-cols-2 lg:grid-cols-3">
        {storyList.map((story, index) => {
          const isAuthor = !isCollaborative; // Author of own stories, collaborator otherwise

          return (
            <div
              key={story.id || index}
              className="relative block w-full group"
            >
              <Image
                src={cover}
                className="w-full h-auto mx-auto rounded-2xl brightness-50"
                alt={story.title}
              />

              <div className="absolute top-2 left-4">
                <span className="px-2 py-1 text-xs text-green-100 transition-colors bg-blue-900 bg-opacity-50 rounded-lg backdrop-blur-sm hover:bg-blue-900/80">
                  {story.genre}
                </span>
              </div>

              {isCollaborative && (
                <div className="absolute top-2 right-16">
                  <span className="px-2 py-1 text-xs flex items-center gap-1 bg-blue-600/80 backdrop-blur-sm rounded-lg text-blue-100 transition-colors hover:bg-blue-700/90">
                    <Users className="w-3 h-3" />
                    Collaborative
                  </span>
                </div>
              )}

              <div className="absolute top-2 right-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-green-200 transition-all hover:bg-blue-900/50 backdrop-blur-sm"
                    >
                      •••
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="min-w-[150px]">
                    {/* Always show Write option - both authors and collaborators can write */}
                    <DropdownMenuItem onClick={() => handleWriteStory(story)}>
                      <Pencil className="w-4 h-4 mr-2" />
                      Write
                    </DropdownMenuItem>

                    {/* Only authors can access the story planning */}
                    {isAuthor && (
                      <DropdownMenuItem onClick={() => handleEditStory(story)}>
                        <BookOpen className="w-4 h-4 mr-2" />
                        Plan Story
                      </DropdownMenuItem>
                    )}

                    {/* Both authors and collaborators can view settings, but only authors can change them */}
                    <DropdownMenuItem
                      onClick={() => handleStorySettings(story)}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Settings
                    </DropdownMenuItem>

                    {/* Only authors can delete their stories */}
                    {isAuthor && (
                      <DropdownMenuItem
                        onClick={() => handleDeleteStory(story)}
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
                className="absolute bottom-2 left-2 right-2 cursor-pointer"
                onClick={() => handleWriteStory(story)}
              >
                <div className="p-2 transition-colors bg-blue-900 bg-opacity-50 rounded-lg backdrop-blur-sm hover:bg-blue-950 ">
//               <div className="absolute bottom-2 left-2 right-2">
                  <h3 className="font-bold truncate text-green-50">
                  {typeof story.title === "string"
                    ? story.title.split(":")[0].replace(/^"|"$/g, "")
                    : "Untitled"}
                  </h3>
                  <p className="text-xs text-green-200/80">
                    {isCollaborative
                      ? `Collaborative story with ${
                          story.author_name || "Author"
                        }`
                      : `Your story by ${user?.last_name || "You"}`}
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
      <div className="flex items-center gap-2 mb-8">
        <BookOpen className="w-6 h-6 text-green-500" />
        <h2 className="text-2xl font-semibold">Stories</h2>
      </div>

      <Tabs defaultValue="mystories" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="mystories">My Stories</TabsTrigger>
          <TabsTrigger value="collaborative">Collaborative</TabsTrigger>
        </TabsList>

        <TabsContent value="mystories">
          <section className="m-8">{renderStoryGrid(stories)}</section>
        </TabsContent>

        <TabsContent value="collaborative">
          <section className="m-8">
            {renderStoryGrid(collabStories, true)}
          </section>
        </TabsContent>
      </Tabs>
    </div>
  );
}
