import React from 'react';
import Image from "next/image";
import {
  IconButton,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
} from "@mui/icons-material";
import avatar from "@/assets/images/avatar.webp";

export default function Header({ 
  sidebarOpen, 
  onToggleSidebar 
}) {
  return (
    <div className="flex items-center justify-between p-4 bg-white border-b">
      <div className="flex items-center">
        <IconButton onClick={onToggleSidebar}>
          <MenuIcon />
        </IconButton>
      </div>
      <div className="flex items-center space-x-4">
        <IconButton>
          <NotificationsIcon />
        </IconButton>
        <div className="flex items-center space-x-2 cursor-pointer">
          <Image
            className="w-8 h-8 rounded-full cursor-pointer"
            src={avatar}
            alt="Profile Picture"
            width={32}
            height={32}
          />
          <div className="text-sm">
            <div className="font-medium">Admin</div>
            <div className="text-gray-500">admin@StoryWeaver</div>
          </div>
        </div>
      </div>
    </div>
  );
}