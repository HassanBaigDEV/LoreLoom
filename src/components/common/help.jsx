// components/HelpButton.js
import React from "react";

export default function HelpButton() {
  return (
    <div className="fixed flex items-center p-2 mb-10 space-x-2 bg-white rounded-full shadow-lg bottom-4 right-4">
      <span className="font-medium text-gray-700">Need help?</span>
      <button className="flex items-center justify-center w-8 h-8 text-white bg-green-500 rounded-full">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2.5 18a.5.5 0 0 1-.5-.5V5a.5.5 0 0 1 .5-.5H4a.5.5.5 0 0 1 .5.5v12.5a.5.5.5 0 0 1-.5.5H2.5zM5.5 16.5V5h8v11.5H5.5zM15.5 16V7h-2v9h2.5a.5.5.5 0 0 1 0 1H15.5z" />
        </svg>
      </button>
    </div>
  );
}
