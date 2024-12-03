import React from "react";
import Image from "next/image";
import token from "@/assets/images/STBK-token.webp";
import StoryIcon from "@/assets/images/story.svg";

export default function Statistics() {
  const user = JSON.parse(localStorage.getItem("user"));
  return (
    <div className="col-span-4 overflow-hidden bg-white rounded-lg shadow">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900">
          Your Statistics
        </h3>
        <div className="flex justify-between mt-5">
          <div className="flex items-center text-center">
            <Image src={token} alt="Token icon" className="w-2/4 pr-2" />
            <div>
              <div className="text-4xl font-semibold text-yellow-500">0</div>
              <div className="text-sm text-gray-500">Tokens</div>
            </div>
          </div>
          <div className="flex items-center">
            <StoryIcon className="w-4/5 mb-4 mr-2" />
            <div>
              <div className="text-4xl font-semibold text-green-500">{user.stories.length}</div>
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
}
