import React from "react";

export default function LoginForm() {
  return (
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
      <p className="text-center text-gray-700">
        Don't have an account?
        <a href="/auth/register" className="text-blue-600 hover:underline">
          Sign Up
        </a>
      </p>
    </div>
  );
}
