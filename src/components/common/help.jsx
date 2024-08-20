// components/HelpButton.js
import React from "react";

export default function HelpButton() {
  return (
    <div className="fixed flex items-center p-2 mb-10 space-x-2 bg-white rounded-full shadow-lg bottom-4 right-4">
      <span className="font-medium text-gray-700">Need help?</span>
      <button className="flex items-center justify-center w-8 h-8 text-white bg-green-500 rounded-full">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
}
