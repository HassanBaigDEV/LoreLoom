"use client";
import React from "react";
import DashboardOverview from "@/components/dashboard/overview";
import StatisticsSection from "@/components/dashboard/stat";
import Feedback from "@/components/dashboard/feedback";
import StoriesSection from "@/components/dashboard/stories";
import Footer from "@/components/common/footer";
import { useAuth } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useRouter } from "next/navigation";

const LoadingSpinner = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-opacity-75 bg-gray-50">
    <div className="relative">
      <div className="w-16 h-16 border-t-4 border-b-4 border-orange-500 rounded-full animate-spin"></div>
      <div className="mt-4 font-medium text-center text-gray-600">
        Loading...
      </div>
    </div>
  </div>
);

function DashboardContent() {
  const { isLoading: authLoading } = useAuth();
  const [user, setUser, storageLoading] = useLocalStorage("user");
  const router = useRouter();

  if (authLoading || storageLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  return (
    <div className="py-8 bg-gray-50 min-h-screen">
      <main>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Grid */}
          <div className="grid grid-cols-1 gap-8 mt-16 md:grid-cols-2">
            {/* Overview Section */}
            <div className="transform transition-all duration-300 hover:translate-y-[-5px]">
              <DashboardOverview />
            </div>

            {/* Statistics Section */}
            <div className="transform transition-all duration-300 hover:shadow-lg">
              <StatisticsSection />
            </div>

            {/* Feedback Section */}
            <div className="md:col-span-2 transform transition-all duration-300 hover:translate-y-[-5px]">
              <Feedback />
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center my-12">
            <div className="flex-grow h-0.5 bg-gray-200"></div>
            <div className="mx-4 text-gray-500 font-medium">Your Stories</div>
            <div className="flex-grow h-0.5 bg-gray-200"></div>
          </div>

          {/* Stories Section */}
          <StoriesSection />
        </div>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
