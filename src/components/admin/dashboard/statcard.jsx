import React from 'react';
import {
  Assignment as AssignmentIcon,
  Groups as GroupsIcon,
  Speed as SpeedIcon,
} from "@mui/icons-material";

export default function StatCard({ title, value, subtitle, icon }) {
  return (
    <div className="flex items-start justify-between p-6 bg-white rounded-lg">
      <div>
        <h3 className="mb-2 text-gray-600">{title}</h3>
        <div className="text-3xl font-bold">{value}</div>
        <div className="text-sm text-gray-500">{subtitle}</div>
      </div>
      <div className="p-2 text-purple-500 bg-purple-100 rounded-lg">{icon}</div>
    </div>
  );
}