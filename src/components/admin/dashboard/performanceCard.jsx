// components/PerformanceCard.js
import React from 'react';
import {
  Card,
  CardContent,
} from "@mui/material";

export default function PerformanceCard({ performanceStats }) {
  return (
    <Card>
      <CardContent>
        <h2 className="mb-4 text-lg font-semibold">
          Stories Performance
        </h2>
        <div className="space-y-4">
          {performanceStats.map((stat, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{stat.label}</span>
                <span className="font-medium">{stat.value}</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full">
                <div
                  className={`h-full ${stat.color} rounded-full`}
                  style={{ width: stat.value }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}