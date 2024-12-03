import { useAtom } from 'jotai';
import { useRouter } from 'next/navigation';
import {
  storyDataAtom,
  storyProgressAtom,
  storyLoadingAtom,
  storyErrorAtom,
  currentStoryIdAtom,
  storiesAtom
} from '@/store/atoms';
import apiClient from '@/lib/axios';

export function useStories() {
  const router = useRouter();
  
  // Atoms
  const [storyData, setStoryData] = useAtom(storyDataAtom);
  const [stories, setStories] = useAtom(storiesAtom);
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

  return {
    // State
    stories,
    storyData,
    currentStoryId,
    
    // Methods
    fetchStories,
    
    // Setters for direct manipulation
    setStories,
    setStoryData,
    setCurrentStoryId,
  };
}