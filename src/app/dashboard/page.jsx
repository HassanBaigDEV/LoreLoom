"use client";
import React from "react";
import DashboardOverview from "@/components/dashboard/overview";
import StatisticsSection from "@/components/dashboard/stat";
import Feedback from "@/components/dashboard/feedback";
import Notifications from "@/components/dashboard/notification";
import StoriesSection from "@/components/dashboard/stories";

import Footer from "@/components/common/footer";
import { useAuth } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

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
  return (
    <div className="py-6 bg-gray-100">
      <main className="pt-16">
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="grid grid-cols-6 gap-6 mt-32">
            <DashboardOverview />
            <StatisticsSection />
            <Feedback />
            <Notifications />
          </div>
          <hr className="mt-20 mb-10 border-t border-gray-300" />
          <StoriesSection />
        </div>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <>
      <DashboardContent />
    </>
  );
}
