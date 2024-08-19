// components/UpgradeBanner.js
import React from "react";

export default function UpgradeBanner() {
  return (
    <div className="p-6 mt-6 text-center bg-gray-100 rounded-lg shadow-lg">
      <p className="mb-4 text-lg text-gray-600">Upgrade to generate unlimited stories</p>
      <p className="mb-4 text-sm text-gray-500">
        Unlock unlimited story generations, audio stories, and more.
      </p>
      <button className="px-4 py-2 text-white transition duration-300 bg-blue-500 rounded-lg hover:bg-blue-600">
        Upgrade
      </button>
    </div>
  );
}
