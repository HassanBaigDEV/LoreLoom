import React from 'react';
import StatCard from './statcard';
import {
  Assignment as AssignmentIcon,
  Groups as GroupsIcon,
  Speed as SpeedIcon,
} from "@mui/icons-material";

export default function StatsHeader() {
  return (
    <div className="p-6 bg-purple-500">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Statistics</h1>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Stories"
          value={<span className="text-purple-500" >8</span>}
          subtitle="8 InProgress"
          icon={<AssignmentIcon />}
        />
        <StatCard
          title="Users"
          value={<span className="text-purple-500" >9</span>}
          subtitle="9 Active"
          icon={<GroupsIcon />}
        />
        <StatCard
          title="Collaborations"
          value={<span className="text-purple-500" >0</span>}
          subtitle="None"
          icon={<GroupsIcon />}
        />
        <StatCard
          title="Subscriptions"
          value={<span className="text-purple-500" >0%</span>}
          subtitle="0% Completed"
          icon={<SpeedIcon />}
        />
      </div>
    </div>
  );
}