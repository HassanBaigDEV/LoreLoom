import React from "react";
import Image from 'next/image';
const Header = () => {
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
        {/* <Image
          className="w-8 h-8 rounded-full"
          src="https://d1muf25xaso8hp.cloudfront.net/https%3A%2F%2Fd7613c8cdf83a077fbf660c61bfb62e3.cdn.bubble.io%2Ff1675440409441x687837228059513700%2Favatar%25203%25402x.png?w=48&h=&auto=compress&dpr=0.75&fit=max"
          alt="Profile Picture"
          width={32}
          height={32}
        /> */}
      </div>
    </header>
  );
}

export default Header;