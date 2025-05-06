import React, { useEffect, useMemo } from "react";
import Image from "next/image";
import token from "@/assets/images/STBK-token.webp";
import { BookOpen as StoryIcon } from "lucide-react";
import { useStories } from "@/hooks/useStories";

const StatisticsSection = () => {
  const { stories, passages, fetchStories, fetchPassages } = useStories();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user") || '{}');
        if (user?.id) {
          await fetchStories(user.id);
          await fetchPassages(user.id);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  const totalCharacters = useMemo(() => {
    return stories?.reduce((total, story) => {
      return total + (story.characters?.length || 0);
    }, 0) || 0;
  }, [stories]);

  const completedPlannings = useMemo(() => {
    if (!stories) return 0;

    const elements = ["title", "genre", "premise", "setting", "characters", "outline"];
    
    return stories.filter((story) => {
      const completed = elements.filter((elem) =>
        Array.isArray(story[elem]) ? story[elem].length > 0 : Boolean(story[elem])
      ).length;
      return completed === elements.length;
    }).length;
  }, [stories]);

  return (
    <div className="col-span-4 overflow-hidden bg-white rounded-lg shadow">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900">
          Your Statistics
        </h3>
        <div className="flex justify-between mt-5">
          <div className="flex items-center text-center">
            <Image
              src={token}
              alt="Token icon"
              width={40}
              height={40}
              className="pr-2"
            />
            <div>
              <div className="text-4xl font-semibold text-yellow-500">999+</div>
              <div className="text-sm text-gray-500">Tokens</div>
            </div>
          </div>
          <div className="flex items-center">
            <StoryIcon
              className="w-8 h-8 mb-4 mr-2 text-blue-950"
              strokeWidth={1.5}
            />
            <div>
              <div className="text-4xl font-semibold text-blue-900">
                {stories?.length || 0}
              </div>
              <div className="text-sm text-gray-500">Stories</div>
            </div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-semibold text-gray-900">
              {passages?.length || 0}
            </div>
            <div className="text-sm text-gray-500">Passages</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-semibold text-gray-900">
              {totalCharacters}
            </div>
            <div className="text-sm text-gray-500">Characters</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-semibold text-gray-900">
              {completedPlannings}
            </div>
            <div className="text-sm text-gray-500">Plannings Completed</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatisticsSection;
