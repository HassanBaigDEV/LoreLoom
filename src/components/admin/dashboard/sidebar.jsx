import React from "react";
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Feedback as FeedbackIcon,
  Book as BookIcon,
  Menu as MenuIcon,
} from "@mui/icons-material";

const menuItems = [
  { name: "Dashboard", icon: DashboardIcon },
  { name: "Users", icon: PeopleIcon },
  { name: "Stories", icon: BookIcon },
  { name: "Feedback", icon: FeedbackIcon },
];

export default function Sidebar({ sidebarOpen, currentView, onMenuItemClick }) {
  return (
    <div
      className={`${
        sidebarOpen ? "w-64" : "w-20"
      } bg-gray-800 text-white transition-all duration-300 ease-in-out`}
    >
      <div className="p-4">
        <div className="flex items-center justify-between">
          {sidebarOpen && <span className="text-xl font-semibold">Admin</span>}
          <MenuIcon />
        </div>
      </div>

      <nav className="mt-8">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView.toLowerCase() === item.name.toLowerCase();
          
          return (
            <button
              key={item.name}
              onClick={() => onMenuItemClick(item.name)}
              className={`w-full flex items-center px-6 py-3 text-left ${
                isActive
                  ? "bg-gray-700 border-l-4 border-green-500"
                  : "hover:bg-gray-700"
              }`}
            >
              <Icon className="w-6 h-6" />
              {sidebarOpen && (
                <span className="ml-4 text-sm">{item.name}</span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
