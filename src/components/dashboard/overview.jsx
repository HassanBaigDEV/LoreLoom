import React from "react";

export default function DashboardOverview() {
  return (
    <div className="col-span-2 row-span-2 overflow-hidden bg-white rounded-lg shadow">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900">
          Hey moizzz!
        </h3>
        <p className="max-w-2xl mt-1 text-sm text-gray-500">
          Stories left for today - 3/3
        </p>
        <div className="flex mt-5 space-x-3">
          <button className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-black border border-transparent rounded-md shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
            Create a story
          </button>
          <button className="inline-flex items-center px-4 py-2 text-sm font-medium text-black bg-gray-200 border border-transparent rounded-md shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
            Generate an image
          </button>
        </div>
        <div className="relative w-auto mt-5">
          <img
            className="object-cover w-full rounded-lg brightness-75"
            src="https://d1muf25xaso8hp.cloudfront.net/https%3A%2F%2Fd7613c8cdf83a077fbf660c61bfb62e3.cdn.bubble.io%2Ff1714076964381x992825504655513900%2FPlus.jpg?w=512&h=196&auto=compress&fit=crop&dpr=0.75&_gl=1*tblpto*_gcl_au*Nzk4ODE0OTgzLjE3MDk2MTU0MjI.*_ga*MTk1MjI2OTgxNC4xNjkzMjg1NTky*_ga_BFPVR2DEE2*MTcxNTcwMDc4Ni44OC4xLjE3MTU3MTc1OTguNTkuMC4w"
            alt="Promotion Image"
          />
          <div className="absolute text-white bottom-4 left-4">
            <p className="text-sm">Upgrade Unlimited Stories & more</p>
            <p className="font-bold">Only $14/month</p>
          </div>
          <button className="absolute inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-500 bg-opacity-50 border border-transparent rounded-md shadow-sm bottom-4 right-4 hover:bg-blue-900 hover:bg-opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            Upgrade
          </button>
        </div>
      </div>
    </div>
  );
}
