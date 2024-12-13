import React from 'react';
import {
  Card,
  CardContent,
  AvatarGroup,
  Avatar,
  LinearProgress,
} from "@mui/material";
import PriorityBadge from '@/components/admin/dash/genre';

export default function StoriesTable({ storys }) {
  return (
    <Card>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            Stories being Weaved
          </h2>
          <button className="text-purple-500 hover:text-purple-600">
            View All Stories
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="p-4 font-medium text-left text-gray-600">
                  Story Title
                </th>
                <th className="p-4 font-medium text-left text-gray-600">
                  Hours
                </th>
                <th className="p-4 font-medium text-left text-gray-600">
                  Genre
                </th>
                <th className="p-4 font-medium text-left text-gray-600">
                  Authors
                </th>
                <th className="p-4 font-medium text-left text-gray-600">
                  Progress
                </th>
              </tr>
            </thead>
            <tbody>
              {storys.map((project) => (
                <tr
                  key={project.id || project.StoryTitle}
                  className="border-b hover:bg-gray-50"
                >
                  <td className="p-4">
                    <div className="font-medium">
                      {project.StoryTitle}
                    </div>
                  </td>
                  <td className="p-4 text-gray-600">
                    {project.Hours}
                  </td>
                  <td className="p-4">
                    <PriorityBadge priority={project.Genre} />
                  </td>
                  <td className="p-4">
                    <AvatarGroup
                      max={4}
                      sx={{
                        "& .MuiAvatar-root": {
                          width: 30,
                          height: 30,
                        },
                      }}
                    >
                      {[...Array(project.Authors)].map((_, i) => (
                        <Avatar key={i} />
                      ))}
                    </AvatarGroup>
                  </td>
                  <td className="w-48 p-4">
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">
                          {project.Progress}%
                        </span>
                      </div>
                      <LinearProgress
                        variant="determinate"
                        value={project.Progress}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          "& .MuiLinearProgress-bar": {
                            backgroundColor: "#8b5cf6",
                          },
                          backgroundColor: "#f3e8ff",
                        }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}