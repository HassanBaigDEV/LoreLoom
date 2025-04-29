"use client";
import React, { useState, useEffect } from "react";
import { useStories } from "@/hooks/useStories";
import { useAtom } from "jotai";
import { userAtom } from "@/store/atoms";
import Image from "next/image";
import cover from "@/assets/images/seilala-cover.webp";
import { BookOpen, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

export default function Stories() {
  const [user] = useAtom(userAtom);
  const { stories, fetchStories } = useStories();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStory, setSelectedStory] = useState(null);

  useEffect(() => {
    if (user?.id) {
      fetchStories(user?.id).finally(() => setIsLoading(false));
    }
  }, [user]);

  const handleEditStory = (story) => {
    if (!story?.story_id) return;
    router.push(`/create/plan/${story.story_id}`);
  };

  if (isLoading) {
    return (
      <div className="mt-8 mb-48">
        <div className="flex items-center gap-2 mb-8">
          <BookOpen className="w-6 h-6 text-green-500" />
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

  if (!stories?.length) {
    return (
      <div className="mt-8 mb-48">
        <div className="flex items-center gap-2 mb-8">
          <BookOpen className="w-6 h-6 text-green-500" />
          <h2 className="text-2xl font-semibold">Your Stories</h2>
        </div>
        <div className="flex items-center justify-center w-full h-64">
          <p className="text-gray-500">No stories found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 mb-48">
      <div className="flex items-center gap-2 mb-8">
        <BookOpen className="w-6 h-6 text-green-500" />
        <h2 className="text-2xl font-semibold">Your Stories</h2>
      </div>

      <section className="m-8">
        <div className="grid grid-cols-1 gap-8 mx-auto sm:grid-cols-2 lg:grid-cols-3">
          {stories.map((story, index) => (
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
                <span className="px-2 py-1 text-xs bg-green-600/80 backdrop-blur-sm rounded-lg text-green-100 transition-colors hover:bg-green-700/90">
                  {story.genre}
                </span>
              </div>

              <div className="absolute top-2 right-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-green-200 hover:bg-green-800/30 backdrop-blur-sm transition-all"
                    >
                      •••
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="min-w-[120px]">
                    <DropdownMenuItem onClick={() => handleEditStory(story)}>
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-500">
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="absolute bottom-2 left-2 right-2">
                <div className="p-2 bg-gray-900/90 backdrop-blur-sm rounded-lg transition-colors hover:bg-gray-800/90">
                  <h3 className="font-bold truncate text-green-50">
                    {story.title.split(":")[0].replace(/^"|"$/g, "")}
                  </h3>
                  <p className="text-xs text-green-200/80">
                    Read story by {user?.last_name}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
