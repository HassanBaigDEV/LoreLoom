import React from 'react';
import {
  Assignment as AssignmentIcon,
  Groups as GroupsIcon,
  Speed as SpeedIcon,
} from "@mui/icons-material";

export default function StatCard({ title, value, subtitle, icon }) {
  return (
    <div className="flex items-start justify-between p-6 bg-white rounded-xl shadow hover:shadow-lg transition-shadow duration-200 cursor-pointer">
      <div>
        <h3 className="mb-2 text-gray-500 text-lg font-semibold">{title}</h3>
        <div className="text-4xl font-extrabold text-gray-800">{value}</div>
        <div className="text-sm text-gray-400 mt-1">{subtitle}</div>
      </div>
      <div className="p-4 rounded-full bg-gradient-to-tr from-purple-400 to-purple-600 text-white flex items-center justify-center text-3xl shadow-md">
        {icon}
      </div>
    </div>
  );
}