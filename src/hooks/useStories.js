import { useAtom } from "jotai";
import { useRouter } from "next/navigation";
import {
  storyDataAtom,
  storyProgressAtom,
  storyLoadingAtom,
  storyErrorAtom,
  currentStoryIdAtom,
  storiesAtom,
  pStoriesAtom,
  passagesAtom,
} from "@/store/atoms";
import apiClient from "@/lib/axios";
import { useState } from "react";
import storyApiClient from "@/lib/storyApi";
import { toast } from "react-hot-toast";

export function useStories() {
  const router = useRouter();

  // Atoms
  const [storyData, setStoryData] = useAtom(storyDataAtom);
  const [stories, setStories] = useAtom(storiesAtom);
  const [passages, setPassages] = useAtom(passagesAtom);
  const [pStories, setPStories] = useAtom(pStoriesAtom);
  const [, setProgress] = useAtom(storyProgressAtom);
  const [, setIsLoading] = useAtom(storyLoadingAtom);
  const [error, setError] = useAtom(storyErrorAtom);
  const [currentStoryId, setCurrentStoryId] = useAtom(currentStoryIdAtom);

  const [collabStories, setCollabStories] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch stories for a user
  const fetchStories = async (userId) => {
    if (!userId) return [];

    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.get("/author/stories", {
        params: { author: userId },
      });
      setStories(response.data);
      setProgress(100);
      return response.data;
    } catch (err) {
      setError("Failed to fetch stories");
      console.error(err);
      setStories([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPStories = async () => {
    try {
      setIsLoading(true);
      setError("");

      const response = await apiClient.get("author/pStories");
      console.log(response.data);
      setPStories(response.data);
      return response.data;
    } catch (error) {
      console.error("Failed to fetch stories:", error);
      setError("Failed to fetch stories");
      setPStories([]);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCollaborativeStories = async (userId) => {
    if (!userId) return [];

    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get("/author/collaborative/stories", {
        params: { author: userId },
      });
      setCollabStories(response.data);
      return response.data;
    } catch (err) {
      setError("Failed to fetch collaborative stories");
      console.error(err);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchStoryById = async (storyId, userId) => {
    if (!storyId || !userId) return null;

    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get(`/author/stories/${storyId}`, {
        params: { user_id: userId },
      });
      setStoryData(response.data);
      return response.data;
    } catch (err) {
      setError("Failed to fetch story");
      console.error(err);
      toast.error("Failed to load story");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateStory = async (storyId, data, userId) => {
    if (!storyId || !userId) return null;

    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.put(`/author/stories/${storyId}`, {
        ...data,
        user_id: userId,
      });
      setStoryData(response.data);
      toast.success("Story updated successfully");
      return response.data;
    } catch (err) {
      setError("Failed to update story");
      console.error(err);
      toast.error("Failed to update story");
      return null;
    } finally {
      setLoading(false);

  const fetchPassages = async (userId) => {
    try {
      setIsLoading(true);
      setError("");

      const response = await apiClient.get('author/passages', { 
        params: { author: userId } 
      });
      console.log(response);
      setPassages(response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch passages:', error);
      setError("Failed to fetch passages");
      setPassages([]);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    // State
    stories,
    pStories,
    storyData,
    passages,
    currentStoryId,
    collabStories,
    loading,
    error,

    // Methods
    fetchStories,
    fetchPStories,
    fetchCollaborativeStories,
    fetchStoryById,
    updateStory,
    fetchPassages,
    
    // Setters for direct manipulation
    setPStories,
    setStories,
    setPassages,
    setStoryData,
    setCurrentStoryId,
  };
}
