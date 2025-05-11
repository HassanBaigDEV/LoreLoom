import React, { useEffect, useMemo } from "react";
import { BookOpen, FileText, Users, CheckCircle } from "lucide-react";
import { useStories } from "@/hooks/useStories";

const StatCard = ({ icon, value, label }) => (
  <div className="flex flex-col items-center justify-center p-5 w-full bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
    {icon && (
      <div className="mb-3 flex items-center justify-center">{icon}</div>
    )}
    <div className="text-3xl font-bold text-gray-800">{value}</div>
    <div className="mt-2 text-sm text-gray-500 text-center truncate max-w-full">
      {label}
    </div>
  </div>
);

const StatisticsSection = () => {
  const { stories, passages, fetchStories, fetchPassages } = useStories();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        if (user?.id) {
          await fetchStories(user.id);
          await fetchPassages(user.id);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []); // ✅ FIXED: No infinite loop

  const totalCharacters = useMemo(
    () =>
      stories?.reduce(
        (sum, story) => sum + (story.characters?.length || 0),
        0
      ) || 0,
    [stories]
  );

  const completedPlannings = useMemo(() => {
    if (!stories) return 0;
    const elements = [
      "title",
      "genre",
      "premise",
      "setting",
      "characters",
      "outline",
    ];
    return stories.filter((story) =>
      elements.every((elem) =>
        Array.isArray(story[elem])
          ? story[elem].length > 0
          : Boolean(story[elem])
      )
    ).length;
  }, [stories]);

  return (
    <section className="w-full bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-900">Your Statistics</h3>
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
          <StatCard
            icon={
              <BookOpen className="w-8 h-8 text-green-500" strokeWidth={1.5} />
            }
            value={stories?.length || 0}
            label="Stories Created"
          />
          <StatCard
            icon={
              <FileText className="w-8 h-8 text-green-500" strokeWidth={1.5} />
            }
            value={passages?.length || 0}
            label="Passages Written"
          />
          <StatCard
            icon={
              <Users className="w-8 h-8 text-green-500" strokeWidth={1.5} />
            }
            value={totalCharacters}
            label="Characters Created"
          />
          <StatCard
            icon={
              <CheckCircle
                className="w-8 h-8 text-green-500"
                strokeWidth={1.5}
              />
            }
            value={completedPlannings}
            label="Completed Plannings"
          />
        </div>
      </div>
    </section>
  );
};

export default StatisticsSection;
