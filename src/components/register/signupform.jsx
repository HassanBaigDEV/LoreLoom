// components/SignupForm.js
import React from "react";

export default function SignupForm() {
  return (
    <div className="w-full max-w-xs">
      <label htmlFor="username" className="block mb-1 font-bold text-gray-700">
        Username
      </label>
      <input
        type="text"
        id="username"
        name="username"
        className="w-full p-1 mb-4 border border-gray-300 rounded"
        placeholder="Choose your username"
      />

      <label htmlFor="fullName" className="block mb-1 font-bold text-gray-700">
        Full Name
      </label>
      <input
        type="text"
        id="fullName"
        name="fullName"
        className="w-full p-1 mb-4 border border-gray-300 rounded"
        placeholder="Enter your full name"
      />

      <label htmlFor="email" className="block mb-1 font-bold text-gray-700">
        Email
      </label>
      <input
        type="email"
        id="email"
        name="email"
        className="w-full p-1 mb-4 border border-gray-300 rounded"
        placeholder="Enter your email"
      />

      <label htmlFor="password" className="block mb-1 font-bold text-gray-700">
        Password
      </label>
      <input
        type="password"
        id="password"
        name="password"
        className="w-full p-1 mb-4 border border-gray-300 rounded"
        placeholder="Enter your password"
      />

      <p className="mb-4 text-sm text-center text-gray-700">
        By signing up, I agree to the
        <a href="#" className="text-blue-600 hover:underline">
          Privacy Policy <br />
        </a>
        and the
        <a href="#" className="text-blue-600 hover:underline">
          Terms and Conditions
        </a>
        .
      </p>

      <button className="w-full p-1 mb-4 text-white bg-green-500 rounded">
        Sign Up
      </button>
    </div>
  );
}
