"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Feedback as FeedbackIcon,
  Book as BookIcon,
} from "@mui/icons-material";
import Sidebar from "@/components/admin/dashboard/sidebar";
import Header from "@/components/admin/dashboard/header";
import StatsHeader from "@/components/admin/dashboard/statsheader";
import StoriesTable from "@/components/admin/dashboard/storiesTable";
import UsersPage from "@/components/admin/dashboard/user";
import FeedbackList from "@/components/admin/dashboard/FeedbackList";
import { adminService } from "@/lib/adminService";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import AdminProtectedRoute from "@/components/auth/AdminProtectedRoute";
import Cookies from "js-cookie";

const LoadingSpinner = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-opacity-75 bg-gray-50">
    <div className="relative">
      <div className="w-16 h-16 border-t-4 border-b-4 border-orange-500 rounded-full animate-spin"></div>
      <div className="mt-4 font-medium text-center text-gray-600">Loading...</div>
    </div>
  </div>
);

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentView, setCurrentView] = useState("dashboard");
  const [dashboardStats, setDashboardStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const { admin, checkAuth } = useAdminAuth();
  const router = useRouter();

  const initializeDashboard = useCallback(async () => {
    try {
      const adminToken = Cookies.get("client_admin_accessToken");
      if (!adminToken) {
        router.push("/admin/login");
        return;
      }

      setLoading(true);
      const adminData = await checkAuth();
      if (!adminData) {
        router.push("/admin/login");
        return;
      }

      const [stats, usersData, feedbackData, storiesData] = await Promise.all([
        adminService.getDashboardStats(),
        adminService.getAllUsers(),
        adminService.getAllFeedback(),
        adminService.getAllStories(),
      ]);

      console.log("Dashboard Stats:", stats);
      console.log("Users Data:", usersData);
      console.log("Feedback Data:", feedbackData);
      console.log("Stories Data:", storiesData);

      setDashboardStats(stats);
      setUsers(usersData);
      setFeedback(feedbackData);
      setStories(storiesData);
    } catch (error) {
      console.log("Error initializing dashboard:", error);
    } finally {
      setLoading(false);
    }
  }, [checkAuth, router]);

  useEffect(() => {
    if (!admin) {
      initializeDashboard();
    } else {
      setLoading(false);
    }
  }, [admin, initializeDashboard]);

  const handleMenuItemClick = (view) => {
    setCurrentView(view.toLowerCase());
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleUpdateUserRole = async (userId, newRole) => {
    try {
      await adminService.updateUserRole(userId, newRole);
      const updatedUsers = await adminService.getAllUsers();
      setUsers(updatedUsers);
    } catch (error) {
      console.error("Error updating user role:", error);
    }
  };

  const handleUpdateFeedback = async (feedbackId, updateData) => {
    try {
      await adminService.updateFeedback(feedbackId, updateData);
      const updatedFeedback = await adminService.getAllFeedback();
      setFeedback(updatedFeedback);
    } catch (error) {
      console.error("Error updating feedback:", error);
    }
  };

  const handleDeleteFeedback = async (feedbackId) => {
    try {
      await adminService.deleteFeedback(feedbackId);
      const updatedFeedback = await adminService.getAllFeedback();
      setFeedback(updatedFeedback);
    } catch (error) {
      console.error("Error deleting feedback:", error);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full">
          Loading...
        </div>
      );
    }

    switch (currentView.toLowerCase()) {
      case "dashboard":
        return (
          <>
            <div className="p-6 bg-purple-500">
              <StatsHeader stats={dashboardStats} />
            </div>
            <div className="grid grid-cols-12 gap-6 p-6">
              <div className="col-span-12">
                <StoriesTable stories={stories} />
              </div>
            </div>
          </>
        );
      case "users":
        return <UsersPage users={users} onUpdateRole={handleUpdateUserRole} />;
      case "stories":
        return (
          <div className="p-6">
            <StoriesTable stories={stories} />
          </div>
        );
      case "feedback":
        return (
          <div className="p-6">
            <FeedbackList
              feedback={feedback}
              onUpdateFeedback={handleUpdateFeedback}
              onDeleteFeedback={handleDeleteFeedback}
            />
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-center h-full">
            Select a view from the sidebar
          </div>
        );
    }
  };

  if (!admin || admin.role !== "admin") {
    return null;
  }

  return (
    <AdminProtectedRoute>
      <div className="flex h-screen bg-gray-50">
        <Sidebar
          sidebarOpen={sidebarOpen}
          currentView={currentView}
          onMenuItemClick={handleMenuItemClick}
        />

        <div className="flex flex-col flex-1 overflow-hidden">
          <Header
            sidebarOpen={sidebarOpen}
            onToggleSidebar={toggleSidebar}
            user={admin}
          />

          <div className="flex-1 overflow-auto">{renderContent()}</div>
        </div>
      </div>
    </AdminProtectedRoute>
  );
}
