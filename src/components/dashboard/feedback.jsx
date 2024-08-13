import React from "react";

export default function Feedback() {
  return (
    <div className="col-span-2 overflow-hidden bg-white rounded-lg shadow">
      <div className="flex items-center justify-between px-4 py-5 sm:p-6">
        <div>
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            Leave Feedback
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Let us know how your StoryBook experience has been.
            <a href="#" className="text-blue-600 hover:text-blue-800">
              Learn More
            </a>
          </p>
        </div>
        <img
          src="https://d1muf25xaso8hp.cloudfront.net/https%3A%2F%2Fd7613c8cdf83a077fbf660c61bfb62e3.cdn.bubble.io%2Ff1716340871093x646031830035817900%2Ffeedback-icon.png?w=128&h=128&auto=compress&dpr=0.75&fit=max"
          alt="Feedback icon"
          className="w-3/6"
        />
      </div>
    </div>
  );
}
