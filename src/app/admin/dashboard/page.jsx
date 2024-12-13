"use client";
import { useState } from "react";
import {
  Dashboard as DashboardIcon,
  Pages as PagesIcon,
  ViewQuilt as LayoutsIcon,
} from "@mui/icons-material";
import Sidebar from "@/components/admin/dash/sidebar";
import Header from "@/components/admin/dash/header";
import StatsHeader from "@/components/admin/dash/statsheader";
import StoriesTable from "@/components/admin/dash/storiesTable";
import PerformanceCard from "@/components/admin/dash/performanceCard";
import UsersPage from "@/components/admin/dash/user";
import CollaborationsCard from "@/components/admin/dash/collaborationsCard";

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentView, setCurrentView] = useState("dashboard");

  const handleMenuItemClick = (view) => {
    setCurrentView(view.toLowerCase());
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const storys = [
    {
      StoryTitle: "In the Shadows of Forgotten Realms",
      Hours: 34,
      Genre: "SciFi",
      Authors: 1,
      Progress: 15,
    },
    {
      StoryTitle: "The Whispers of Forgotten Shadows",
      Hours: 47,
      Genre: "Mystery",
      Authors: 1,
      Progress: 35,
    },
    {
      StoryTitle: "The Unraveling Whispers of a Forgotten Labyrinth",
      Hours: 120,
      Genre: "Horror",
      Authors: 1,
      Progress: 75,
    },
    {
      StoryTitle: "niggaman",
      Hours: 89,
      Genre: "Inspirational",
      Authors: 1,
      Progress: 63,
    },
    {
      StoryTitle: "niggatron",
      Hours: 108,
      Genre: "SciFi",
      Authors: 1,
      Progress: 100,
    },
    {
      StoryTitle: "A Tale of Lost Souls",
      Hours: 120,
      Genre: "Mystery",
      Authors: 2,
      Progress: 75,
    },
  ];

  const collaborations = [
    {
      auth: "Anita",
      coAuth: "Parmar",
      role: "authors",
      lastActivity: "3 May, 2023",
    },
    {
      auth: "Jitu",
      coAuth: "Chauhan",
      role: "Authors",
      lastActivity: "Today",
    },
    {
      auth: "Sandeep Chauhan",
      coAuth: "Chauhan",
      role: "Authors",
      lastActivity: "Yesterday",
    },
  ];

  const performanceStats = [
    { label: "In-Passage-Gen", value: "76%", color: "bg-green-500" },
    { label: "In-Planning", value: "32%", color: "bg-blue-500" },
    { label: "Behind", value: "13%", color: "bg-red-500" },
  ];

  // Render content based on the current view
  const renderContent = () => {
    switch (currentView) {
      case "dashboard":
        return (
          <>
            <div className="p-6 bg-purple-500">
              <StatsHeader />
            </div>
            <div className="grid grid-cols-12 gap-6 p-6">
              <div className="col-span-12 xl:col-span-8">
                <StoriesTable storys={storys} />
              </div>
              <div className="col-span-12 space-y-6 xl:col-span-4">
                <PerformanceCard performanceStats={performanceStats} />
                <CollaborationsCard collaborations={collaborations} />
              </div>
            </div>
          </>
        );
      case "users":
        return <UsersPage />;
      case "stories":
        return (
          <div className="col-span-12 p-6 xl:col-span-8">
            <StoriesTable storys={storys} />
          </div>
        );
      case "feedbacks":
        return null;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar
        sidebarOpen={sidebarOpen}
        currentView={currentView}
        onMenuItemClick={handleMenuItemClick}
      />

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header sidebarOpen={sidebarOpen} onToggleSidebar={toggleSidebar} />

        {/* Dynamic Content */}
        <div className="flex-1 overflow-auto">{renderContent()}</div>
      </div>
    </div>
  );
}
