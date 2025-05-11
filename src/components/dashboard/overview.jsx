"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import gen from "@/assets/images/gen.webp";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { Sparkles, Plus } from "lucide-react";

export default function DashboardOverview() {
  const router = useRouter();
  const [user] = useLocalStorage("user");

  if (!user) {
    return null;
  }

  const handleSyGenRedirect = () => {
    router.push("/create");
  };
  const handleSubRedirect = () => {
    router.push("/subscription");
  };

  return (
    <div className="h-full overflow-hidden bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
      <div className="px-6 py-6">
        <div className="flex items-center gap-2">
          <h3 className="text-2xl font-semibold leading-6 text-gray-900">
            Hey {user?.first_name}!
          </h3>
          <span className="animate-pulse">👋</span>
        </div>
        <p className="max-w-2xl mt-2 text-sm font-medium text-gray-500">
          Stories left for today -{" "}
          <span className="text-green-500 font-semibold">3/3</span>
        </p>
        <div className="flex mt-6 gap-4">
          <button
            onClick={handleSyGenRedirect}
            className="inline-flex items-center px-5 py-2.5 text-sm font-medium text-white bg-black border border-transparent rounded-lg shadow-sm transition-colors hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            <Plus className="w-4 h-4 mr-2" /> Create a story
          </button>
        </div>
        <div className="relative w-auto mt-7 overflow-hidden rounded-xl">
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
