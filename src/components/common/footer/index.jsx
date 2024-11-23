import React from "react";

export default function Footer() {
  return (
    <footer className="mt-auto bg-gray-100">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-2">
          <span className="text-gray-600">Copyright ©2024 StoryWeaver</span>
        </div>
        <div className="flex items-center justify-end">
          <div className="flex items-center p-2 space-x-4 rounded-full bg-blue-50">
            <a href="#" className="text-gray-600 hover:underline">
              Terms of Service
            </a>
            <span className="text-gray-300">|</span>
            <a href="#" className="text-gray-600 hover:underline">
              Disclaimer
            </a>
          </div>
          <div className="p-2 ml-4 rounded-full bg-blue-50">
            <a href="#">
              <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4 text-gray-800"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M2.5 18a.5.5 0 0 1-.5-.5V5a.5.5 0 0 1 .5-.5H4a.5.5 0 0 1 .5.5v12.5a.5.5 0 0 1-.5.5H2.5zM5.5 16.5V5h8v11.5H5.5zM15.5 16V7h-2v9h2.5a.5.5 0 0 1 0 1H15.5z" />
                </svg>
              </div>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
