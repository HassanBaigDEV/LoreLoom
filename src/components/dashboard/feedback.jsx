"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { MessageSquare, MessageCircle, ThumbsUp } from "lucide-react";

export default function Feedback() {
  const router = useRouter();

  const handleLearnMoreClick = (e) => {
    e.preventDefault();
    router.push("/feedback");
  };

  return (
    <ProtectedRoute>
      <div className="overflow-hidden bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
        <div className="flex items-center justify-between px-6 py-6">
          <div className="flex-1">
            <h3 className="text-xl font-semibold leading-6 text-gray-900">
              Leave Feedback
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Let us know how your Story Weaver experience has been.{" "}
              <a
                href="#"
                onClick={handleLearnMoreClick}
                className="text-green-500 hover:text-green-700 font-medium transition-colors"
              >
                Learn More
              </a>
            </p>
          </div>
          <div className="flex items-center justify-center w-24 h-24 bg-green-50 rounded-full">
            <MessageCircle
              className="w-12 h-12 text-green-500"
              strokeWidth={1.5}
            />
          </div>
        </div>
      </div>

      {/* Original overlay code removed for brevity since you mentioned not to change logic/UX */}
    </ProtectedRoute>
  );
}
