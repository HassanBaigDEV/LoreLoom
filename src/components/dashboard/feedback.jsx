"use client";
import Image from "next/image";
import React, { useState } from "react";
import token from "@/assets/images/feedback-icon.webp";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function Feedback() {
  const [showOverlay, setShowOverlay] = useState(false);
  const router = useRouter();

  const handleLearnMoreClick = (e) => {
    e.preventDefault();
    // setShowOverlay(true);
    router.push("/feedback");
  };

  const closeOverlay = () => {
    // setShowOverlay(false);
  };

  return (
    <ProtectedRoute>
      <div className="col-span-2 overflow-hidden bg-white rounded-lg shadow">
        <div className="flex items-center justify-between px-4 py-5 sm:p-6">
          <div>
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              Leave Feedback
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Let us know how your Story Weaver experience has been.
              <a
                href="#"
                onClick={handleLearnMoreClick}
                className="text-blue-600 hover:text-blue-800"
              >
                Learn More
              </a>
            </p>
          </div>
          <Image src={token} alt="Feedback icon" className="w-3/6" />
        </div>
      </div>

      {showOverlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="relative w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
            <button
              className="absolute text-gray-500 top-2 right-2 hover:text-gray-700"
              onClick={closeOverlay}
            >
              &#10005;
            </button>
            <h2 className="mb-4 text-xl font-semibold text-gray-700">
              Give feedback to Story Weaver
            </h2>
            <select className="w-full p-2 mb-4 text-gray-700 border rounded-lg">
              <option>Choose which area we can improve</option>
              <option>Story Generation</option>
              <option>User Interface</option>
              <option>Account</option>
              <option>Others</option>
            </select>
            <textarea
              className="w-full p-2 mb-4 border rounded-lg"
              placeholder="Please include as much info as possible"
              rows="4"
            ></textarea>
            <div className="p-2 mb-4 text-sm text-gray-700 bg-green-100 rounded-lg">
              Let us know if you have ideas that can help make our products
              better.
            </div>
            <div className="flex justify-between">
              <button
                className="text-blue-500 hover:underline"
                onClick={closeOverlay}
              >
                Cancel
              </button>
              <button className="px-4 py-2 font-semibold text-white bg-gray-400 rounded-lg hover:bg-gray-500">
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
