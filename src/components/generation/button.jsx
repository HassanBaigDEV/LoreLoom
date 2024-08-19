// components/CategoryButton.js
import React from "react";

export default function CategoryButton({ label }) {
  return (
    <button className="w-40 h-20 text-xl text-gray-700 transition duration-300 bg-gray-300 rounded-lg hover:bg-yellow-500 hover:bg-opacity-50">
      {label}
    </button>
  );
}
