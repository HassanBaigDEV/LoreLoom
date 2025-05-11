import React from 'react';
import StatCard from './statcard';
import {
  Assignment as AssignmentIcon,
  Groups as GroupsIcon,
  Speed as SpeedIcon,
} from "@mui/icons-material";

export default function StatsHeader({ stats }) {
  return (
    <div className="bg-white rounded-xl shadow-md p-8 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Statistics</h1>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Stories"
          value={<span className="text-purple-500">{stats?.total_stories ?? 0}</span>}
          subtitle={`${stats?.total_stories ?? 0} Total`}
          icon={<AssignmentIcon />}
        />
        <StatCard
          title="Users"
          value={<span className="text-purple-500">{stats?.total_users ?? 0}</span>}
          subtitle={`${stats?.total_active_users ?? 0} Active`}
          icon={<GroupsIcon />}
        />
        <StatCard
          title="Collaborations"
          value={<span className="text-purple-500">{stats?.total_collaborations ?? 0}</span>}
          subtitle={`${stats?.total_collaborations ?? 0} Active`}
          icon={<GroupsIcon />}
        />
        <StatCard
          title="Subscriptions"
          value={<span className="text-purple-500">{stats?.total_paid_users ? `${stats.total_paid_users}` : '0'}</span>}
          subtitle={`${stats?.total_paid_users ?? 0} Premium`}
          icon={<SpeedIcon />}
        />
      </div>
    </div>
  );
}