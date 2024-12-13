import React from 'react';
import {
  Dashboard as DashboardIcon,
  Pages as PagesIcon,
  ViewQuilt as LayoutsIcon,
  Groups as GroupsIcon,
} from "@mui/icons-material";

export default function Sidebar({ 
  sidebarOpen, 
  currentView, 
  onMenuItemClick 
}) {
  const menuItems = [
    {
      heading: "",
      items: [
        { 
          label: "Dashboard", 
          icon: <DashboardIcon />, 
          view: 'dashboard',
          active: currentView === 'dashboard' 
        },
        {
          label: "Users",
          icon: <PagesIcon />,
          view: 'users',
          active: currentView === 'users'
        },
        {
          label: "Stories",
          icon: <PagesIcon />,
          view: 'stories',
          active: currentView === 'stories'
        },
        { 
          label: "Feedbacks", 
          icon: <LayoutsIcon />,
          view: 'feedbacks',
          active: currentView === 'feedbacks'
        },
      ],
    },
  ];

  return (
    <div
      className={`${
        sidebarOpen ? "w-64" : "w-0"
      } bg-[#1e2632] border-r transition-all duration-300 overflow-hidden`}
    >
      <div className="p-6">
        <div className="mb-8 text-xl font-bold text-white">Story Weaver</div>
        <div className="space-y-8">
          {menuItems.map((section, idx) => (
            <div key={idx} className="space-y-2">
              <div className="text-xs font-medium tracking-wider text-gray-500">
                {section.heading}
              </div>
              {section.items.map((item, itemIdx) => (
                <div 
                  key={itemIdx} 
                  onClick={() => onMenuItemClick(item.view)}
                  className="cursor-pointer"
                >
                  <div
                    className={`flex items-center justify-between p-2 rounded
                    ${
                      item.active
                        ? "bg-gray-600 text-purple-500"
                        : "text-gray-600 hover:text-white hover:bg-gray-700"
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-xl">{item.icon}</span>
                      <span>{item.label}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
