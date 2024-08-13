import React from "react";
import user from "../../assets/images/avatar.png";
import Image from "next/image";

export default function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-white bg-opacity-75 border-b border-gray-300 rounded-b-lg backdrop-filter backdrop-blur-sm">
      <div className="flex-1">
        {/* <Image className="w-8 h-8" src="path-to-logo" alt="StoryBook Logo" width={32} height={32} /> */}
      </div>
      <div className="flex items-center justify-center flex-1 space-x-4">
        <a
          href="#"
          className="text-sm font-medium text-gray-900 border-b-2 border-yellow-500"
        >
          Dashboard
        </a>
        <a
          href="#"
          className="text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
        >
          Discover
        </a>
      </div>
      <div className="flex items-center justify-end flex-1">
        <Image
          className="w-8 h-8 rounded-full"
          src={user}
          alt="Profile Picture"
          width={32}
          height={32}
        />
      </div>
    </header>
  );
}
