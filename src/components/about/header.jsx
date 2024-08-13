import React from "react";

export default function Header() {
  return (
    <header className="flex items-center justify-between bg-white border-b border-gray-300 rounded-b-lg p-7">
      <div className="flex-1 pl-32">
        <h1 className="text-2xl font-bold text-gray-700">loreloom</h1>
      </div>
      <nav className="flex items-center pr-32 space-x-4">
        <a href="/" className="text-sm text-gray-700 hover:underline">
          Home
        </a>
        <a href="about" className="text-sm text-gray-700 hover:underline">
          How it works
        </a>
        <div className="flex items-center space-x-2">
          <div className="w-0.5 h-6 bg-gray-300"></div>
          <a
            href="/"
            className="text-sm hover:underline bg-gray-800 text-white py-3 px-5 rounded font-['Arial', sans-serif]"
          >
            GET STARTED
          </a>
        </div>
      </nav>
    </header>
  );
}
