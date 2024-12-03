import { useAtom } from 'jotai';
import { useRouter } from 'next/navigation';
import {
  storyDataAtom,
  storyProgressAtom,
  storyLoadingAtom,
  storyErrorAtom,
  currentStoryIdAtom,
  storiesAtom,
  pStoriesAtom
} from '@/store/atoms';
import apiClient from '@/lib/axios';

export function useStories() {
  const router = useRouter();
  
  // Atoms
  const [storyData, setStoryData] = useAtom(storyDataAtom);
  const [stories, setStories] = useAtom(storiesAtom);
  const [pStories, setPStories] = useAtom(pStoriesAtom);
  const [, setProgress] = useAtom(storyProgressAtom);
  const [, setIsLoading] = useAtom(storyLoadingAtom);
  const [, setError] = useAtom(storyErrorAtom);
  const [currentStoryId, setCurrentStoryId] = useAtom(currentStoryIdAtom);

  // Fetch stories for a user
  const fetchStories = async (userId) => {
    try {
      setIsLoading(true);
      setError("");

      const response = await apiClient.get('author/stories', { 
        params: { author: userId } 
      });
      console.log(response);
      setStories(response.data);
      setProgress(100);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch stories:', error);
      setError("Failed to fetch stories");
      setStories([]);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPStories = async () => {
    try {
      setIsLoading(true);
      setError("");

      const response = await apiClient.get('author/pStories');
      console.log(response.data);
      setPStories(response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch stories:', error);
      setError("Failed to fetch stories");
      setPStories([]);
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
    currentStoryId,
    
    // Methods
    fetchStories,
    fetchPStories,
    
    // Setters for direct manipulation
    setPStories,
    setStories,
    setStoryData,
    setCurrentStoryId,
  };
}