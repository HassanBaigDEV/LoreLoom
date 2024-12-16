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
    console.log(userStories);
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
                {userStories.length}
              </div>
              <div className="text-sm text-gray-500">Stories</div>
            </div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-semibold text-gray-900">15</div>
            <div className="text-sm text-gray-500">Passages</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-semibold text-gray-900">13</div>
            <div className="text-sm text-gray-500">Characters</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-semibold text-gray-900">2</div>
            <div className="text-sm text-gray-500">plannings Completed</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatisticsSection;
