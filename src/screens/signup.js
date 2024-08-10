import React from "react";
import "../index.css"; // Ensure this imports the Tailwind CSS file

function Signup() {
  return (
    <div className="flex h-screen">
      <div className="relative w-3/6">
        <img
          src="https://d1muf25xaso8hp.cloudfront.net/https%3A%2F%2Fd7613c8cdf83a077fbf660c61bfb62e3.cdn.bubble.io%2Ff1677200586317x357103599826275260%2Fsafari%2520story.jpg?w=&h=&auto=compress&dpr=1&fit=max"
          alt="Signup"
          className="object-cover w-full h-full"
        />
        <div className="absolute p-4 text-white rounded bottom-5 left-5">
          <h1 className="font-bold text-7xl">
            Bring
            <br />
            Bedtime
            <br />
            to life..
          </h1>
        </div>
      </div>
      <div className="flex flex-col items-center justify-center w-3/6 p-8 bg-blue-50">
        <img
          src="https://d1muf25xaso8hp.cloudfront.net/https%3A%2F%2Fd7613c8cdf83a077fbf660c61bfb62e3.cdn.bubble.io%2Ff1673994355369x959530095066761600%2FStoryBook%2520Logo-web.png?w=256&h=256&auto=compress&dpr=0.75&fit=max"
          alt="Logo"
          className="w-40 mb-6"
        />
        <div className="w-full max-w-xs">
          <label
            htmlFor="username"
            className="block mb-1 font-bold text-gray-700"
          >
            Username
          </label>
          <input
            type="text"
            id="username"
            name="username"
            className="w-full p-1 mb-4 border border-gray-300 rounded"
            placeholder="Choose your username"
          />

          <label
            htmlFor="fullName"
            className="block mb-1 font-bold text-gray-700"
          >
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
            placeholder="Enter your password"
          />

          <p className="mb-4 text-sm text-center">
            By signing up, I agree to the{" "}
            <a href="#" className="text-blue-600 hover:underline">
              Privacy Policy
            </a>{" "}
            and the{" "}
            <a href="#" className="text-blue-600 hover:underline">
              Terms and Conditions
            </a>
            .
          </p>

          <button className="w-full p-1 mb-4 text-white bg-green-500 rounded">
            Sign Up
          </button>
        </div>
      </div>
      <div className="fixed flex items-center p-2 space-x-2 bg-white rounded-full shadow-lg bottom-4 right-4">
        <span className="font-medium text-gray-700">Need help?</span>
        <button className="flex items-center justify-center w-8 h-8 text-white bg-green-500 rounded-full">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2.5 18a.5.5 0 0 1-.5-.5V5a.5.5 0 0 1 .5-.5H4a.5.5 0 0 1 .5.5v12.5a.5.5 0 0 1-.5.5H2.5zM5.5 16.5V5h8v11.5H5.5zM15.5 16V7h-2v9h2.5a.5.5 0 0 1 0 1H15.5z" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default Signup;
