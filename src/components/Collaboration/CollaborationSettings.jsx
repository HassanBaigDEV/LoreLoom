import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useCollaboration } from "@/hooks/useCollaboration";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import CollaboratorList from "./CollaboratorList";
import { Info, Share2, LinkIcon } from "lucide-react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/axios";

export default function CollaborationSettings({ storyId, storyAuthorId }) {
  const { user } = useAuth();
  const [isAuthor, setIsAuthor] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [isCheckingAuthor, setIsCheckingAuthor] = useState(true);
  const [fetchedAuthorId, setFetchedAuthorId] = useState(null);
  const router = useRouter();
  const hasCheckedAuthor = useRef(false);

  // Check if the current user is the author
  useEffect(() => {
    const checkAuthorStatus = async () => {
      // Skip if we've already checked
      if (hasCheckedAuthor.current) return;

      setIsCheckingAuthor(true);
      hasCheckedAuthor.current = true;

      try {
        // If we already have storyAuthorId and user, do direct comparison
        if (user?.id && storyAuthorId) {
          console.log("Direct comparison:", user.id, storyAuthorId);
          setIsAuthor(user.id === storyAuthorId);
          setFetchedAuthorId(storyAuthorId);
          setIsCheckingAuthor(false);
          return;
        }

        // If we don't have storyAuthorId but have user and storyId, fetch story details
        if (user?.id && storyId) {
          console.log("Fetching story details for author check");
          try {
            // First try with the apiClient from axios.js
            const response = await apiClient.get(`/author/stories/${storyId}`);
            if (response.data?.author) {
              console.log("Got author from apiClient:", response.data.author);
              setFetchedAuthorId(response.data.author);
              setIsAuthor(user.id === response.data.author);
              setIsCheckingAuthor(false);
              return;
            }
          } catch (apiError) {
            console.warn("apiClient request failed, trying fetch:", apiError);
            // Fall back to fetch if apiClient fails
            const response = await fetch(`/author/stories/${storyId}`);
            if (response.ok) {
              const data = await response.json();
              if (data.author) {
                console.log("Got author from fetch:", data.author);
                setFetchedAuthorId(data.author);
                setIsAuthor(user.id === data.author);
              }
            }
          }
        }
      } catch (error) {
        console.error("Error checking story author:", error);
      } finally {
        setIsCheckingAuthor(false);
      }
    };

    checkAuthorStatus();

    return () => {
      // Reset on unmount
      hasCheckedAuthor.current = false;
    };
  }, [user?.id, storyAuthorId, storyId]);

  // Set share URL when component mounts
  useEffect(() => {
    if (storyId) {
      // Create a link that collaborators can use to access the story
      setShareUrl(`${window.location.origin}/create/passage/${storyId}/view`);
    }
  }, [storyId]);

  // Function to copy a collaboration link to clipboard
  const copyCollaborationLink = () => {
    navigator.clipboard
      .writeText(shareUrl)
      .then(() => {
        toast.success("Collaboration link copied to clipboard");
      })
      .catch(() => {
        toast.error("Failed to copy link");
      });
  };

  // Handle navigation to the edit page
  const handleViewStory = () => {
    if (storyId) {
      router.push(`/story/${storyId}`);
    }
  };

  if (isCheckingAuthor) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }

  // Only show the author info missing warning if we've tried to fetch the author and couldn't find it
  const shouldShowAuthorWarning =
    !isAuthor && !storyAuthorId && !fetchedAuthorId && !isCheckingAuthor;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Collaboration Settings</CardTitle>
          <CardDescription>
            Manage who can collaborate on this story
          </CardDescription>
        </CardHeader>
        <CardContent>
          {shouldShowAuthorWarning && (
            <div className="bg-yellow-50 p-4 rounded-md mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Info
                    className="h-5 w-5 text-yellow-400"
                    aria-hidden="true"
                  />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Author information is missing
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      The story author information is not available.
                      Collaboration features may be limited.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isAuthor && (
            <div className="bg-green-50 p-4 rounded-md mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Info className="h-5 w-5 text-green-500" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">
                    You are the author of this story
                  </h3>
                  <div className="mt-2 text-sm text-green-700">
                    <p>
                      As the author, you can add or remove collaborators and
                      manage all aspects of the story.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <Tabs defaultValue="collaborators">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="collaborators">Collaborators</TabsTrigger>
              <TabsTrigger value="sharing">Sharing</TabsTrigger>
            </TabsList>

            <TabsContent value="collaborators" className="mt-4">
              <CollaboratorList storyId={storyId} isAuthor={isAuthor} />
            </TabsContent>

            <TabsContent value="sharing" className="mt-4">
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Collaboration Link</h3>
                  <p className="text-sm text-gray-500">
                    Share this link with collaborators. They will need to be
                    added as collaborators before they can edit.
                  </p>

                  <div className="flex space-x-2">
                    <Input
                      readOnly
                      value={shareUrl}
                      className="flex-grow font-mono text-sm"
                    />
                    <Button
                      onClick={copyCollaborationLink}
                      className="flex items-center"
                    >
                      <Share2 className="h-4 w-4 mr-1" /> Copy
                    </Button>
                  </div>
                </div>

                <div className="mt-6">
                  <Button
                    variant="outline"
                    onClick={handleViewStory}
                    className="flex items-center"
                  >
                    <LinkIcon className="h-4 w-4 mr-1" /> View Story
                  </Button>
                </div>

                <div className="border-t pt-4 space-y-2">
                  <h3 className="text-sm font-medium">
                    Collaboration Guidelines
                  </h3>
                  <ul className="text-sm text-gray-600 space-y-1 list-disc pl-5">
                    <li>
                      Only the story author can add or remove collaborators
                    </li>
                    <li>Collaborators can edit all parts of the story</li>
                    <li>All changes are synced in real-time</li>
                    <li>
                      Multiple people can work on the story simultaneously
                    </li>
                    <li>You'll see who is currently editing the story</li>
                  </ul>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
