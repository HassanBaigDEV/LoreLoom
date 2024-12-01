"use client";
import React, { useEffect } from "react";
import DashboardOverview from "@/components/dashboard/overview";
import Statistics from "@/components/dashboard/stat";
import Feedback from "@/components/dashboard/feedback";
import Notifications from "@/components/dashboard/notification";
import Header from "@/components/common/header";
import Stories from "@/components/dashboard/stories";
import HelpButton from "@/components/common/help";
import Footer from "@/components/common/footer";
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

const LoadingSpinner = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-opacity-75 bg-gray-50">
    <div className="relative">
      <div className="w-16 h-16 border-t-4 border-b-4 border-orange-500 rounded-full animate-spin"></div>
      <div className="mt-4 font-medium text-center text-gray-600">Loading...</div>
    </div>
  </div>
);

export default function Page() {
  const { user, isAuthenticated, checkAuth } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const validateAuth = async () => {
      const userData = await checkAuth();
      if (!userData) {
        router.push('/login');
      }
    };

    validateAuth();
  }, []);

  if (!isAuthenticated) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <div className="py-6 bg-gray-100">
        <Header />
        <main className="pt-16">
          <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
            <div className="grid grid-cols-6 gap-6 mt-32">
              <DashboardOverview />
              <Statistics />
              <Feedback />
              <Notifications />
            </div>
            <hr className="mt-20 mb-10 border-t border-gray-300" />
            <Stories />
          </div>
        </main>
        <HelpButton />
      </div>
      <Footer />
    </>
  );
}
