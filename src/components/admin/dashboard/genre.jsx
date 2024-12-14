import React from 'react';

export default function PriorityBadge({ priority }) {
  const colors = {
    Mystery: "bg-red-100 text-red-800",
    Horror: "bg-yellow-100 text-yellow-800",
    SciFi: "bg-green-100 text-green-800",
    Inspirational: "bg-blue-100 text-blue-800",
  };

  return (
    <span className={`px-3 py-1 rounded-full text-sm ${colors[priority]}`}>
      {priority}
    </span>
  );
}