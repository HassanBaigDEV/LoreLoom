// components/Stories.js
import React from "react";
import StoryIcon from "@/assets/images/story.svg";

export default function Stories() {
  return (
    <div className="mt-8 mb-48">
      <div className="flex items-center text-lg font-medium leading-6 text-gray-900">
        <StoryIcon className="h-8 mr-2 w-9" />
        Stories
      </div>
      <div className="flex mt-4 space-x-4">
        <div className="flex flex-col items-center justify-center w-64 h-64 bg-gray-200 rounded-lg">
          <div className="w-16 h-16 bg-green-400 rounded-full"></div>
          <div className="mt-2 font-semibold text-gray-700">
            Lord of Mysteries
          </div>
          <div className="text-sm text-gray-500">Mystery</div>
        </div>
        <div className="flex flex-col items-center justify-center w-64 h-64 bg-gray-200 rounded-lg">
          <div className="w-16 h-16 bg-green-400 rounded-full"></div>
          <div className="mt-2 font-semibold text-gray-700">
            Reverend Insanity
          </div>
          <div className="text-sm text-gray-500">Mystery</div>
        </div>
      </div>
    </div>
  );
}
