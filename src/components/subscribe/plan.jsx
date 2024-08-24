import React from "react";
import Image from "next/image";
import lite from "@/assets/images/Lite.webp";
import plus from "@/assets/images/Plus.webp";
import storytellers from "@/assets/images/storyteller.webp";

export default function PlanCard({ title, price, features, current }) {
  return (
    <div className="flex flex-col items-center p-4 border rounded-lg shadow-lg">
      <div className="relative w-full">
        <Image
          src={
            title === "StoryBook Lite"
              ? lite
              : title === "StoryBook Plus"
              ? plus
              : storytellers
          }
          alt={title}
          className="rounded-t-lg"
          width={500}
          height={300}
        />
        <h3 className="absolute text-xl font-semibold text-white bottom-2 left-2">
          {title}
        </h3>
      </div>
      <div className="flex flex-col items-center w-full p-4">
        <p className="text-2xl font-bold text-gray-800">{price}</p>
        {current ? (
          <button className="px-4 py-2 mt-4 text-gray-800 bg-gray-300 rounded-full">
            Current Plan
          </button>
        ) : (
          <button className="px-4 py-2 mt-4 text-white bg-blue-500 rounded-full">
            Upgrade
          </button>
        )}
        <ul className="mt-4">
          {features &&
            features.map((feature, index) => (
              <li
                key={index}
                className="flex items-center text-sm text-gray-800"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4 mr-2 text-green-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                {feature}
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
}
