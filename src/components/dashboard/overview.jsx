"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import gen from "@/assets/images/gen.webp";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Sparkles, Plus } from "lucide-react";
import { subscriptionService } from "@/lib/subscriptionService";
import toast from "react-hot-toast";

export default function DashboardOverview() {
  const router = useRouter();
  const [user] = useLocalStorage("user");
  const [subscriptionLimits, setSubscriptionLimits] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubscriptionLimits = async () => {
      try {
        const limits = await subscriptionService.checkLimits();
        setSubscriptionLimits(limits);
      } catch (error) {
        console.error("Error fetching subscription limits:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchSubscriptionLimits();
    }
  }, [user]);

  if (!user) {
    return null;
  }

  const handleSyGenRedirect = () => {
    if (subscriptionLimits?.limit_reached) {
      router.push("/subscription");
      return;
    }
    router.push("/create");
  };

  const handleSubRedirect = () => {
    router.push("/subscription");
  };

  const getStoriesLeftText = () => {
    if (!subscriptionLimits) return "Loading...";
    if (subscriptionLimits.stories_left === "unlimited") return "Unlimited";
    return `${subscriptionLimits.stories_left}/${subscriptionLimits.story_limit}`;
  };

  return (
    <div className="h-full overflow-hidden transition-all duration-300 bg-white border border-gray-100 shadow-sm rounded-xl hover:shadow-md">
      <div className="px-6 py-6">
        <div className="flex items-center gap-2">
          <h3 className="text-2xl font-semibold leading-6 text-gray-900">
            Hey {user?.first_name}!
          </h3>
          <span className="animate-pulse">👋</span>
        </div>
        <p className="max-w-2xl mt-2 text-sm font-medium text-gray-500">
          Stories left for this month -{" "}
          <span className={`font-semibold ${subscriptionLimits?.stories_left === 0 ? 'text-red-500' : 'text-green-500'}`}>
            {getStoriesLeftText()}
          </span>
        </p>
        <div className="flex gap-4 mt-6">
          <button
            onClick={handleSyGenRedirect}
            className="inline-flex items-center px-5 py-2.5 text-sm font-medium text-white bg-black border border-transparent rounded-lg shadow-sm transition-colors hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            <Plus className="w-4 h-4 mr-2" /> Create a story
          </button>
        </div>
        <div className="relative w-auto overflow-hidden mt-7 rounded-xl">
          <Image
            className="object-cover w-full rounded-xl transition-transform hover:scale-105 duration-500 brightness-[0.85]"
            src={gen}
            alt="Promotion Image"
          />
          <div className="absolute text-white bottom-5 left-5">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-yellow-300" />
              <p className="text-sm font-medium">
                Upgrade for Unlimited Stories
              </p>
            </div>
            <p className="text-xl font-bold">Only $19/month</p>
          </div>
          <button
            onClick={handleSubRedirect}
            className="absolute inline-flex items-center px-5 py-2.5 text-sm font-medium text-white bg-blue-800 bg-opacity-80 backdrop-blur-sm border border-transparent rounded-lg shadow-sm bottom-5 right-5 transition-colors hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Upgrade Now
          </button>
        </div>
      </div>
    </div>
  );
}
