"use client";
import React from "react";
import DashboardOverview from "../../components/dashboard/overview";
import Statistics from "../../components/dashboard/stat";
import Feedback from "../../components/dashboard/feedback";
import Notifications from "../../components/dashboard/notification";
import Header from "../../components/common/header";
import Stories from "../../components/dashboard/stories";
import HelpButton from "../../components/common/help";
import Footer from "../../components/common/footer";

export default function Page() {
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
