"use client"; // Ensures the component runs in client mode

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import avatar from "@/assets/images/avatar.webp";

export default function Header() {
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);
  const [user, setUser] = useState(null); // Use state to store the user
  const router = useRouter();
  const pathname = usePathname();

  // Fetch user data from localStorage only on the client side
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const toggleOverlay = () => {
    setIsOverlayVisible(!isOverlayVisible);
  };

  const handleLoginRedirect = () => {
    router.push("/auth/login");
  };

  const handleSettings = () => {
    router.push("/Usettings");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-white bg-opacity-75 border-b border-gray-300 rounded-b-lg backdrop-filter backdrop-blur-sm">
      <div className="flex-1"></div>
      <div className="flex items-center justify-center flex-1 space-x-4">
        <a
          href="/dashboard"
          className={`text-sm font-medium ${
            pathname === "/dashboard"
              ? "text-gray-900 border-yellow-500 border-b-2"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Dashboard
        </a>
        <a
          href="/discover"
          className={`text-sm font-medium ${
            pathname === "/discover"
              ? "text-gray-900 border-yellow-500 border-b-2"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Discover
        </a>
      </div>
      <div className="relative flex items-center justify-end flex-1">
        <Image
          className="w-8 h-8 rounded-full cursor-pointer"
          src={avatar}
          alt="Profile Picture"
          width={32}
          height={32}
          onClick={toggleOverlay}
        />

        {isOverlayVisible && (
          <div className="absolute right-0 z-20 p-4 mt-48 bg-white rounded-lg shadow-lg w-58">
            <div className="flex items-center mb-4">
              <Image
                src={avatar}
                alt="Profile Picture"
                width={40}
                height={40}
                className="rounded-full"
              />
              <div className="ml-3">
                {user ? ( // Render user data only if available
                  <>
                    <p className="text-sm font-semibold text-gray-500">{user.last_name}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </>
                ) : (
                  <p className="text-sm text-gray-500">Loading...</p>
                )}
              </div>
            </div>
            <button
              onClick={handleSettings}
              className="block w-full px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              Settings
            </button>
            <button
              onClick={handleLoginRedirect}
              className="block w-full px-4 py-2 mt-2 text-sm font-semibold text-red-600 bg-transparent hover:underline"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
