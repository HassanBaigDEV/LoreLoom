import React from "react";
import "./index.css"; // Ensure this imports the Tailwind CSS file

export default function page() {
  return (
    <div className="flex h-screen">
      <div className="flex flex-col items-center justify-center w-2/5 p-8 bg-blue-50">
        <img
          src="https://d1muf25xaso8hp.cloudfront.net/https%3A%2F%2Fd7613c8cdf83a077fbf660c61bfb62e3.cdn.bubble.io%2Ff1673994355369x959530095066761600%2FStoryBook%2520Logo-web.png?w=256&h=256&auto=compress&dpr=0.75&fit=max"
          alt="Logo"
          className="w-32 mb-6"
        />
        <div className="w-full max-w-xs">
          <label htmlFor="email" className="block mb-1 font-bold text-gray-700">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            className="w-full p-1 mb-4 border border-gray-300 rounded"
          />
          <label
            htmlFor="password"
            className="block mb-1 font-bold text-gray-700"
          >
            Password
          </label>
          <input
            type="password"
            id="password"
            name="password"
            className="w-full p-1 mb-4 border border-gray-300 rounded"
          />
          <a
            href="#"
            className="block mb-4 text-sm text-blue-600 hover:underline"
          >
            Forgot your password?
          </a>
          <button className="w-full p-1 mb-4 text-white bg-green-500 rounded">
            Sign In
          </button>
          <p className="text-center">
            Don't have an account?{" "}
            <a href="#" className="text-blue-600 hover:underline">
              Sign Up
            </a>
          </p>
        </div>
      </div>
      <div className="relative w-3/5">
        <img
          src="src/assets/image.png"
          alt="Login"
          className="object-cover w-full h-full"
        />
        <div className="absolute p-4 text-white bg-gray-700 bg-opacity-50 rounded-2xl bottom-5 left-5">
          <h1 className="text-4xl font-bold">A new era of Storytelling</h1>
          <button className="px-4 py-2 mt-4 text-white bg-green-500 bg-opacity-50 rounded-2xl">
            The Book Giver
            <br />
            Read story by Kevin
          </button>
        </div>
      </div>
    </div>
  );
}
