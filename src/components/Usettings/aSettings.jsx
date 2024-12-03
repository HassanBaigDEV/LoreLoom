"use client";
import React from "react";
import Image from "next/image";
import avatar from "@/assets/images/git.webp";

const AccountSettings = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  
  return (
    <div className="container p-6 mx-auto rounded-lg shadow bg-gray-50">
      <h2 className="mb-6 text-2xl font-bold text-gray-700">
        Account Settings
      </h2>
      <div className="flex justify-between">
        <div className="w-1/2">
          {/* Form fields */}
          <div className="mb-6">
            <label className="block mb-2 text-sm font-bold text-gray-700">
              Username
            </label>
            <input
              type="text"
              placeholder="Username"
              className="w-full px-3 py-2 leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline"
              value={user.last_name}
            />
          </div>

          <div className="flex mb-6">
            <div className="w-1/2 mr-3">
              <label className="block mb-2 text-sm font-bold text-gray-700">
                First Name
              </label>
              <input
                type="text"
                placeholder="First Name"
                className="w-full px-3 py-2 leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline"
                value={user.first_name}
              />
            </div>

            <div className="w-1/2">
              <label className="block mb-2 text-sm font-bold text-gray-700">
                Last Name
              </label>
              <input
                type="text"
                placeholder="Last Name"
                className="w-full px-3 py-2 leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline"
                value={user.last_name}
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block mb-2 text-sm font-bold text-gray-700">
              Email
            </label>
            <input
              type="email"
              placeholder="Email"
              className="w-full px-3 py-2 leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline"
              value={user.email}
            />
          </div>

          <div className="mb-6">
            <label className="block mb-2 text-sm font-bold text-gray-700">
              Bio
            </label>
            <textarea
              placeholder="Type bio..."
              className="w-full px-3 py-2 leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline"
            />
          </div>

          <div className="flex items-center justify-between">
            <button className="px-4 py-2 font-bold text-white bg-blue-500 rounded hover:bg-blue-700 focus:outline-none focus:shadow-outline">
              Save Changes
            </button>
            <button className="px-4 py-2 font-bold text-white bg-red-500 rounded hover:bg-red-700 focus:outline-none focus:shadow-outline">
              Delete Account
            </button>
          </div>
        </div>

        {/* Avatar Section */}
        <AvatarSection />
      </div>
    </div>
  );
};

const AvatarSection = () => {
  return (
    <div className="w-1/4">
      <div className="flex flex-col items-center">
        <Image
          className="w-24 h-24 mb-4 text-gray-700 rounded-full"
          src={avatar}
          alt="Avatar"
        />
        <button className="font-bold text-blue-500">Choose Avatar</button>
      </div>
    </div>
  );
};

export default AccountSettings;
