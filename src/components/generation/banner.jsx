"use client";

import React from "react";
import { useRouter } from "next/navigation";

export default function UpgradeBanner() {
  const router = useRouter();
  
  const handleSubRedirect = () => {
    router.push("/subscribe");
  };

  return (
    <div className="p-6 mt-6 text-center bg-gray-100 rounded-lg shadow-lg">
      <p className="mb-4 text-lg text-gray-600">
        Upgrade to generate unlimited stories
      </p>
      <p className="mb-4 text-sm text-gray-500">
        Unlock unlimited story generations, audio stories, and more.
      </p>
      <button
        onClick={handleSubRedirect}
        className="px-4 py-2 text-white transition duration-300 bg-green-500 rounded-lg hover:bg-green-600"
      >
        Upgrade
      </button>
    </div>
  );
}
