import React, { useState } from "react";

export default function CategoryButton({ label, onSelect, isSelected }) {
  return (
    <button
      className={`w-40 h-20 text-xl text-gray-700 transition duration-300 rounded-lg ${isSelected ? 'bg-green-500 bg-opacity-60' : 'bg-gray-300'} hover:bg-opacity-50 hover:bg-green-500`}
      onClick={() => onSelect(label)}
    >
      {label}
    </button>
  );
}
