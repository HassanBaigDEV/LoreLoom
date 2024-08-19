// components/PricingSection.js
import React from "react";

export default function PricingSection() {
  return (
    <section className="flex items-center justify-center min-h-screen">
      <div className="flex flex-row space-x-4 pt-s4">
        {/* Basic Card */}
        <div className="p-8 pr-16 text-center bg-white shadow-xl w-96 rounded-3xl">
          <h1 className="text-2xl font-semibold text-gray-700">Basic</h1>
          <p className="pt-2 tracking-wide">
            <span className="text-gray-400 align-top">$ </span>
            <span className="text-3xl font-semibold">10</span>
            <span className="font-medium text-gray-400">/ user</span>
          </p>
          <hr className="mt-4 border-1" />
          <div className="pt-8">
            <p className="font-semibold text-left text-gray-400">
              <span className="align-middle material-icons">done</span>
              <span className="pl-2">
                Get started with <span className="text-gray-700">messaging</span>
              </span>
            </p>
            <p className="pt-5 font-semibold text-left text-gray-400">
              <span className="align-middle material-icons">done</span>
              <span className="pl-2">
                Flexible <span className="text-gray-700">team meetings</span>
              </span>
            </p>
            <p className="pt-5 font-semibold text-left text-gray-400">
              <span className="align-middle material-icons">done</span>
              <span className="pl-2">
                <span className="text-gray-700">5 TB</span> cloud storage
              </span>
            </p>
            <a href="#" className="">
              <p className="w-full py-4 mt-8 border rounded-xl">
                <span className="font-medium">Choose Plan</span>
                <span className="pl-2 text-sm align-middle material-icons">east</span>
              </p>
            </a>
          </div>
        </div>

        {/* Startup Card */}
        <div className="relative p-8 text-center text-white transform scale-125 bg-green-500 shadow-xl w-96 rounded-3xl">
          <h1 className="text-2xl font-semibold">Startup</h1>
          <p className="pt-2 tracking-wide">
            <span className="text-gray-200 align-top">$ </span>
            <span className="text-3xl font-semibold">12</span>
            <span className="font-medium text-gray-200">/ user</span>
          </p>
          <hr className="mt-4 border-1 border-gray-200" />
          <div className="pt-8">
            <p className="font-semibold text-left text-gray-200">
              <span className="align-middle material-icons">done</span>
              <span className="pl-2">All features in Basic</span>
            </p>
            <p className="pt-5 font-semibold text-left text-gray-200">
              <span className="align-middle material-icons">done</span>
              <span className="pl-2">
                Flexible <span className="text-white">call scheduling</span>
              </span>
            </p>
            <p className="pt-5 font-semibold text-left text-gray-200">
              <span className="align-middle material-icons">done</span>
              <span className="pl-2">
                <span className="text-white">15 TB</span> cloud storage
              </span>
            </p>
            <a href="#" className="">
              <p className="w-full py-4 mt-8 bg-white rounded-xl">
                <span className="font-medium text-green-500">Choose Plan</span>
                <span className="pl-2 text-sm align-middle material-icons text-green-500">east</span>
              </p>
            </a>
          </div>
          <div className="absolute top-4 right-4">
            <p className="px-4 py-1 text-xs tracking-wide text-white bg-black rounded-full">Popular</p>
          </div>
        </div>

        {/* Enterprise Card */}
        <div className="p-8 pl-16 text-center bg-white shadow-xl w-96 rounded-3xl">
          <h1 className="text-2xl font-semibold text-gray-700">Enterprise</h1>
          <p className="pt-2 tracking-wide">
            <span className="text-gray-400 align-top">$ </span>
            <span className="text-3xl font-semibold">20</span>
            <span className="font-medium text-gray-400">/ user</span>
          </p>
          <hr className="mt-4 border-1" />
          <div className="pt-8">
            <p className="font-semibold text-left text-gray-400">
              <span className="align-middle material-icons">done</span>
              <span className="pl-2">All features in Startup</span>
            </p>
            <p className="pt-5 font-semibold text-left text-gray-400">
              <span className="align-middle material-icons">done</span>
              <span className="pl-2">
                <span className="text-gray-700">Unlimited</span> cloud storage
              </span>
            </p>
            <p className="pt-5 font-semibold text-left text-gray-400">
              <span className="align-middle material-icons">done</span>
              <span className="pl-2">
                <span className="text-gray-700">24/7</span> support
              </span>
            </p>
            <a href="#" className="">
              <p className="w-full py-4 mt-8 border rounded-xl">
                <span className="font-medium">Choose Plan</span>
                <span className="pl-2 text-sm align-middle material-icons">east</span>
              </p>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
