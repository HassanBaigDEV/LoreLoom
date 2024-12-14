"use client";
import React from 'react';
import Image from "next/image";
import token from "@/assets/images/STBK-token.webp";
import { BookOpen as StoryIcon } from 'lucide-react';

const StatisticsSection = () => {
  let userStories = [];
  try {
    const user = JSON.parse(localStorage.getItem("user") || '{"stories": []}');
    userStories = user.stories || [];
  } catch (error) {
    console.error('Error parsing user data:', error);
  }

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
              <div className="text-4xl font-semibold text-yellow-500">0</div>
              <div className="text-sm text-gray-500">Tokens</div>
            </div>
          </div>
          <div className="flex items-center">
            <StoryIcon 
              className="w-8 h-8 mb-4 mr-2 text-green-500" 
              strokeWidth={1.5}
            />
            <div>
              <div className="text-4xl font-semibold text-green-500">
                {userStories.length}
              </div>
              <div className="text-sm text-gray-500">Stories</div>
            </div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-semibold text-gray-900">0</div>
            <div className="text-sm text-gray-500">Digital Comics</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-semibold text-gray-900">0</div>
            <div className="text-sm text-gray-500">Story Audio</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-semibold text-gray-900">0</div>
            <div className="text-sm text-gray-500">Image Generations</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatisticsSection;
